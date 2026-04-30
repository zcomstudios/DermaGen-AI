# DButton (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DButton
**Status:** 🟡 → 🟢 (chunk 6 audit)
**Inherits:** DLabel (which inherits Label)

## Audit gaps fixed

| Wiki method | Pre-chunk-6 | After |
|-------------|-------------|-------|
| `SetText` | ✓ | ✓ |
| `SetEnabled(b)` | ✗ | ✓ Added `buttonEnabled` (default true). Disabled buttons render at 50% opacity in the editor and emit `:SetEnabled(false)`. |
| `SetIcon(path)` | ✗ | ✓ Added `buttonIcon`. Renders a 14×14 placeholder to the left of the text. |
| `SetConsoleCommand(cmd, args)` | ✗ | ✓ Added `buttonConsoleCommand` (single string, optional space-separated args). Emits `:SetConsoleCommand("...")`. |
| `SetMaterial` | (skipped — IMaterial-specific) | skip |
| `SetDrawBorder` | (deprecated) | skip |

## Callback additions
| Method | Pre | After |
|--------|-----|-------|
| `DoClick` / `DoRightClick` / `DoMiddleClick` | ✓ | ✓ |
| `DoDoubleClick` | ✗ | ✓ added |
| `OnDepressed` / `OnReleased` | ✗ | ✓ added |

## Caveats / decisions
- `buttonEnabled === false` produces a visually-disabled render AND emits the Lua call. Distinct from an opacity hack.
- Icon path is a string — render shows a 14×14 yellow-bordered placeholder swatch with the path as tooltip. Same convention as DTree, DMenu icons.
