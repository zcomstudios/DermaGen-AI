# DColumnSheet

**Wiki:** https://wiki.facepunch.com/gmod/DColumnSheet
**Status:** 🔴 → 🟢 (chunk 5)
**Inherits:** Panel

## Visual description
Like DPropertySheet but with the tab strip on the LEFT (vertical column of buttons) and the content area on the right. Each tab button shows a label and optional icon. Used for settings panels with many sections.

## Key properties (state)
None special. Children are DTabs (same convention as DPropertySheet).

## Key methods (callbacks)
None standard. Inherits Panel hooks.

## Render strategy
- Outer flex row.
- Left: 80px vertical strip of tab buttons (label + icon stacked).
- Right: content area where the active tab's child renders.
- Override `childrenContainerStyle`: absolute position with `left: 80px`, `top: 0`, `right: 0`, `bottom: 0`.

## Lua emission notes
- **Reuse the existing DTab post-traverse** by extending `isTab` to also fire when parent is `DColumnSheet`. The `AddSheet` signature is identical to DPropertySheet:
  ```lua
  parentVar:AddSheet("Tab Label", panelVar, "icon16/application.png")
  ```
- Add `DColumnSheet` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Default size 400×300.
- Treat DColumnSheet exactly like DPropertySheet at the data-model level — same DTab children convention. The only difference is render layout (vertical vs horizontal tab strip).
- Add to validParents.
