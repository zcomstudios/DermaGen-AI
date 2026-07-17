#!/usr/bin/env node
/**
 * generateVguiRegistry.mjs
 *
 * Regenerates `utils/vguiPanelRegistry.ts` — the data source for the
 * "Import VGUI Panel" modal (File > Import VGUI Panel...).
 *
 * Sources:
 *   1. GMod Wiki   — https://wiki.facepunch.com/gmod/VGUI_Element_List?format=json
 *      Provides the authoritative panel list, categories, and deprecation status.
 *      (The wiki does NOT send CORS headers, so this must run in Node, not the browser.)
 *   2. GitHub      — Facepunch/garrysmod repo. The git tree API enumerates candidate
 *      Lua files; each is scanned for `vgui.Register("Name", ...)` /
 *      `derma.DefineControl("Name", ...)` to map panel class -> defining file.
 *      Engine-level (C++) panels have no Lua file and get `githubUrl: null`.
 *
 * The `imported` flag on each entry is CURATED (it means: the DermaGen
 * implementation was compared against the wiki page + GitHub source and brought
 * to full parity — tracked in knowledge/progress.md). Regenerating the registry
 * PRESERVES existing `imported` values; new panels default to false. On first
 * generation, flags are seeded from knowledge/elements/_index.md 🟢 statuses.
 *
 * Usage:  node scripts/generateVguiRegistry.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(ROOT, 'utils', 'vguiPanelRegistry.ts');

const WIKI_BASE = 'https://wiki.facepunch.com/gmod/';
const GH_REPO = 'Facepunch/garrysmod';
const GH_BRANCH = 'master';
const GH_TREE_API = `https://api.github.com/repos/${GH_REPO}/git/trees/${GH_BRANCH}?recursive=1`;
const GH_RAW = `https://raw.githubusercontent.com/${GH_REPO}/${GH_BRANCH}/`;
const GH_BLOB = `https://github.com/${GH_REPO}/blob/${GH_BRANCH}/`;

// Directories worth scanning for panel registrations.
const SCAN_DIR_PATTERNS = [
  /^garrysmod\/lua\/vgui\/.+\.lua$/,
  /^garrysmod\/gamemodes\/sandbox\/gamemode\/gui\/.+\.lua$/,
  /^garrysmod\/gamemodes\/sandbox\/gamemode\/spawnmenu\/.+\.lua$/,
  /^garrysmod\/lua\/derma\/.+\.lua$/,
];

// NOTE: DermaGen's ComponentType enum contains a few legacy panels (DBevel,
// DRichText, DSysButton) that have been REMOVED from GMod — no wiki page and
// no source file in Facepunch/garrysmod as of 2026-07-14. They are deliberately
// NOT in this registry; the Import VGUI Panel modal appends them at runtime as
// "not on wiki" rows so the drift stays visible.

// Seed for FIRST generation only (no existing registry file). Mirrors the 🟢
// statuses in knowledge/elements/_index.md as of 2026-07-14.
const IMPORTED_SEED = new Set([
  'DFrame', 'DButton', 'DLabel', 'DTextEntry', 'DPanel', 'DCheckBox',
  'DComboBox', 'DListView', 'DPropertySheet', 'DScrollPanel', 'DImage',
  'DColorMixer', 'DSlider', 'DNumSlider', 'DCollapsibleCategory', 'DTree',
  'DColumnSheet', 'DIconLayout', 'DGrid', 'DMenu', 'DMenuBar', 'DHTML',
  'DBinder', 'DColorCube', 'DColorPalette', 'DForm', 'DImageButton',
  'DModelPanel', 'DProgress', 'DRichText', 'DSysButton', 'DVerticalDivider',
  'DNumberWang', 'DBevel', 'DTab',
]);

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': 'DermaGen-registry-generator', ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

/* ---------------------------------------------------------------- wiki --- */

async function fetchWikiPanels() {
  const raw = await fetchText(`${WIKI_BASE}VGUI_Element_List?format=json`);
  const markup = JSON.parse(raw).markup;

  const panels = []; // { name, category, deprecated }
  const seen = new Set();
  let category = 'Uncategorized';

  for (const line of markup.split(/\r?\n/)) {
    const heading = line.match(/^#+\s*(.+?)\s*$/);
    if (heading) {
      category = heading[1].trim();
      continue;
    }
    if (!line.includes('|')) continue;

    // A "name cell" is a table cell whose entire content is a single <page> tag.
    for (const cell of line.split('|')) {
      const m = cell.trim().match(/^<page(?:\s+[^>]*)?>([A-Za-z_][A-Za-z0-9_]*)<\/page>$/);
      if (!m) continue;
      const name = m[1];
      if (seen.has(name)) break;
      seen.add(name);
      panels.push({
        name,
        category,
        deprecated: /deprecated/i.test(category),
      });
      break; // only the first such cell per row is the Name column
    }
  }
  return panels;
}

/* -------------------------------------------------------------- github --- */

async function buildGithubMap() {
  const tree = JSON.parse(await fetchText(GH_TREE_API, { Accept: 'application/vnd.github+json' }));
  if (tree.truncated) console.warn('WARNING: GitHub tree response was truncated.');

  const files = tree.tree
    .filter((e) => e.type === 'blob' && SCAN_DIR_PATTERNS.some((re) => re.test(e.path)))
    .map((e) => e.path);

  console.log(`Scanning ${files.length} Lua files from GitHub for panel registrations...`);

  const classToPath = new Map();
  const registerRe = /(?:vgui\.Register|derma\.DefineControl)\s*\(\s*["']([A-Za-z_][A-Za-z0-9_]*)["']/g;

  const CONCURRENCY = 12;
  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const path = files[cursor++];
      try {
        const src = await fetchText(GH_RAW + path);
        for (const m of src.matchAll(registerRe)) {
          if (!classToPath.has(m[1])) classToPath.set(m[1], path);
        }
      } catch (err) {
        console.warn(`  skip ${path}: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return { classToPath, allPaths: files };
}

/* --------------------------------------------------------------- merge --- */

function loadExistingImportedFlags() {
  if (!existsSync(OUT_FILE)) return null;
  const src = readFileSync(OUT_FILE, 'utf8');
  const m = src.match(/\/\* __VGUI_DATA_START__ \*\/([\s\S]*?)\/\* __VGUI_DATA_END__ \*\//);
  if (!m) return null;
  try {
    const rows = JSON.parse(m[1]);
    return new Map(rows.map((r) => [r.name, !!r.imported]));
  } catch {
    console.warn('WARNING: could not parse existing registry; imported flags reset to seed.');
    return null;
  }
}

/* ---------------------------------------------------------------- main --- */

const wikiPanels = await fetchWikiPanels();
console.log(`Wiki: found ${wikiPanels.length} panels in VGUI_Element_List.`);

const { classToPath } = await buildGithubMap();
console.log(`GitHub: found ${classToPath.size} registered panel classes.`);

const existingFlags = loadExistingImportedFlags();

const rows = wikiPanels.map((p) => {
  // Prefer an exact registration match; fall back to filename convention (dbutton.lua).
  let path = classToPath.get(p.name) ?? null;
  if (!path) {
    const byFile = `garrysmod/lua/vgui/${p.name.toLowerCase()}.lua`;
    for (const candidate of classToPath.values()) {
      if (candidate === byFile) { path = byFile; break; }
    }
  }
  const imported = existingFlags?.get(p.name) ?? IMPORTED_SEED.has(p.name);
  return {
    name: p.name,
    category: p.category,
    deprecated: p.deprecated,
    wikiUrl: WIKI_BASE + p.name,
    githubUrl: path ? GH_BLOB + path : null,
    imported,
  };
});

const unmatched = rows.filter((r) => !r.githubUrl).map((r) => r.name);
console.log(`GitHub URL matched for ${rows.length - unmatched.length}/${rows.length} panels.`);
if (unmatched.length) console.log(`No Lua source (engine or unmatched): ${unmatched.join(', ')}`);

const banner = `// AUTO-GENERATED by scripts/generateVguiRegistry.mjs — ${new Date().toISOString().slice(0, 10)}
// Do not edit the row data by hand EXCEPT the "imported" flags, which are
// curated (see knowledge/progress.md) and preserved when the script re-runs.

export interface VguiPanelInfo {
  /** Panel class name, e.g. "DButton" */
  name: string;
  /** Section heading from the wiki's VGUI_Element_List page */
  category: string;
  /** True if listed under "Deprecated panels" on the wiki */
  deprecated: boolean;
  /** GMod wiki page for the panel */
  wikiUrl: string;
  /** Defining Lua file in Facepunch/garrysmod, or null for engine (C++) panels */
  githubUrl: string | null;
  /**
   * Curated flag: DermaGen's implementation has been compared against the
   * wiki page content AND the GitHub source, and implemented fully.
   */
  imported: boolean;
}

export const VGUI_PANELS: VguiPanelInfo[] =
/* __VGUI_DATA_START__ */
${JSON.stringify(rows, null, 2)}
/* __VGUI_DATA_END__ */
;
`;

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, banner, 'utf8');
console.log(`Wrote ${OUT_FILE} (${rows.length} panels).`);
