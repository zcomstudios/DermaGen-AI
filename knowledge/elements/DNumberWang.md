# DNumberWang

**Wiki:** https://wiki.facepunch.com/gmod/DNumberWang
**Status:** 🔴 → 🟢 (chunk 2)
**Inherits:** DTextEntry

## Visual description
A small numeric input field with stacked up/down arrows on the right edge (▲ above ▼). The up/down buttons step the value by `interval`. Looks like a Win9x-style numeric spinner.

## Key properties (state)
Reuses **slider family** props from chunk 1 (no new prop names needed):
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `sliderMin` | number | 0 | `SetMin(n)` | Min value |
| `sliderMax` | number | 100 | `SetMax(n)` | Max value |
| `sliderValue` | number | 0 | `SetValue(n)` | Current value |
| `sliderDecimals` | number | 0 | `SetDecimals(n)` | Display precision |

New:
| Prop | Type | Default | Lua method |
|------|------|---------|-----------|
| `numberInterval` | number | 1 | `SetInterval(n)` |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnValueChanged` | self, val | Value changes |

## Render strategy
- Outer div: white-bg input chrome (like DTextEntry).
- Inner: numeric value display on left (`val.toFixed(decimals)`), and a 14px-wide column on the right with two stacked tiny buttons rendering ▲ and ▼ glyphs.
- Buttons are visual-only on canvas (no event handlers — declarative editor).

## Lua emission notes
Emit `SetMin`/`SetMax`/`SetDecimals`/`SetInterval`/`SetValue` (value last so it clamps). If `numberInterval` defined, emit `SetInterval`.
Add `DNumberWang` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Reuses the chunk-1 `slider*` family for min/max/value/decimals — keeps the props panel logic shared with DNumSlider.
- New prop `numberInterval` (instead of `sliderInterval`) because conceptually it's not a slider step.
- Default size 60×22.
