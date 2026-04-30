# DImageButton

**Wiki:** https://wiki.facepunch.com/gmod/DImageButton
**Status:** 🔴 → 🟡 (this chunk)
**Inherits:** DButton (which inherits DLabel)

## Visual description
A clickable button whose face is an image (vs. text on a normal DButton). Like DImage but clickable and with hover behavior. May tint the image, may stretch to fit or preserve aspect ratio.

## Key properties (state)
Reuses existing image props from `ComponentProps`:
- `imageUrl` (existing) — the image file/URL.
- `imageColor` (existing) — tint color.

New:
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `imageStretchToFit` | boolean | true | `SetStretchToFit(b)` | Stretch ignoring aspect ratio |
| `imageKeepAspect` | boolean | false | `SetKeepAspect(b)` | Preserve aspect, fill button |

## Key methods (callbacks)
Inherits all from DButton:
| Method | Args | When fired |
|--------|------|------------|
| `DoClick` | self | Left click |
| `DoRightClick` | self | Right click |
| `DoMiddleClick` | self | Middle click |

## Render strategy
- A `<div>` with the same hover treatment as DButton (slight bg change on hover).
- An inner `<img>` (when `imageUrl` set) with object-fit driven by `imageStretchToFit`/`imageKeepAspect`:
  - `keepAspect` true → `object-fit: contain`
  - `stretchToFit` true (default, and keepAspect false) → `object-fit: fill`
  - both false → natural size (no scale)
- Tint via `mixBlendMode: 'multiply'` over `imageColor` (same as DImage).
- Empty state: dashed-border placeholder with "No Image" text (same pattern as DImage).

## Lua emission notes
Emit `SetImage(url)` if set. Then `SetColor(rgba)` if `imageColor` set. Then `SetStretchToFit` and `SetKeepAspect` if their props differ from defaults.
Inherit DButton's DoClick handling — already covered by the generic methods system.

## Caveats / decisions
- Default to `stretchToFit = true` (matches game default) so newly-added button shows the image filling the box.
- Default size 64×64 (icon-style).
- Add `DImageButton` to `TEXT_EDITABLE_TYPES`? **No** — DImageButton has no visible text typically. The user can still set `text` via the props panel if they want, but skip double-click.
