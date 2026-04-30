# DMenu

**Wiki:** https://wiki.facepunch.com/gmod/DMenu
**Status:** 🔴 → 🟢 (chunk 4)
**Inherits:** DScrollPanel

## Visual description
A vertical popup menu. Each row is a clickable option with an optional icon column on the left. Options can be separated by horizontal spacer lines. At runtime, the menu is positioned at click point via `:Open(x, y)`.

In the editor we render the menu in-place as a static panel showing all its options (no popup behavior).

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `menuItems` | string (newline-separated) | DEFAULT_MENU | `AddOption(...)` per line | See format below |
| `menuMinWidth` | number | (none) | `SetMinimumWidth(n)` | Min width constraint |
| `menuMaxHeight` | number | (none) | `SetMaxHeight(n)` | Scrollbar threshold |
| `menuShowIconColumn` | boolean | true | `SetDrawColumn(b)` | Show icon column gutter |

### `menuItems` text format
One option per line. `---` is a spacer. Optional `|<icon>` suffix.
```
Open|icon16/folder.png
Save|icon16/disk.png
---
Quit|icon16/door.png
```

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OptionSelected` | self, option, optionText | A menu option is clicked |

## Render strategy
- Vertical column of rows, each row: icon column (16px, only if `menuShowIconColumn`) + label.
- Spacer rows: 1px gray horizontal line.
- Background: dark gray with 1px black border (matches Source UI menu chrome).

## Lua emission notes
- For each non-spacer line: `varName:AddOption("Label", function() end)` and follow with `:SetIcon("path")` chain if icon set.
- For spacer line: `varName:AddSpacer()`.
- Emit `SetMinimumWidth`/`SetMaxHeight`/`SetDrawColumn` if defined.
- Add `DMenu` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Default size 140×120.
- Editor renders menu as static (always-visible) — DMenu is normally a popup but on canvas we treat it as a permanent visible widget so the user can design what's in it.
- The `function() end` placeholder in emitted AddOption calls is intentional — user fills in real callback bodies via the Methods modal if needed.
