# DRichText

**Wiki:** _no dedicated page; based on gmod source_
**Status:** 🔴 → 🟢 (chunk 2)
**Inherits:** RichText (built-in panel), styled like DTextEntry multi-line

## Visual description
A read-only multi-line styled-text container — looks like DTextEntry but allows multiple lines, color/font changes, and an optional scrollbar. Used for chat history, console log views, in-game help text panels, etc.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `text` | string | "Rich text\ncontent here..." | `SetText(s)` then `AppendText(s)` (see notes) | Multi-line content. Use `\n` for line breaks. |
| `richScrollbar` | boolean | true | `SetVerticalScrollbarEnabled(b)` | Show vertical scrollbar |

## Key methods (callbacks)
None commonly overridden in editor scenarios.

## Render strategy
- Outer div: white bg, dark border, inset shadow (matches DTextEntry chrome).
- Inner content: `<div style={{ whiteSpace: 'pre-wrap', overflowY: scrollbar ? 'auto' : 'hidden' }}>` rendering the `text` prop with line breaks preserved.
- Editable via double-click → `<textarea>` (since multi-line). Bind to existing `editableText` flow if practical, else handle as a special case.

## Lua emission notes
DRichText doesn't accept `SetText` directly in newer versions — content is added via `AppendText`. Generator emits:
```lua
varName:SetVerticalScrollbarEnabled(richScrollbar)
varName:AppendText("first line\nsecond line\n...")
```
Add `DRichText` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Reuse `text` prop (with `\n` separators) instead of an array. Keeps the PropertiesPanel simple — a `<textarea>` for the content.
- Skip `editableText` inline edit on canvas (multi-line is awkward) — user edits via PropertiesPanel textarea instead.
- Default size 240×120.
- Default `richScrollbar = true`.
