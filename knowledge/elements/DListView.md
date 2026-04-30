# DListView (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DListView
**Status:** 🟡 → 🟢 (chunk 5 audit)
**Inherits:** DPanel

## Visual description
A multi-column data list with a header row and rows of values. Sortable columns, optional multi-select, optional hidden headers, internal scrollbar.

## Key properties (state)
**Before chunk 5**: only generic Panel props; render had hardcoded "Column 1, Column 2, Item A, Detail A".

**After chunk 5**:
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `listColumns` | string (CSV) | "Name,Value" | `AddColumn(name)` per column | Comma-separated column headers |
| `listRows` | string (newline-of-CSV) | "Foo,42\nBar,7" | `AddLine(...)` per row | One row per line; columns separated by `,` |
| `listMultiSelect` | boolean | false | `SetMultiSelect(b)` | Allow shift-click multi-select |
| `listHideHeaders` | boolean | false | `SetHideHeaders(b)` | Hide column headers |
| `listSortable` | boolean | true | `SetSortable(b)` | Click headers to sort |

## Key methods (callbacks)
Already in `componentDefinitions.ts` from before:
| Method | Args |
|--------|------|
| `OnRowSelected` | self, rowIndex, row |
| `OnRowRightClick` | self, rowIndex, row |
| `DoDoubleClick` | self, rowIndex, row |

## Render strategy
- Header row (hidden when `listHideHeaders`): one cell per column, equally distributed. Light gradient bg.
- Body: per-row flex, alternating row colors for readability.
- Cells truncate text with ellipsis if too long.

## Lua emission notes
- For each column: `varName:AddColumn("Name")`.
- For each row, parse CSV → emit `varName:AddLine("v1", "v2", ...)` with proper string quoting/escaping.
- Then config: `SetMultiSelect`, `SetHideHeaders`, `SetSortable` if differ from defaults.
- Already on `safeToOverridePaint` exclusion list (was there from initial codebase).

## Caveats / decisions
- Reuses CSV-string + newline-of-CSV pattern (chunks 3+4). PropertiesPanel uses textareas.
- Quote escaping in row values: replace `"` with `\\"` when emitting Lua strings.
- Default size unchanged (200×150).
