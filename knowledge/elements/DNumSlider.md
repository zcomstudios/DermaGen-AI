# DNumSlider

**Wiki:** https://wiki.facepunch.com/gmod/DNumSlider
**Status:** 🔴 → 🟡 (this chunk)
**Inherits:** Panel

## Visual description
A composite control with three parts laid out horizontally:
- Label (text) on the left.
- A horizontal slider track + knob in the middle (takes the most space).
- A small numeric `DTextEntry` showing the current value on the right.

The knob position represents `(value - min) / (max - min)`.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `sliderMin` | number | 0 | `SetMin(n)` | Min value |
| `sliderMax` | number | 100 | `SetMax(n)` | Max value |
| `sliderValue` | number | 50 | `SetValue(n)` | Current value |
| `sliderDecimals` | number | 0 | `SetDecimals(n)` | Display precision |
| `sliderConVar` | string | (none) | `SetConVar(s)` | Optional ConVar binding |
| `text` | string | "Slider" | `SetText(s)` | Label text (reuses existing prop) |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnValueChanged` | self, value | Value changes via code or UI |

## Render strategy
- Outer div: flex row, `align-items: center`, gap 4px.
- Label: `min-width: 80px`, `text-align: right` (Derma default), `flex-shrink: 0`.
- Slider track: `flex: 1`, ~12px tall, with knob at the computed position.
- Number entry: small `DTextEntry`-like box (~50px wide) showing `sliderValue.toFixed(sliderDecimals)`.
- Editable text via `editableText` for the LABEL (since `text` is the label per Derma `:SetText`).

## Lua emission notes
Emit in order: `SetText`, `SetMin`, `SetMax`, `SetDecimals`, `SetValue` (value last so it's clamped to the just-set min/max). Then `SetConVar` if present. Add to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Reuse existing `text` prop for label.
- Default `sliderMin: 0, sliderMax: 100, sliderValue: 50, sliderDecimals: 0` — typical "percent" slider.
- Default size 220×24 (label + track + entry).
