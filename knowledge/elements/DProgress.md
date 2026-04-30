# DProgress

**Wiki:** https://wiki.facepunch.com/gmod/DProgress
**Status:** 🔴 → 🟡 (this chunk)
**Inherits:** Panel

## Visual description
A horizontal progress bar. Outer rounded rectangle (track) with an inner filled rectangle whose width is `fraction * containerWidth`. The fill is typically a bright accent color. No text.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `progressFraction` | number 0–1 | 0.5 | `SetFraction(n)` | Fill ratio |

## Key methods (callbacks)
None per wiki — display-only.

## Render strategy
- Outer div: track styling (dark inset rounded box).
- Inner div: width = `${(progressFraction ?? 0) * 100}%`, full height, accent color (default Garry's Mod-blue `#3399FF`).
- Element-level `color` prop overrides fill color.

## Lua emission notes
Emit only `SetFraction(...)` if `progressFraction` is set.
Add `DProgress` to `safeToOverridePaint` exclusion list — its internal Paint draws the track + fill.

## Caveats / decisions
- Use existing `color` prop for fill color override; no new prop needed.
- Default size 200×16 (typical Derma progress strip).
- Default `progressFraction = 0.5` so it's visibly populated when first added.
