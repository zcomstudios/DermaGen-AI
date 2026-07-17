// Effective-skin resolver: overlays a sparse SkinDef onto the Default baseline
// and produces the fully-populated EffectiveSkin the canvas consumes.
//
// HARD CONTRACT: `resolveEffectiveSkin(null).preview` matches SKIN_DEFAULTS
// exactly for its 8 keys (zero visual regression when no skin is active).

import { useActiveSkin, getActiveSkin } from './skinRegistry';
import { SkinColor, SkinDef, EffectiveSkin, ResolvedColours } from './skinTypes';
import {
  DEFAULT_SKIN_SCALARS,
  DEFAULT_SKIN_COLOURS,
  DEFAULT_SKIN_FONTS,
  skinColorToHex,
} from './skinConstants';
import { SKIN_DEFAULTS } from './skinDefaults';

// Canvas-literal baselines for the non-SKIN_DEFAULTS preview fields. These match
// the hardcoded values currently used in Canvas.tsx so Phase 2 is zero-regression.
const PREVIEW_LITERALS = {
  textEntryBG: 'white',
  textEntryText: 'black',
  textEntryPlaceholder: '#999',
  listViewSelected: '#3399FF',
  listViewHover: '#3399FF',
} as const;

/** Deep-merge helper: returns baseline value, overlaid by override if present. */
const pick = (override: SkinColor | undefined, base: SkinColor): SkinColor =>
  override ?? base;

/** Hex of an override if present, else undefined (override-only preview fields). */
const overrideHex = (override: SkinColor | undefined): string | undefined =>
  override ? skinColorToHex(override) : undefined;

/** Hex of an override if present, else the literal baseline. */
const hexOr = (override: SkinColor | undefined, baseline: string): string =>
  override ? skinColorToHex(override) : baseline;

export const resolveEffectiveSkin = (def: SkinDef | null): EffectiveSkin => {
  const s = def?.scalars ?? {};
  const co = def?.colours ?? {};

  // Fully-populated scalars: baseline overlaid by any overrides.
  const scalars = { ...DEFAULT_SKIN_SCALARS };
  for (const key of Object.keys(s) as (keyof typeof s)[]) {
    const v = s[key];
    if (v) scalars[key] = v;
  }

  // Fully-populated colours (exposed leaves).
  const colours: ResolvedColours = {
    Window: {
      TitleActive:   pick(co.Window?.TitleActive, DEFAULT_SKIN_COLOURS.Window.TitleActive),
      TitleInactive: pick(co.Window?.TitleInactive, DEFAULT_SKIN_COLOURS.Window.TitleInactive),
    },
    Button: {
      Normal:   pick(co.Button?.Normal, DEFAULT_SKIN_COLOURS.Button.Normal),
      Hover:    pick(co.Button?.Hover, DEFAULT_SKIN_COLOURS.Button.Hover),
      Down:     pick(co.Button?.Down, DEFAULT_SKIN_COLOURS.Button.Down),
      Disabled: pick(co.Button?.Disabled, DEFAULT_SKIN_COLOURS.Button.Disabled),
    },
    Label: {
      Default:   pick(co.Label?.Default, DEFAULT_SKIN_COLOURS.Label.Default),
      Bright:    pick(co.Label?.Bright, DEFAULT_SKIN_COLOURS.Label.Bright),
      Dark:      pick(co.Label?.Dark, DEFAULT_SKIN_COLOURS.Label.Dark),
      Highlight: pick(co.Label?.Highlight, DEFAULT_SKIN_COLOURS.Label.Highlight),
    },
    Tree: {
      Lines:    pick(co.Tree?.Lines, DEFAULT_SKIN_COLOURS.Tree.Lines),
      Normal:   pick(co.Tree?.Normal, DEFAULT_SKIN_COLOURS.Tree.Normal),
      Hover:    pick(co.Tree?.Hover, DEFAULT_SKIN_COLOURS.Tree.Hover),
      Selected: pick(co.Tree?.Selected, DEFAULT_SKIN_COLOURS.Tree.Selected),
    },
    Category: {
      Header:        pick(co.Category?.Header, DEFAULT_SKIN_COLOURS.Category.Header),
      Header_Closed: pick(co.Category?.Header_Closed, DEFAULT_SKIN_COLOURS.Category.Header_Closed),
    },
    Tab: {
      Active: {
        Normal:   pick(co.Tab?.Active?.Normal, DEFAULT_SKIN_COLOURS.Tab.Active.Normal),
        Hover:    pick(co.Tab?.Active?.Hover, DEFAULT_SKIN_COLOURS.Tab.Active.Hover),
        Down:     pick(co.Tab?.Active?.Down, DEFAULT_SKIN_COLOURS.Tab.Active.Down),
        Disabled: pick(co.Tab?.Active?.Disabled, DEFAULT_SKIN_COLOURS.Tab.Active.Disabled),
      },
      Inactive: {
        Normal:   pick(co.Tab?.Inactive?.Normal, DEFAULT_SKIN_COLOURS.Tab.Inactive.Normal),
        Hover:    pick(co.Tab?.Inactive?.Hover, DEFAULT_SKIN_COLOURS.Tab.Inactive.Hover),
        Down:     pick(co.Tab?.Inactive?.Down, DEFAULT_SKIN_COLOURS.Tab.Inactive.Down),
        Disabled: pick(co.Tab?.Inactive?.Disabled, DEFAULT_SKIN_COLOURS.Tab.Inactive.Disabled),
      },
    },
    TooltipText: pick(co.TooltipText, DEFAULT_SKIN_COLOURS.TooltipText),
  };

  // Preview map. The 8 SKIN_DEFAULTS keys default to the SKIN_DEFAULTS literals
  // (contract), overlaid only when the mapped override is present.
  const preview = {
    // --- 8 original SKIN_DEFAULTS keys (baseline is SKIN_DEFAULTS by construction) ---
    panel:          hexOr(s.bg_color_bright, SKIN_DEFAULTS.panel),
    collapsible:    hexOr(s.bg_color_bright, SKIN_DEFAULTS.collapsible),
    form:           hexOr(s.bg_color_bright, SKIN_DEFAULTS.form),
    buttonNormal:   hexOr(co.Button?.Normal, SKIN_DEFAULTS.buttonNormal),
    buttonHover:    hexOr(co.Button?.Hover, SKIN_DEFAULTS.buttonHover),
    buttonDisabled: hexOr(co.Button?.Disabled, SKIN_DEFAULTS.buttonDisabled),
    frame:          hexOr(s.bg_color, SKIN_DEFAULTS.frame),
    bevel:          hexOr(s.bg_color_dark, SKIN_DEFAULTS.bevel),
    // --- text entries ---
    textEntryBG:          hexOr(s.colTextEntryBG, PREVIEW_LITERALS.textEntryBG),
    textEntryText:        hexOr(s.colTextEntryText, PREVIEW_LITERALS.textEntryText),
    textEntryPlaceholder: hexOr(s.colTextEntryTextPlaceholder, PREVIEW_LITERALS.textEntryPlaceholder),
    // --- listview ---
    listViewSelected: hexOr(s.listview_selected, PREVIEW_LITERALS.listViewSelected),
    listViewHover:    hexOr(s.listview_hover, PREVIEW_LITERALS.listViewHover),
    // --- override-only (undefined => Canvas keeps its derived/class default) ---
    buttonText:     overrideHex(s.colButtonText),
    labelText:      overrideHex(s.text_normal),
    frameTitleText: overrideHex(co.Window?.TitleActive),
  };

  return {
    scalars,
    colours,
    fonts: {
      frame: def?.fontFrame ?? DEFAULT_SKIN_FONTS.frame,
      tab: def?.fontTab ?? DEFAULT_SKIN_FONTS.tab,
      categoryHeader: def?.fontCategoryHeader ?? DEFAULT_SKIN_FONTS.categoryHeader,
    },
    preview,
  };
};

/** React hook — resolves the currently-active skin, re-rendering on change. */
export const useActiveEffectiveSkin = (): EffectiveSkin =>
  resolveEffectiveSkin(useActiveSkin());

/** Non-hook accessor — for plain functions (e.g. non-component renderers). */
export const getActiveEffectiveSkin = (): EffectiveSkin =>
  resolveEffectiveSkin(getActiveSkin());
