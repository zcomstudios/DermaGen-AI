# Codebase Touchpoints

Where to wire each kind of change when adding/upgrading an element. File paths are relative to repo root.

## Type & data model

**`types.ts`**
- `ComponentType` enum (line ~2): all 39 element types are already enumerated here.
- `ComponentProps` interface (line ~42): the universal prop bag. **Add new fields here** for element-specific state (e.g. `sliderMin`, `sliderMax`, `progressFraction`). Optional fields are preferred; the universal bag means we don't have a per-element interface.

## Sidebar palette

**`components/Sidebar.tsx`**
- `COMPONENT_INFO` map (line ~10): add `{ desc, icon }`. The icon is a `lucide-react` component. If the element isn't in this map, the sidebar falls back to the generic `Box` icon and a "Insert a `<Type>` element." description — this is why some elements look generic.

## Canvas rendering (the big one)

**`components/Canvas.tsx`**
- `renderVGUIContent` (line ~190): big switch statement. **Add a new `case ComponentType.DXxx:`** that returns the JSX for the element. The function gets `el` (the UIElement) and `isSelected`. Available locals: `bgColor`, `borderColor`, `opacity`, `commonStyle`, `baseText`, `textShadowStyle`, `isHovered`, `editingId`.
- For text-bearing elements, use `editableText(el, text, className, style)` so double-click editing works — see [Canvas.tsx:81](../components/Canvas.tsx#L81).
- For elements that should be added to `TEXT_EDITABLE_TYPES` (line ~6), add their `ComponentType` so double-click triggers inline editing.
- For elements that need parent-aware children rendering (like DPropertySheet's tab content area), see the `childrenContainerStyle` overrides at line ~600.

## Initial element properties

**`App.tsx`**
- `addComponent` (line ~175): switch on `ComponentType` to set default `w`/`h` and any default props (text, color, etc.). **Add element-specific defaults here** so a freshly-added element looks reasonable instead of being a 100×30 box with no text.

## Properties panel (the per-element editor UI)

**`components/PropertiesPanel.tsx`**
- The bottom of the panel has element-specific sections gated by `if (type === ComponentType.DXxx)`. **Add a new section per element** that exposes its custom props (e.g. DSlider needs min/max/decimals/value).
- Use the existing `Section`, `ColorInput` helpers. For boolean toggles use the inline `<input type="checkbox">` pattern.
- For props that need to be parsed as numbers, add the prop name to the `handleChange` int-list (line ~78) or float-list (line ~79).

## Method/callback definitions

**`utils/componentDefinitions.ts`**
- `COMPONENT_METHODS` map (line ~27): add an entry per element with its element-specific methods (e.g. `OnValueChanged` for sliders, `DoClick` for buttons).
- The `COMMON_PANEL_METHODS` array (line ~9) already covers Paint, Think, OnRemove, etc. — don't duplicate.

## Lua code generation

**`utils/luaGenerator.ts`**
- The `traverse` function (line ~60) generates `vgui.Create("DXxx", parent)` plus `SetSize`/`SetPos`/`Dock` automatically.
- **Add element-specific Lua emission** in the property-emitting block (around line ~115). Examples already present: DCheckBox `SetChecked`, DFrame `SetDraggable`, DImage `SetImage`, DModelPanel `SetModel`.
- Pattern: `if (el.type === ComponentType.DXxx) { ...emit Set* calls... }`. Skip emitting defaults so the Lua stays clean.
- **CRITICAL:** `safeToOverridePaint` list (line ~199) — if your element has internal painting (DListView, DPropertySheet, DScrollPanel, etc.), add it to this list so the generic Paint override doesn't clobber its visuals.

## Lua import / round-trip

**`utils/luaParser.ts`** (read-only context, don't break)
- The parser recognizes `vgui.Create("Type", parent)` and re-creates the tree. New elements are auto-supported as long as they're in the `ComponentType` enum.

## State container & undo

**`App.tsx`** `pushState` vs in-place patch in `updateComponent`
- `pushState` creates an undo entry. Use for: structural changes (add/delete/reparent).
- `updateComponent` (in-place) does NOT create an undo entry. Use for: continuous prop tweaking (drag, resize, lock toggle, text edit). This is the existing convention — preserve it.

## Render scale awareness

When drawing UI chrome that should be a constant pixel size regardless of canvas zoom, divide by `viewState.zoom`. See the hover toolbar at [Canvas.tsx:679](../components/Canvas.tsx#L679) for the pattern: `btnSize = 16 / z`.
