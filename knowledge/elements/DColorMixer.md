# DColorMixer

**Wiki:** https://wiki.facepunch.com/gmod/DColorMixer
**Status:** 🔴 → 🟢 (chunk 3)
**Inherits:** DPanel

## Visual description
A composite color-picker panel. Standard layout: a 2D color cube (saturation × value) on the left, an optional alpha bar on the right, an optional swatches palette below, optional RGBA "wangs" (numeric inputs) on the right side, and an optional label across the bottom or top. The current color is shown in a swatch.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `mixerColor` | string (hex) | "#ff8000" | `SetColor(Color(r,g,b,a))` | The picked color (alpha-aware) |
| `mixerAlpha` | number 0–255 | 255 | (part of `SetColor`) | Alpha channel |
| `mixerShowAlphaBar` | boolean | true | `SetAlphaBar(b)` | Show alpha slider |
| `mixerShowPalette` | boolean | true | `SetPalette(b)` | Show preset swatches |
| `mixerShowWangs` | boolean | true | `SetWangs(b)` | Show RGBA numeric inputs |
| `mixerLabel` | string | (none) | `SetLabel(s)` | Optional label text |
| `mixerConVarR` | string | (none) | `SetConVarR(s)` | ConVar binding for R |
| `mixerConVarG` | string | (none) | `SetConVarG(s)` | ConVar binding for G |
| `mixerConVarB` | string | (none) | `SetConVarB(s)` | ConVar binding for B |
| `mixerConVarA` | string | (none) | `SetConVarA(s)` | ConVar binding for A |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `ValueChanged` | self, col | User picks a color |

## Render strategy
- Outer container with background `#2a2a2a`.
- Top row: hue-saturation gradient square (~50% width) + alpha bar (thin column) + wangs column (4 small RGBA inputs stacked).
- Bottom row: palette strip (10–14 small swatches in 2 rows).
- Optional label at the very bottom.
- All sub-zones conditionally rendered based on the `mixerShow*` props.
- Current color shown as a small swatch overlay in the corner.

## Lua emission notes
Emit in order:
1. `SetAlphaBar(b)`, `SetPalette(b)`, `SetWangs(b)` if defined.
2. `SetLabel(s)` if set.
3. `SetConVarR/G/B/A(s)` if set.
4. `SetColor(Color(r, g, b, a))` last so wangs reflect the value.

Add `DColorMixer` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- We don't model individual sub-component sizing — the editor renders a representative composite.
- Default `mixerColor = "#ff8000"`, `mixerAlpha = 255`.
- Default size 220×260 (typical mixer footprint with all subpanels visible).
