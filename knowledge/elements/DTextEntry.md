# DTextEntry (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DTextEntry
**Status:** 🟡 → 🟢 (chunk 6 audit)
**Inherits:** TextEntry

## Audit gaps fixed (significant — DTextEntry was the most under-modeled)

| Wiki method | Pre-chunk-6 | After |
|-------------|-------------|-------|
| `SetText` / `SetValue` | ✓ (via `text`) | ✓ |
| `SetMultiline(b)` | ✗ | ✓ Added `entryMultiline`. Render switches to a multi-line text area when true. |
| `SetNumeric(b)` | ✗ | ✓ Added `entryNumeric`. |
| `SetEditable(b)` | ✗ | ✓ Added `entryEditable` (default true). |
| `SetEnterAllowed(b)` | ✗ | ✓ Added `entryEnterAllowed`. |
| `SetUpdateOnType(b)` | ✗ | ✓ Added `entryUpdateOnType`. |
| `SetPlaceholderText(s)` | ✗ | ✓ Added `entryPlaceholderText`. Render shows it in muted gray when `text` is empty. |
| `SetMaximumCharCount(n)` | ✗ | ✓ Added `entryMaxChars`. |
| `SetTextColor` | ✗ | ✓ Added `entryTextColor`. |
| `SetFont` | ✓ (via fontFamily) | ✓ |

## Callback additions
| Method | Pre | After |
|--------|-----|-------|
| `OnEnter`, `OnChange`, `OnGetFocus`, `OnLoseFocus`, `AllowInput` | ✓ | ✓ |
| `OnValueChange` | ✗ | ✓ added |
| `OnKeyCode` | ✗ | ✓ added |

## Render strategy
Single-line: existing chrome (white box, inset shadow, 1px text cursor when empty).
Multi-line: same chrome but text wraps and the cursor/empty-state behavior is suppressed; placeholder shows centered/top-aligned.

## Caveats / decisions
- DTextEntry was missing 8 commonly-used setters — biggest audit delta of the chunk.
- `entryEditable: false` emits `:SetEditable(false)` but the editor preview keeps the same chrome (real grey-out happens in-game via Derma skin).
- `entryMaxChars` doesn't truncate the editor preview's text — it only ships to Lua.
