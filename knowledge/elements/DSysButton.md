# DSysButton

**Wiki:** _no dedicated page; from gmod source `garrysmod/lua/vgui/dsysbutton.lua`_
**Status:** 🔴 → 🟢 (chunk 3)
**Inherits:** DButton

## Visual description
A small button (typically 16×16 or so) that draws a single system-style glyph from a Source Engine system font. Used inside DFrame title bars for window controls. Glyph determined by `SetType`:
- `"close"` → ✕ (close window)
- `"minim"` → – (minimize)
- `"maxim"` → □ (maximize)
- `"newwin"` → ↗ (new window / external)

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `sysButtonType` | "close" \| "minim" \| "maxim" \| "newwin" | "close" | `SetType(s)` | Which glyph to draw |

## Key methods (callbacks)
Inherits DButton:
| Method | Args | When fired |
|--------|------|------------|
| `DoClick` | self | Left click |

## Render strategy
- Small DButton-like chrome (gray bg, thin border).
- Centered glyph from a Unicode character matching the type.
- Hover state slightly lightens or reddens (close glyph turns red on hover, matching DFrame's close button).

## Lua emission notes
- Emit `SetType("close")` if defined.
- Inherits DButton's `DoClick` via the existing methods system.
- Add `DSysButton` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Default size 16×16.
- Default `sysButtonType = "close"`.
- Glyph rendering uses unicode chars (✕ – □ ↗) since we can't load the Source system font in the editor.
