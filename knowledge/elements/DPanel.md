# DPanel (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DPanel
**Status:** 🟡 → 🟢 (chunk 6 audit)
**Inherits:** Panel

## Audit gaps fixed

| Wiki method | Pre-chunk-6 | After |
|-------------|-------------|-------|
| `SetBackgroundColor` | ✓ (via `color`) | ✓ |
| `SetDisabled(b)` | ✗ | ✓ Added `panelDisabled`. Editor preview shows ~50% opacity when true. |
| `SetPaintBackground(b)` | ✗ | ✓ Added `panelPaintBackground` (default true). When false, editor draws a dashed outline only. |

## Callback additions
None — DPanel uses only the common-panel methods that all elements share. Wiki doesn't document any DPanel-specific callbacks.

## Caveats / decisions
- DPanel is intentionally minimal. The two new properties (`panelDisabled`, `panelPaintBackground`) cover the only DPanel-specific setters from the wiki.
- `panelDisabled` is a useful "preview state" — UI mockups often want to show disabled panels in their final layout.
