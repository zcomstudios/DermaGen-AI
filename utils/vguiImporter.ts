import { VguiPanelInfo } from './vguiPanelRegistry';
import {
  DynamicPanelDef,
  DynamicPanelMethod,
  DynamicPanelProperty,
  registerDynamicPanel,
} from './dynamicPanelRegistry';

// ---------------------------------------------------------------------------
// Progress model
// ---------------------------------------------------------------------------

export type StageStatus = 'pending' | 'active' | 'done' | 'warning' | 'error' | 'skipped';

export interface ImportStageState {
  id: StageId;
  label: string;
  status: StageStatus;
  /** 0..1 within the stage */
  progress: number;
  /** Live detail line, e.g. "14.2 KB fetched" / "12 properties, 23 methods" */
  detail: string;
  weight: number;
}

export interface ImportProgress {
  stages: ImportStageState[];
  /** 0..1 weighted across non-skipped stages */
  overall: number;
  done: boolean;
  error?: string;
  result?: DynamicPanelDef;
}

type StageId = 'github-fetch' | 'github-parse' | 'wiki-fetch' | 'wiki-parse' | 'register';

const STAGE_TEMPLATE: Array<{ id: StageId; label: string; weight: number }> = [
  { id: 'github-fetch', label: 'Fetch GitHub Lua source', weight: 0.3 },
  { id: 'github-parse', label: 'Analyze Lua source (properties & methods)', weight: 0.2 },
  { id: 'wiki-fetch', label: 'Fetch GMod wiki page', weight: 0.25 },
  { id: 'wiki-parse', label: 'Analyze wiki data', weight: 0.1 },
  { id: 'register', label: 'Register panel in Components', weight: 0.15 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
};

/** github.com/.../blob/master/... -> raw.githubusercontent.com/.../master/... */
const toRawGithubUrl = (blobUrl: string): string =>
  blobUrl
    .replace('https://github.com/', 'https://raw.githubusercontent.com/')
    .replace('/blob/', '/');

/**
 * Fetch with byte-level progress. Content-Length on compressed responses may
 * not match the decoded stream, so progress is clamped below 1 until done.
 */
const fetchWithProgress = async (
  url: string,
  onBytes: (received: number, total: number | null) => void
): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const total = Number(res.headers.get('content-length')) || null;
  if (!res.body) {
    const text = await res.text();
    onBytes(text.length, text.length);
    return text;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onBytes(received, total);
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder('utf-8').decode(merged);
};

// ---------------------------------------------------------------------------
// Lua source analysis
// ---------------------------------------------------------------------------

interface LuaAnalysis {
  parent: string | null;
  description: string;
  properties: DynamicPanelProperty[];
  methods: DynamicPanelMethod[];
  hooks: string[];
}

const FORCE_TO_TYPE: Record<string, DynamicPanelProperty['luaType']> = {
  FORCE_BOOL: 'bool',
  FORCE_NUMBER: 'number',
  FORCE_STRING: 'string',
  FORCE_COLOR: 'color',
};

const analyzeLuaSource = (source: string, panelName: string): LuaAnalysis => {
  const properties: DynamicPanelProperty[] = [];
  const methods: DynamicPanelMethod[] = [];
  const hooks: string[] = [];
  let parent: string | null = null;
  let description = '';

  // AccessorFunc( PANEL, "m_bFoo", "Foo", FORCE_BOOL )
  const accessorRe =
    /AccessorFunc\(\s*PANEL\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*(?:,\s*(FORCE_\w+))?\s*\)/g;
  for (let m; (m = accessorRe.exec(source)); ) {
    const [, internalVar, name, force] = m;
    if (properties.some((p) => p.name === name)) continue;
    properties.push({
      name,
      luaType: (force && FORCE_TO_TYPE[force]) || 'unknown',
      getter: `Get${name}`,
      setter: `Set${name}`,
      internalVar,
      source: 'github',
    });
  }

  // function PANEL:MethodName( a, b )
  const methodRe = /function\s+PANEL:([A-Za-z_]\w*)\s*\(([^)]*)\)/g;
  for (let m; (m = methodRe.exec(source)); ) {
    const name = m[1];
    if (methods.some((mm) => mm.name === name)) continue;
    const args = m[2]
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    methods.push({ name, args: ['self', ...args], source: 'github' });
  }

  // Derma_Hook( PANEL, "Paint", "Paint", "Panel" )
  const hookRe = /Derma_Hook\(\s*PANEL\s*,\s*"(\w+)"/g;
  for (let m; (m = hookRe.exec(source)); ) {
    if (!hooks.includes(m[1])) hooks.push(m[1]);
  }

  // derma.DefineControl( "DFoo", "Description", PANEL, "DBase" )
  const defineRe = new RegExp(
    `derma\\.DefineControl\\(\\s*"${panelName}"\\s*,\\s*"([^"]*)"\\s*,\\s*PANEL\\s*,\\s*"([^"]+)"`,
    'i'
  );
  const def = defineRe.exec(source);
  if (def) {
    description = def[1];
    parent = def[2];
  } else {
    // Fall back to any DefineControl in the file (some files define several panels)
    const anyDef = /derma\.DefineControl\(\s*"[^"]+"\s*,\s*"([^"]*)"\s*,\s*PANEL\s*,\s*"([^"]+)"/.exec(source);
    if (anyDef) {
      description = anyDef[1];
      parent = anyDef[2];
    }
  }

  return { parent, description, properties, methods, hooks };
};

// ---------------------------------------------------------------------------
// Wiki analysis
// ---------------------------------------------------------------------------

interface WikiAnalysis {
  parent: string | null;
  realm: string | null;
  description: string;
  /** Method names mentioned as Panel:Method pages for THIS panel */
  methods: string[];
}

const stripWikiTags = (s: string): string =>
  s
    .replace(/<internal>[\s\S]*?<\/internal>|<internal\s*\/>|<internal><\/internal>/g, '')
    .replace(/<page(?:\s[^>]*)?>([^<]*)<\/page>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const analyzeWikiMarkup = (markup: string, panelName: string): WikiAnalysis => {
  const pick = (tag: string): string | null => {
    const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(markup);
    return m ? m[1] : null;
  };

  const parent = pick('parent')?.trim() || null;
  const realm = pick('realm')?.trim() || null;
  const rawDesc = pick('description') || '';
  const description = stripWikiTags(rawDesc);

  // <page>DFoo:MethodName</page> references belonging to this panel
  const methods: string[] = [];
  const pageRe = new RegExp(`<page(?:\\s[^>]*)?>${panelName}:([A-Za-z_]\\w*)<\\/page>`, 'g');
  for (let m; (m = pageRe.exec(markup)); ) {
    if (!methods.includes(m[1])) methods.push(m[1]);
  }

  return { parent, realm, description, methods };
};

// ---------------------------------------------------------------------------
// Default canvas size heuristic (based on resolved parent chain)
// ---------------------------------------------------------------------------

const defaultSizeFor = (name: string, parent: string | null): { w: number; h: number } => {
  const p = (parent || '').toLowerCase();
  const n = name.toLowerCase();
  if (n.includes('button') || p.includes('button')) return { w: 100, h: 30 };
  if (n.includes('label') || p.includes('label')) return { w: 100, h: 20 };
  if (n.includes('bar') || n.includes('slider')) return { w: 150, h: 20 };
  if (n.includes('scroll') || n.includes('list') || n.includes('tree')) return { w: 200, h: 150 };
  return { w: 200, h: 100 };
};

// ---------------------------------------------------------------------------
// Import pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full import pipeline for a panel:
 *   1. Fetch its Lua source from the Facepunch/garrysmod GitHub repo
 *   2. Parse AccessorFunc properties, PANEL: methods, Derma_Hooks, base class
 *   3. Fetch its GMod wiki page (JSON API, via the dev-server proxy)
 *   4. Extract parent / realm / description / method references
 *   5. Merge both sources and register the panel in the dynamic registry
 *
 * onProgress fires with real pipeline state; the returned promise resolves
 * with the final progress snapshot (including result or error).
 */
export const importVguiPanel = async (
  panel: VguiPanelInfo,
  onProgress: (p: ImportProgress) => void
): Promise<ImportProgress> => {
  const stages: ImportStageState[] = STAGE_TEMPLATE.map((s) => ({
    ...s,
    status: 'pending',
    progress: 0,
    detail: '',
  }));

  const state: ImportProgress = { stages, overall: 0, done: false };

  const stage = (id: StageId) => stages.find((s) => s.id === id)!;

  const recompute = () => {
    const active = stages.filter((s) => s.status !== 'skipped');
    const totalWeight = active.reduce((sum, s) => sum + s.weight, 0) || 1;
    state.overall =
      active.reduce((sum, s) => {
        const frac = s.status === 'done' || s.status === 'warning' ? 1 : s.progress;
        return sum + s.weight * frac;
      }, 0) / totalWeight;
    onProgress({ ...state, stages: stages.map((s) => ({ ...s })) });
  };

  const update = (id: StageId, patch: Partial<ImportStageState>) => {
    Object.assign(stage(id), patch);
    recompute();
  };

  const warnings: string[] = [];
  let lua: LuaAnalysis | null = null;
  let wiki: WikiAnalysis | null = null;

  // --- Stage 1+2: GitHub ---------------------------------------------------
  if (!panel.githubUrl) {
    update('github-fetch', { status: 'skipped', detail: 'Engine (C++) panel — no Lua source' });
    update('github-parse', { status: 'skipped', detail: 'Nothing to parse' });
    warnings.push('Engine-level panel: no Lua source; properties/methods come from the wiki only.');
  } else {
    update('github-fetch', { status: 'active', detail: 'Connecting…' });
    try {
      const rawUrl = toRawGithubUrl(panel.githubUrl);
      const source = await fetchWithProgress(rawUrl, (received, total) => {
        const frac = total ? Math.min(received / total, 0.95) : 0.5;
        update('github-fetch', {
          progress: frac,
          detail: total
            ? `${formatBytes(received)} of ~${formatBytes(total)}`
            : `${formatBytes(received)} fetched`,
        });
      });
      update('github-fetch', {
        status: 'done',
        progress: 1,
        detail: `${formatBytes(source.length)} — ${source.split('\n').length} lines`,
      });

      update('github-parse', { status: 'active', progress: 0.3, detail: 'Scanning source…' });
      lua = analyzeLuaSource(source, panel.name);
      update('github-parse', {
        status: 'done',
        progress: 1,
        detail: `${lua.properties.length} properties · ${lua.methods.length} methods · ${lua.hooks.length} hooks${lua.parent ? ` · base ${lua.parent}` : ''}`,
      });
    } catch (e: any) {
      warnings.push(`GitHub source unavailable: ${e?.message || e}`);
      update('github-fetch', { status: 'warning', progress: 1, detail: `Failed: ${e?.message || e}` });
      update('github-parse', { status: 'skipped', detail: 'No source to parse' });
    }
  }

  // --- Stage 3+4: Wiki -----------------------------------------------------
  update('wiki-fetch', { status: 'active', detail: 'Connecting…' });
  try {
    // Dev-server proxy (vite.config.ts) — wiki.facepunch.com sends no CORS headers
    const proxied = `/gmodwiki/${encodeURIComponent(panel.name)}?format=json`;
    const text = await fetchWithProgress(proxied, (received, total) => {
      const frac = total ? Math.min(received / total, 0.95) : 0.5;
      update('wiki-fetch', {
        progress: frac,
        detail: total
          ? `${formatBytes(received)} of ~${formatBytes(total)}`
          : `${formatBytes(received)} fetched`,
      });
    });
    const json = JSON.parse(text);
    const markup: string = json.markup || '';
    update('wiki-fetch', {
      status: 'done',
      progress: 1,
      detail: `Page "${json.title || panel.name}" — ${formatBytes(text.length)}`,
    });

    update('wiki-parse', { status: 'active', progress: 0.3, detail: 'Extracting panel data…' });
    wiki = analyzeWikiMarkup(markup, panel.name);
    const bits = [
      wiki.parent ? `parent ${wiki.parent}` : null,
      wiki.realm ? wiki.realm : null,
      wiki.methods.length ? `${wiki.methods.length} documented methods` : null,
    ].filter(Boolean);
    update('wiki-parse', {
      status: 'done',
      progress: 1,
      detail: bits.length ? bits.join(' · ') : 'Minimal wiki data',
    });
  } catch (e: any) {
    warnings.push(
      `Wiki page unavailable (${e?.message || e}). Run via the Vite dev server for wiki access; continuing with GitHub data.`
    );
    update('wiki-fetch', { status: 'warning', progress: 1, detail: `Failed: ${e?.message || e}` });
    update('wiki-parse', { status: 'skipped', detail: 'No wiki data to analyze' });
  }

  // --- Stage 5: Merge & register -------------------------------------------
  if (!lua && !wiki) {
    const error = 'Both GitHub and wiki lookups failed — cannot import this panel.';
    update('register', { status: 'error', detail: error });
    state.done = true;
    state.error = error;
    recompute();
    return state;
  }

  update('register', { status: 'active', progress: 0.4, detail: 'Merging sources…' });

  const methods: DynamicPanelMethod[] = [...(lua?.methods || [])];
  for (const name of wiki?.methods || []) {
    if (!methods.some((m) => m.name === name)) {
      methods.push({ name, args: ['self'], source: 'wiki' });
    }
  }
  methods.sort((a, b) => a.name.localeCompare(b.name));

  const parent = lua?.parent || wiki?.parent || null;
  const def: DynamicPanelDef = {
    name: panel.name,
    category: panel.category,
    description:
      wiki?.description || lua?.description || `Imported VGUI panel (${panel.category}).`,
    parent,
    realm: wiki?.realm || undefined,
    wikiUrl: panel.wikiUrl,
    githubUrl: panel.githubUrl,
    properties: lua?.properties || [],
    methods,
    hooks: lua?.hooks || [],
    defaultSize: defaultSizeFor(panel.name, parent),
    importedAt: new Date().toISOString(),
    warnings,
  };

  registerDynamicPanel(def);
  update('register', {
    status: warnings.length ? 'warning' : 'done',
    progress: 1,
    detail: `Registered ${def.name} — ${def.properties.length} properties, ${def.methods.length} methods`,
  });

  state.done = true;
  state.result = def;
  recompute();
  return state;
};
