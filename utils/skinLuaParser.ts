// GLua skin-file parser (Derma Skin Editor, Phase 5).
//
// parseSkinLua(source) turns an existing `lua/skins/<name>.lua` file back into a
// SPARSE SkinDef diff (the inverse of utils/skinLuaGenerator.ts). It is a
// line/regex heuristic parser (no full Lua AST), following the same "bail to a
// partial result + warnings, never throw" discipline as utils/luaParser.ts.
//
// It handles BOTH authoring shapes:
//   a) copy-based (our own output):
//        local SKIN = table.Copy( derma.GetNamedSkin( "Default" ) )
//        SKIN.colButtonText          = Color( r, g, b, a )
//        SKIN.Colours.Button.Normal  = Color( r, g, b, a )
//        derma.DefineSkin( "Name", "Desc", SKIN )
//   b) classic (DarkRP / default.lua style):
//        SKIN = {}                    (or `local SKIN = {}`)
//        SKIN.PrintName = "..."
//        SKIN.text_bright = Color( 0, 255, 180 )
//        ...
//
// It WARN-AND-SKIPS (never crashes) on the unparseable-as-color content:
//   - GWEN.TextureColor(...) leaves (atlas pixel samples)
//   - GWEN.CreateTexture* / SKIN.tex.* content (the texture atlas — out of scope)
//   - SKIN:Paint* methods (draw hooks — out of scope)
//   - Material(...) on non-GwenTexture fields
//   - anything else unrecognized
//
// Values equal to the Default baseline (skinConstants) are DROPPED so the result
// stays a minimal diff — importing default.lua yields ~zero overrides on purpose.

import { SkinColor, SkinScalarColorKey, SkinDef } from './skinTypes';
import {
  DEFAULT_SKIN_SCALARS,
  DEFAULT_SKIN_COLOURS,
  DEFAULT_SKIN_FONTS,
  DEFAULT_GWEN_TEXTURE,
  skinColorsEqual,
} from './skinConstants';

export interface ParsedSkin {
  /** A sparse SkinDef diff — no id/name/timestamps (the registry assigns those). */
  def: Partial<SkinDef>;
  /** Registration name from derma.DefineSkin (or PrintName / fallback). */
  name: string;
  /** Description from derma.DefineSkin (or PrintName / fallback). */
  description: string;
  warnings: string[];
}

const SCALAR_KEYS = new Set<string>(Object.keys(DEFAULT_SKIN_SCALARS));

/** Named Lua color constants that resolve to literal RGBA. */
const COLOR_CONSTANTS: Record<string, SkinColor> = {
  color_white: { r: 255, g: 255, b: 255, a: 255 },
  color_black: { r: 0, g: 0, b: 0, a: 255 },
  color_transparent: { r: 255, g: 255, b: 255, a: 0 },
};

const clamp255 = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

/**
 * Strip a trailing Lua line comment (`-- ...` / `---- ...`), but not one that
 * sits inside a double-quoted string. Good enough for skin files, where the only
 * quoted strings are field values (names / paths / fonts) without `--` in them.
 */
const stripComment = (line: string): string => {
  let inStr = false;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    if (ch === '"') inStr = !inStr;
    else if (ch === '-' && line[i + 1] === '-' && !inStr) return line.slice(0, i);
  }
  return line;
};

/**
 * Parse a color RHS expression into RGBA, or null if it is not a literal color.
 * Accepts `Color( r, g, b )`, `Color(r,g,b,a)` (flexible whitespace) and the
 * named constants color_white / color_black / color_transparent.
 */
const parseColorExpr = (rhs: string): SkinColor | null => {
  const trimmed = rhs.trim();

  const constKey = trimmed.replace(/\s*--.*$/, '').trim();
  if (COLOR_CONSTANTS[constKey]) return { ...COLOR_CONSTANTS[constKey] };

  const m = /Color\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)/.exec(trimmed);
  if (!m) return null;
  return {
    r: clamp255(parseInt(m[1], 10)),
    g: clamp255(parseInt(m[2], 10)),
    b: clamp255(parseInt(m[3], 10)),
    a: m[4] !== undefined ? clamp255(parseInt(m[4], 10)) : 255,
  };
};

/** Immutably set a leaf on a nested plain-object tree (creates parents). */
const setLeaf = (root: any, path: string[], value: SkinColor): void => {
  let node = root;
  for (let i = 0; i < path.length - 1; i++) {
    if (!node[path[i]] || typeof node[path[i]] !== 'object') node[path[i]] = {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
};

const getLeaf = (root: any, path: string[]): any =>
  path.reduce((o, k) => (o == null ? undefined : o[k]), root);

const isEmptyDeep = (o: any): boolean => {
  if (!o || typeof o !== 'object') return true;
  return Object.keys(o).every((k) => {
    const v = o[k];
    if (v && typeof v === 'object' && !('r' in v)) return isEmptyDeep(v);
    return false;
  });
};

export const parseSkinLua = (source: string): ParsedSkin | null => {
  try {
    if (typeof source !== 'string' || source.trim() === '') return null;

    const warnings: string[] = [];
    const seenWarn = new Set<string>();
    const warn = (w: string) => {
      if (!seenWarn.has(w)) {
        seenWarn.add(w);
        warnings.push(w);
      }
    };

    // Raw (pre-default-drop) parsed values, keyed by full field name, so aliases
    // like `SKIN.combobox_selected = SKIN.listview_selected` can resolve.
    const rawValues: Record<string, SkinColor> = {};
    const pendingAliases: Array<{ field: string; target: string }> = [];
    const coloursTree: any = {};

    let defineName = '';
    let defineDesc = '';
    let printName = '';
    let author = '';
    let dermaVersion = 1;
    let fontFrame: string | undefined;
    let fontTab: string | undefined;
    let fontCategoryHeader: string | undefined;
    let gwenTexture: string | undefined;
    let sawAnySkin = false;

    const lines = source.split('\n');

    for (const rawLine of lines) {
      const line = stripComment(rawLine).trim();
      if (!line) continue;

      // derma.DefineSkin( "Name", "Desc", SKIN )
      const defMatch = /derma\.DefineSkin\s*\(\s*"([^"]*)"\s*,\s*"([^"]*)"/.exec(line);
      if (defMatch) {
        defineName = defMatch[1];
        defineDesc = defMatch[2];
        continue;
      }

      // Paint hooks: function SKIN:PaintX( ... )
      if (/function\s+SKIN\s*:\s*Paint\w*/.test(line)) {
        warn('Paint hooks not imported (draw logic is inherited from Default).');
        continue;
      }

      // Only care about `SKIN.` / `local SKIN` assignments beyond this point.
      const assign = /^(?:local\s+)?SKIN\s*\.\s*([A-Za-z_][\w.]*?)\s*=\s*(.+)$/.exec(line);
      if (!assign) {
        // `SKIN = {}` / `local SKIN = {}` — just marks the skin table start.
        if (/^(?:local\s+)?SKIN\s*=\s*(\{\s*\}|table\.Copy)/.test(line)) sawAnySkin = true;
        continue;
      }

      sawAnySkin = true;
      const field = assign[1].replace(/\s+/g, '');
      const rhs = assign[2].trim();

      // --- Metadata / fonts --------------------------------------------------
      if (field === 'PrintName') {
        const m = /"([^"]*)"/.exec(rhs);
        if (m) printName = m[1];
        continue;
      }
      if (field === 'Author') {
        const m = /"([^"]*)"/.exec(rhs);
        if (m) author = m[1];
        continue;
      }
      if (field === 'DermaVersion') {
        const m = /(-?\d+)/.exec(rhs);
        if (m) dermaVersion = parseInt(m[1], 10);
        continue;
      }
      if (field === 'fontFrame' || field === 'fontTab' || field === 'fontCategoryHeader') {
        const m = /"([^"]*)"/.exec(rhs);
        if (m) {
          if (field === 'fontFrame') fontFrame = m[1];
          else if (field === 'fontTab') fontTab = m[1];
          else fontCategoryHeader = m[1];
        }
        continue;
      }

      // --- Materials / atlas -------------------------------------------------
      if (/^Material\s*\(/.test(rhs)) {
        const m = /Material\s*\(\s*"([^"]*)"/.exec(rhs);
        if (field === 'GwenTexture') {
          if (m) gwenTexture = m[1];
        } else {
          // texGradientUp/Down and any other Material(...) — no place in SkinDef.
          warn('Textures / atlas materials not imported (out of scope).');
        }
        continue;
      }

      // --- Texture atlas tree: SKIN.tex.* -----------------------------------
      if (field === 'tex' || field.startsWith('tex.')) {
        if (/GWEN\.CreateTexture/.test(rhs) || /^\{\s*\}$/.test(rhs)) {
          warn('Textures / atlas (SKIN.tex) not imported (out of scope).');
        }
        continue;
      }

      // --- Colours tree: SKIN.Colours.* -------------------------------------
      if (field === 'Colours' || field.startsWith('Colours.')) {
        if (/^\{\s*\}$/.test(rhs)) continue; // table init, e.g. SKIN.Colours.Button = {}
        if (/GWEN\.TextureColor/.test(rhs)) {
          warn('Colours atlas samples (GWEN.TextureColor) not imported — set those colors manually.');
          continue;
        }
        const col = parseColorExpr(rhs);
        if (col) {
          const path = field.split('.').slice(1); // drop leading "Colours"
          if (path.length) setLeaf(coloursTree, path, col);
        } else {
          warn('Some Colours leaves used an unrecognized expression and were skipped.');
        }
        continue;
      }

      // --- Scalar colors (legacy §3 fields) ---------------------------------
      if (SCALAR_KEYS.has(field)) {
        // Alias to another SKIN field: SKIN.a = SKIN.b
        const aliasM = /^SKIN\s*\.\s*([A-Za-z_]\w*)\s*$/.exec(rhs);
        if (aliasM) {
          pendingAliases.push({ field, target: aliasM[1] });
          continue;
        }
        const col = parseColorExpr(rhs);
        if (col) {
          rawValues[field] = col;
        } else {
          warn(`Scalar "${field}" used an unrecognized value and was skipped.`);
        }
        continue;
      }

      // --- Unrecognized SKIN.<field> ----------------------------------------
      // Ignore quiet structural noise; warn on genuinely unknown color-ish RHS.
      if (/Color\s*\(|GWEN\./.test(rhs)) {
        warn(`Unrecognized field "${field}" skipped (not a known skin key).`);
      }
    }

    if (!sawAnySkin) return null;

    // Resolve aliases (target may be a scalar parsed above).
    for (const { field, target } of pendingAliases) {
      const resolved = rawValues[target];
      if (resolved) rawValues[field] = { ...resolved };
      else warn(`Alias ${field} = SKIN.${target} could not be resolved (target not imported).`);
    }

    // Build sparse scalars: drop any value equal to the Default baseline.
    const scalars: Partial<Record<SkinScalarColorKey, SkinColor>> = {};
    for (const key of Object.keys(rawValues) as SkinScalarColorKey[]) {
      const v = rawValues[key];
      const def = DEFAULT_SKIN_SCALARS[key];
      if (!def || !skinColorsEqual(v, def)) scalars[key] = v;
    }

    // Build sparse Colours: drop any leaf that equals its (known) Default baseline.
    const dropDefaultColours = (node: any, path: string[]): void => {
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && typeof val === 'object' && 'r' in val) {
          const def = getLeaf(DEFAULT_SKIN_COLOURS, [...path, key]) as SkinColor | undefined;
          if (def && skinColorsEqual(val, def)) delete node[key];
        } else if (val && typeof val === 'object') {
          dropDefaultColours(val, [...path, key]);
          if (isEmptyDeep(val)) delete node[key];
        }
      }
    };
    dropDefaultColours(coloursTree, []);

    // Fonts: drop values equal to the Default baseline.
    const outFontFrame = fontFrame && fontFrame !== DEFAULT_SKIN_FONTS.frame ? fontFrame : undefined;
    const outFontTab = fontTab && fontTab !== DEFAULT_SKIN_FONTS.tab ? fontTab : undefined;
    const outFontCat =
      fontCategoryHeader && fontCategoryHeader !== DEFAULT_SKIN_FONTS.categoryHeader
        ? fontCategoryHeader
        : undefined;

    // GwenTexture: drop if it equals the Default atlas.
    const outGwen = gwenTexture && gwenTexture !== DEFAULT_GWEN_TEXTURE ? gwenTexture : undefined;

    const name = defineName || printName || 'ImportedSkin';
    const description = defineDesc || printName || name;

    const def: Partial<SkinDef> = {
      printName: printName || name,
      author: author || '',
      dermaVersion: Number.isFinite(dermaVersion) ? dermaVersion : 1,
      scalars,
      colours: coloursTree,
    };
    if (outFontFrame) def.fontFrame = outFontFrame;
    if (outFontTab) def.fontTab = outFontTab;
    if (outFontCat) def.fontCategoryHeader = outFontCat;
    if (outGwen) def.gwenTexture = outGwen;

    return { def, name, description, warnings };
  } catch (e) {
    console.error('Failed to parse skin Lua:', e);
    return null;
  }
};
