# DBinder

**Wiki:** https://wiki.facepunch.com/gmod/DBinder
**Status:** 🔴 → 🟢 (chunk 2)
**Inherits:** DButton

## Visual description
A clickable button that displays the currently bound key name (e.g. "F", "MOUSE1", "NONE"). When clicked at runtime it enters bind-capture mode; not relevant in editor.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `binderKey` | string | "NONE" | (display only — see Lua note) | Key name shown on the button face |
| `binderKeyCode` | number | 0 | `SetSelectedNumber(n)` | Numeric KEY_* code |
| `binderConVar` | string | (none) | `SetConVar(s)` | Optional ConVar to bind |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnChange` | self, iNum | Runtime: user picks a new key |

## Render strategy
- Render as a DButton-styled box with the `binderKey` text centered.
- No image, no background custom — just inherit DButton chrome.
- The text rendering uses `binderKey` (or "NONE" fallback).
- Skip `editableText` — the key is conceptually picked at runtime; let the user set it via PropertiesPanel.

## Lua emission notes
Emit `SetSelectedNumber(binderKeyCode)` if defined.
Emit `SetConVar(binderConVar)` if defined.
NB: there's no clean Lua to set the displayed text directly — the button text follows `SetSelectedNumber` at runtime via the binder's internal logic. So the editor's `binderKey` is purely for visual preview.

## Caveats / decisions
- Two related props (`binderKey` for display, `binderKeyCode` for Lua emission) — kept separate because the wiki uses numeric codes (`KEY_F = 8`, etc.) and we don't ship the full key-code table. User sets both if they want them in sync.
- Default size 80×22.
- Default `binderKey = "NONE"`.
