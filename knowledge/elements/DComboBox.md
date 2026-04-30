# DComboBox (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DComboBox
**Status:** 🟡 → 🟢 (chunk 5 audit)
**Inherits:** DButton

## Visual description
A clickable bar that shows the currently-selected value with a ▼ caret on the right. Clicking opens a dropdown menu of choices.

## Key properties (state)
**Before chunk 5**: only `text` (the displayed value); no choices model.

**After chunk 5**:
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `text` | string | "Select..." | `SetValue(s)` | Displayed text in the collapsed state |
| `comboChoices` | string (newline-separated) | "Option A\nOption B\nOption C" | `AddChoice(s)` per line | Available choices |
| `comboSortItems` | boolean | true | `SetSortItems(b)` | Sort choices alphabetically |

## Key methods (callbacks)
Already in `componentDefinitions.ts`:
| Method | Args |
|--------|------|
| `OnSelect` | self, index, value, data |

## Render strategy
Render unchanged from before (collapsed bar + caret). The choices live only in props for emission; no preview of the dropdown opened.

## Lua emission notes
- For each choice: `varName:AddChoice("name")`.
- `SetSortItems(b)` if differs from default.
- For displayed text: change the existing emission to use `SetValue` instead of `SetText` (the wiki documents `SetValue` for the collapsed display).
- DComboBox is NOT on `safeToOverridePaint` exclusion list — its DButton ancestor's paint is the right look. Confirm: yes, the existing render uses DButton-style chrome, so generic Paint is acceptable.

## Caveats / decisions
- Newline-separated choices instead of CSV — choices may legitimately contain commas (e.g. "Yes, please").
- Default `comboChoices` populated so the Lua output is interesting on a fresh add.
- Default size unchanged.
