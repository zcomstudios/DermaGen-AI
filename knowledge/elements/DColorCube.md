# DColorCube

**Wiki:** https://wiki.facepunch.com/gmod/DColorCube
**Status:** 🔴 → 🟢 (chunk 3)
**Inherits:** DSlider

## Visual description
A 2D saturation × value picker. The square shows a gradient with the current base hue: top-left = white, top-right = pure hue, bottom = black. A small crosshair marks the picked SV point. The hue is set externally (typically by a partner DColorPalette or DColorMixer).

## Key properties (state)
Reuses chunk-1 `sliderX`/`sliderY` for the crosshair position (DSlider parent class).
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `cubeBaseColor` | string (hex) | "#ff0000" | `SetBaseRGB(Color(r,g,b))` | The base hue color |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnUserChanged` | self, color | User drags the crosshair |

## Render strategy
- Square (or rectangle) gradient: two layered linear-gradients to produce the saturation/value 2D field.
  - Background: linear-gradient(to right, white, `cubeBaseColor`)
  - Overlay: linear-gradient(to top, black, transparent)
- Crosshair: small `+`-shaped marker positioned at `(sliderX * w, sliderY * h)`.

## Lua emission notes
- `SetBaseRGB(Color(r, g, b))` if `cubeBaseColor` is defined.
- `SetSlideX(sliderX)` / `SetSlideY(sliderY)` from the parent DSlider class — already emitted by the chunk-1 DSlider block, so duplicate guard: only emit them in the DSlider block, NOT here.
- Add `DColorCube` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Reuses chunk-1 slider props since DColorCube inherits DSlider — no new position props.
- Default size 100×100 (square).
- Default `cubeBaseColor = "#ff0000"` (pure red, common starting hue).
- The DSlider block in luaGenerator already emits SetSlideX/Y if those props are set on DColorCube — this works because the type check `el.type === ComponentType.DSlider` would NOT match. We need to extend that check to include DColorCube. **Update luaGenerator's DSlider block to also fire for DColorCube** so the inherited SetSlideX/Y emission works.
