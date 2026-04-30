# DFrame (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DFrame
**Status:** 🟡 → 🟢 (chunk 6 audit)
**Inherits:** EditablePanel

## Audit gaps fixed

| Wiki method | Pre-chunk-6 | After |
|-------------|-------------|-------|
| `SetTitle` | ✓ | ✓ |
| `ShowCloseButton` | ✓ | ✓ |
| `SetDraggable` | ✓ | ✓ |
| `SetSizable` | ✓ | ✓ |
| `SetDeleteOnClose` | ✓ | ✓ |
| `SetIcon(path)` | ✗ | ✓ Added `frameIcon` prop. Renders 14×14 thumbnail in title bar. |
| `SetMinWidth/MinHeight` | ✗ | ✓ Added `frameMinWidth`, `frameMinHeight`. Only emitted if sizable. |
| `SetScreenLock` | ✗ | ✓ Added `frameScreenLock`. |
| `SetBackgroundBlur` | ✗ | ✓ Added `frameBackgroundBlur`. Editor adds a soft backdrop-blur visual hint. |
| `MakePopup` | (always emitted on root) | unchanged |

## Caveats / decisions
- All new fields are optional. Only emit when defined to keep Lua output clean.
- `frameIcon` is a path string (e.g. `icon16/application.png`); editor renders a 14×14 placeholder square (we don't have access to actual icon16 bitmaps).
- `frameMinWidth`/`frameMinHeight` only meaningful if `sizable` is true; emit unconditionally (Derma stores them regardless).
