// Derma Skin Editor — data model.
//
// A `SkinDef` is a SPARSE diff over the Default Derma skin: every field is
// optional, and any absent field inherits Default (mirrors GMod's
// `setmetatable(skin, { __index = DefaultSkin })` semantics — see
// knowledge/research_derma_skins.md §1/§7).
//
// The editor stores literal RGBA and emits literal `Color(r,g,b,a)` on export,
// which is always valid (research §3/§4).

/** A single Derma color as literal RGBA (matches `Color(r,g,b,a)`). a defaults 255. */
export interface SkinColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * The ~45 legacy scalar colors (research §3), keyed by their EXACT Lua field
 * name for 1:1 emission on export. Only overridden keys are present in a
 * `SkinDef.scalars` map.
 */
export type SkinScalarColorKey =
  // Backgrounds / frame
  | 'bg_color' | 'bg_color_sleep' | 'bg_color_dark' | 'bg_color_bright'
  | 'frame_border' | 'bg_alt1' | 'bg_alt2' | 'panel_transback' | 'tooltip'
  // Text
  | 'text_bright' | 'text_normal' | 'text_dark' | 'text_highlight'
  // Control colors
  | 'control_color' | 'control_color_highlight' | 'control_color_active'
  | 'control_color_bright' | 'control_color_dark'
  // ListView / ComboBox
  | 'listview_hover' | 'listview_selected' | 'combobox_selected'
  // Category / number widgets
  | 'colCollapsibleCategory' | 'colCategoryText' | 'colCategoryTextInactive'
  | 'colNumberWangBG' | 'colNumSliderNotch'
  // Text entries
  | 'colTextEntryBG' | 'colTextEntryBorder' | 'colTextEntryText'
  | 'colTextEntryTextHighlight' | 'colTextEntryTextCursor' | 'colTextEntryTextPlaceholder'
  // Menus
  | 'colMenuBG' | 'colMenuBorder'
  // Buttons
  | 'colButtonText' | 'colButtonTextDisabled' | 'colButtonBorder'
  | 'colButtonBorderHighlight' | 'colButtonBorderShadow'
  // Property sheet / tabs
  | 'colPropertySheet' | 'colTab' | 'colTabInactive'
  | 'colTabShadow' | 'colTabText' | 'colTabTextInactive';

/** A 4-state GWEN button-style leaf group. */
export interface SkinButtonStates {
  Normal?: SkinColor;
  Hover?: SkinColor;
  Down?: SkinColor;
  Disabled?: SkinColor;
}

/**
 * The GWEN `Colours` tree (research §4) — every leaf optional, emitted as a
 * literal `Color()` on export. Only the branches the editor exposes in v1 are
 * typed here; the rest of the tree is inherited from Default (never emitted).
 */
export interface SkinColoursOverride {
  Window?: { TitleActive?: SkinColor; TitleInactive?: SkinColor };
  Button?: SkinButtonStates;
  Label?: { Default?: SkinColor; Bright?: SkinColor; Dark?: SkinColor; Highlight?: SkinColor };
  Tree?: { Lines?: SkinColor; Normal?: SkinColor; Hover?: SkinColor; Selected?: SkinColor };
  Category?: { Header?: SkinColor; Header_Closed?: SkinColor };
  Tab?: { Active?: SkinButtonStates; Inactive?: SkinButtonStates };
  TooltipText?: SkinColor;
}

/** A persisted, sparse custom skin (a diff over Default). */
export interface SkinDef {
  id: string;                  // registry key (random id, like element ids)
  name: string;                // Lua registration name + filename ([%w_]+, never "Default")
  printName: string;           // SKIN.PrintName
  author: string;              // SKIN.Author
  dermaVersion: number;        // SKIN.DermaVersion (default 1)
  fontFrame?: string;          // SKIN.fontFrame          (default "DermaDefault")
  fontTab?: string;            // SKIN.fontTab            (default "DermaDefault")
  fontCategoryHeader?: string; // SKIN.fontCategoryHeader (default "TabLarge")
  gwenTexture?: string;        // advanced/export-only material path
  scalars: Partial<Record<SkinScalarColorKey, SkinColor>>; // only overridden scalars
  colours: SkinColoursOverride;                            // only overridden leaves
  createdAt: string;
  updatedAt: string;
}

/**
 * The 8 original + extra canvas preview keys. Core body/face + text-entry +
 * listview keys are ALWAYS populated (baseline = SKIN_DEFAULTS / Canvas
 * literals). The three trailing keys are OVERRIDE-ONLY: `undefined` means
 * "keep Canvas's existing derived/class default" (zero-regression contract).
 */
export interface SkinPreview {
  // Original 8 SKIN_DEFAULTS keys — must match SKIN_DEFAULTS exactly when no override.
  panel: string;
  collapsible: string;
  form: string;
  buttonNormal: string;
  buttonHover: string;
  buttonDisabled: string;
  frame: string;
  bevel: string;
  // Text-entry (baseline: white / black / #999)
  textEntryBG: string;
  textEntryText: string;
  textEntryPlaceholder: string;
  // ListView (baseline: #3399FF)
  listViewSelected: string;
  listViewHover: string;
  // Override-only (undefined => keep existing Canvas fallback)
  buttonText?: string;
  labelText?: string;
  frameTitleText?: string;
}

/** Fully-resolved colours (exposed leaves populated) used by the editor's reset/default display. */
export interface ResolvedColours {
  Window: { TitleActive: SkinColor; TitleInactive: SkinColor };
  Button: { Normal: SkinColor; Hover: SkinColor; Down: SkinColor; Disabled: SkinColor };
  Label: { Default: SkinColor; Bright: SkinColor; Dark: SkinColor; Highlight: SkinColor };
  Tree: { Lines: SkinColor; Normal: SkinColor; Hover: SkinColor; Selected: SkinColor };
  Category: { Header: SkinColor; Header_Closed: SkinColor };
  Tab: {
    Active: { Normal: SkinColor; Hover: SkinColor; Down: SkinColor; Disabled: SkinColor };
    Inactive: { Normal: SkinColor; Hover: SkinColor; Down: SkinColor; Disabled: SkinColor };
  };
  TooltipText: SkinColor;
}

/** A fully-populated (no-optionals) resolved view of a skin, consumed by the canvas. */
export interface EffectiveSkin {
  scalars: Record<SkinScalarColorKey, SkinColor>;
  colours: ResolvedColours;
  fonts: { frame: string; tab: string; categoryHeader: string };
  preview: SkinPreview;
}
