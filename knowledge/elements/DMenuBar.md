# DMenuBar

**Wiki:** https://wiki.facepunch.com/gmod/DMenuBar
**Status:** 🔴 → 🟢 (chunk 4)
**Inherits:** DPanel

## Visual description
A horizontal bar of menu buttons (File, Edit, View, Help...). Each button opens a dropdown DMenu when clicked. Typically docked at the top of a DFrame, below the title bar.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `menuBarItems` | string (newline-separated) | DEFAULT_MENUBAR | `AddMenu(label)` per line | See format below |

### `menuBarItems` text format
One menu per line. Format: `MenuLabel: option1, option2, ---, option3`. Use `---` for spacer.
```
File: New, Open, Save, ---, Quit
Edit: Undo, Redo, ---, Cut, Copy, Paste
View: Toolbar, Status Bar
Help: About
```

## Key methods (callbacks)
None directly. Callbacks live on the individual menus the user creates programmatically.

## Render strategy
- Horizontal flex row of buttons (one per top-level menu), padded ~12px each.
- Background: light gray gradient (matches Source UI menu bar chrome).
- Buttons show on hover and active states.

## Lua emission notes
- For each menu line: `local menu_<n> = varName:AddMenu("Label")` then `menu_<n>:AddOption("Item", function() end)` per option (and `AddSpacer()` for `---`).
- Add `DMenuBar` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Default size 200×22.
- Two related JSON-ish structures (`menuItems` for DMenu, `menuBarItems` for DMenuBar) — kept separate because the format differs (single list vs. nested label:items).
- Editor renders menus as buttons but **does NOT** render the popup dropdowns (would require a hover preview that we don't have machinery for yet).
