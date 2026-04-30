# DSlider

**Wiki:** https://wiki.facepunch.com/gmod/DSlider
**Status:** 🔴 → 🟡 (this chunk)
**Inherits:** Panel

## Visual description
A 1D or 2D slider with a track and a draggable knob. Knob position is normalized 0–1 on each axis. By default it's 1D horizontal (X axis active, Y locked).

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `sliderX` | number 0–1 | 0.5 | `SetSlideX(n)` | Horizontal knob position |
| `sliderY` | number 0–1 | 0.5 | `SetSlideY(n)` | Vertical knob position |
| `sliderLockX` | number 0–1 | (none) | `SetLockX(n)` | If set, knob is constrained on X to this value |
| `sliderLockY` | number 0–1 | (none) | `SetLockY(n)` | If set, knob is constrained on Y to this value |
| `sliderTrapInside` | boolean | false | `SetTrapInside(b)` | Constrain knob fully inside slider bounds |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnValueChanged` | self, x, y | Knob position changes |
| `TranslateValues` | self, x, y | Override hook to remap raw values |

## Render strategy
- Outer div: thin track (8px on the locked axis), inset rounded box.
- Knob div: 12×12 (or square sized to track), absolutely positioned at:
  - `left = (sliderLockX ?? sliderX) * (parent.w - knob.w)`
  - `top  = (sliderLockY ?? sliderY) * (parent.h - knob.h)`
- The knob is purely visual; user updates position via the PropertiesPanel sliders, not by dragging on canvas (consistent with editor model).

## Lua emission notes
Emit `SetSlideX`, `SetSlideY` if defined. `SetLockX`/`SetLockY`/`SetTrapInside` only if those props are set. Add `DSlider` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Treat the slider as 1D-horizontal by default (most common usage). User can set sliderY explicitly to use 2D.
- Default size 150×16 (horizontal track) — wider than tall implies horizontal default.
- Lock props use a sentinel `undefined` to mean "not locked" rather than NaN — easier to round-trip.
