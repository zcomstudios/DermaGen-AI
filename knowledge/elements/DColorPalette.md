# DColorPalette

**Wiki:** https://wiki.facepunch.com/gmod/DColorPalette
**Status:** 🔴 → 🟢 (chunk 3)
**Inherits:** DIconLayout

## Visual description
A grid of small clickable color swatches. Default Derma palette has 14 colors arranged in 2 rows of 7. Click a swatch to pick that color. Often paired with DColorCube/DColorMixer.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `paletteColors` | string (CSV of hex) | DEFAULT_PALETTE_CSV | `SetColorButtons({Color(...), ...})` | Comma-separated hex colors |
| `paletteButtonSize` | number | 16 | `SetButtonSize(n)` | Each swatch's pixel size |
| `paletteNumRows` | number | 2 | `SetNumRows(n)` | Number of rows |
| `paletteConVarR/G/B/A` | string | (none) | `SetConVarR/G/B/A(s)` | ConVar bindings |

`DEFAULT_PALETTE_CSV` = `"#ffffff,#bebebe,#ff0000,#ffa500,#ffff00,#00ff00,#00ffff,#0080ff,#0000ff,#800080,#ff00ff,#ffc0cb,#a52a2a,#000000"` (14 colors).

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnValueChanged` | self, color | Color picked |
| `OnRightClickButton` | self, panel | Right-click on a swatch |

## Render strategy
- Outer flex container with `flex-wrap`, `gap: 2px`.
- Render `paletteColors.length` colored squares of `paletteButtonSize × paletteButtonSize`.
- Wrap to `paletteNumRows` rows visually using a fixed width = `(buttonSize + gap) * Math.ceil(colors.length / numRows)`.

## Lua emission notes
- Parse CSV → array of hex → emit `SetColorButtons({Color(r,g,b), Color(r,g,b), ...})`.
- Emit `SetButtonSize(n)`, `SetNumRows(n)`, `SetConVarR/G/B/A(s)` if defined.
- Add `DColorPalette` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Storing colors as a CSV string keeps the prop bag flat (no array-typed props).
- PropertiesPanel exposes the CSV as a textarea so user can edit directly.
- Default size 120×40 (fits 14 swatches in 2 rows of 7 at 16px).
