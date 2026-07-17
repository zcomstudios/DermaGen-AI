// Default-skin baseline for the Skin Editor.
//
// `DEFAULT_SKIN_SCALARS` holds every §3 scalar with its literal default RGBA
// (verified against garrysmod/lua/skins/default.lua — knowledge/research_derma_skins.md §3).
//
// `DEFAULT_SKIN_COLOURS` holds the exposed `Colours` leaves. NOTE: in the real
// default skin nearly every Colours leaf is an ATLAS PIXEL SAMPLE, not a Lua
// literal (research §4), so these are documented/observed APPROXIMATIONS. They
// only affect the editor's displayed default + reset value — a user-set
// override is always exact.

import { SkinColor, SkinScalarColorKey, ResolvedColours } from './skinTypes';

const c = (r: number, g: number, b: number, a = 255): SkinColor => ({ r, g, b, a });

export const DEFAULT_SKIN_SCALARS: Record<SkinScalarColorKey, SkinColor> = {
  // Backgrounds / frame
  bg_color:        c(101, 100, 105),
  bg_color_sleep:  c(70, 70, 70),
  bg_color_dark:   c(55, 57, 61),
  bg_color_bright: c(220, 220, 220),
  frame_border:    c(50, 50, 50),
  bg_alt1:         c(50, 50, 50),
  bg_alt2:         c(55, 55, 55),
  panel_transback: c(255, 255, 255, 50),
  tooltip:         c(255, 245, 175),
  // Text
  text_bright:     c(255, 255, 255),
  text_normal:     c(180, 180, 180),
  text_dark:       c(20, 20, 20),
  text_highlight:  c(255, 20, 20),
  // Control colors
  control_color:           c(120, 120, 120),
  control_color_highlight: c(150, 150, 150),
  control_color_active:    c(110, 150, 250),
  control_color_bright:    c(255, 200, 100),
  control_color_dark:      c(100, 100, 100),
  // ListView / ComboBox
  listview_hover:    c(70, 70, 70),
  listview_selected: c(100, 170, 220),
  combobox_selected: c(100, 170, 220),
  // Category / number widgets
  colCollapsibleCategory:  c(255, 255, 255, 20),
  colCategoryText:         c(255, 255, 255),
  colCategoryTextInactive: c(200, 200, 200),
  colNumberWangBG:         c(255, 240, 150),
  colNumSliderNotch:       c(0, 0, 0, 100),
  // Text entries
  colTextEntryBG:              c(240, 240, 240),
  colTextEntryBorder:          c(20, 20, 20),
  colTextEntryText:            c(20, 20, 20),
  colTextEntryTextHighlight:   c(20, 200, 250),
  colTextEntryTextCursor:      c(0, 0, 100),
  colTextEntryTextPlaceholder: c(128, 128, 128),
  // Menus
  colMenuBG:     c(255, 255, 255, 200),
  colMenuBorder: c(0, 0, 0, 200),
  // Buttons
  colButtonText:            c(255, 255, 255),
  colButtonTextDisabled:    c(255, 255, 255, 55),
  colButtonBorder:          c(20, 20, 20),
  colButtonBorderHighlight: c(255, 255, 255, 50),
  colButtonBorderShadow:    c(0, 0, 0, 100),
  // Property sheet / tabs
  colPropertySheet:   c(170, 170, 170),
  colTab:             c(170, 170, 170),
  colTabInactive:     c(140, 140, 140),
  colTabShadow:       c(0, 0, 0, 170),
  colTabText:         c(255, 255, 255),
  colTabTextInactive: c(0, 0, 0, 200),
};

// Exposed Colours leaves — APPROXIMATE defaults (atlas-sampled in-game; §4).
export const DEFAULT_SKIN_COLOURS: ResolvedColours = {
  Window: {
    TitleActive:   c(255, 255, 255),
    TitleInactive: c(255, 255, 255),
  },
  Button: {
    // Aligned with the canvas button-face literals (#dcdcdc / #e8e8e8 / #cccccc).
    Normal:   c(220, 220, 220),
    Hover:    c(232, 232, 232),
    Down:     c(180, 180, 180),
    Disabled: c(204, 204, 204),
  },
  Label: {
    Default:   c(255, 255, 255),
    Bright:    c(255, 255, 255),
    Dark:      c(0, 0, 0),
    Highlight: c(255, 0, 0),
  },
  Tree: {
    Lines:    c(200, 200, 200),
    Normal:   c(0, 0, 0),
    Hover:    c(0, 0, 0),
    Selected: c(255, 255, 255),
  },
  Category: {
    Header:        c(0, 0, 0),
    Header_Closed: c(0, 0, 0),
  },
  Tab: {
    Active:   { Normal: c(220, 220, 220), Hover: c(232, 232, 232), Down: c(200, 200, 200), Disabled: c(180, 180, 180) },
    Inactive: { Normal: c(180, 180, 180), Hover: c(200, 200, 200), Down: c(170, 170, 170), Disabled: c(150, 150, 150) },
  },
  TooltipText: c(0, 0, 0),
};

// Default font names (research §3).
export const DEFAULT_SKIN_FONTS = {
  frame: 'DermaDefault',
  tab: 'DermaDefault',
  categoryHeader: 'TabLarge',
} as const;

export const DEFAULT_GWEN_TEXTURE = 'gwenskin/GModDefault.png';

// --- hex <-> SkinColor helpers ---------------------------------------------

const clamp255 = (n: number) => Math.min(255, Math.max(0, Math.round(n || 0)));
const toHex2 = (n: number) => clamp255(n).toString(16).padStart(2, '0');

/** SkinColor -> "#rrggbb" (alpha dropped — for CSS preview / color inputs). */
export const skinColorToHex = (col: SkinColor): string =>
  `#${toHex2(col.r)}${toHex2(col.g)}${toHex2(col.b)}`;

/** "#rrggbb" (+ optional alpha) -> SkinColor. */
export const hexToSkinColor = (hex: string, a = 255): SkinColor => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0, a: clamp255(a) };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
    a: clamp255(a),
  };
};

/** SkinColor -> "rgba(r,g,b,a)" for previews needing alpha. */
export const skinColorToRgba = (col: SkinColor): string =>
  `rgba(${clamp255(col.r)}, ${clamp255(col.g)}, ${clamp255(col.b)}, ${clamp255(col.a) / 255})`;

/** Structural equality (used to detect "same as default" for reset UI). */
export const skinColorsEqual = (a: SkinColor, b: SkinColor): boolean =>
  a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
