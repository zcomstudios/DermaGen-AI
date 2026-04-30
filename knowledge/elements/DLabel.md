# DLabel (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DLabel
**Status:** 🟡 → 🟢 (chunk 6 audit)
**Inherits:** Label

## Audit gaps fixed

| Wiki method | Pre-chunk-6 | After |
|-------------|-------------|-------|
| `SetText` | ✓ | ✓ |
| `SetFont` | ✓ (via fontFamily) | ✓ |
| `SetTextColor` | ✗ | ✓ Added `labelTextColor` (hex). Render uses it when set, falls back to white. Lua emits `:SetTextColor(Color(...))`. |
| `SetAutoStretchVertical` | ✗ | ✓ Added `labelAutoStretchVertical` (boolean). Emits `:SetAutoStretchVertical(true)` when set. Render hint: editor doesn't actually re-flow the label height (we keep manual sizing) but the prop ships to Lua. |
| `SetBright` / `SetDark` / `SetHighlight` | (skin-dependent — skipped) | skip |

## Callback additions
| Method | Pre | After |
|--------|-----|-------|
| (none — DLabel only had common-panel methods) | — | ✓ Added `DoClick`, `DoRightClick`, `DoDoubleClick`, `OnDepressed`, `OnReleased` |

## Caveats / decisions
- `labelTextColor` overrides the default white. Existing color contrast on dark backgrounds needs no change.
- Skipping SetBright/SetDark intentionally — they pull from the active Derma skin which we can't faithfully preview in the editor. User can use `labelTextColor` to set an explicit value.
