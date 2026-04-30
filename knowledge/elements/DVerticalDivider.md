# DVerticalDivider

**Wiki:** https://wiki.facepunch.com/gmod/DVerticalDivider
**Status:** 🔴 → 🟢 (chunk 2)
**Inherits:** DPanel

## Visual description
Splits its bounds into a TOP pane and a BOTTOM pane separated by a horizontal draggable divider bar. (Despite the name "Vertical" — the divider IS vertical in axis sense, splitting top/bottom.) Children are assigned to top vs bottom roles via `SetTop` / `SetBottom`.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `dividerTopHeight` | number | 100 | `SetTopHeight(n)` | Top pane height in px |
| `dividerHeight` | number | 4 | `SetDividerHeight(n)` | Divider bar height |
| `dividerTopMin` | number | (none) | `SetTopMin(n)` | Min top pane height |
| `dividerTopMax` | number | (none) | `SetTopMax(n)` | Max top pane height |
| `dividerBottomMin` | number | (none) | `SetBottomMin(n)` | Min bottom pane height |

## Key methods (callbacks)
None documented.

## Render strategy
- Outer div: full size.
- Top pane: dark panel from y=0 to y=`dividerTopHeight`.
- Divider bar: thin lighter strip at y=`dividerTopHeight`, height=`dividerHeight`.
- Bottom pane: dark panel from y=`dividerTopHeight + dividerHeight` to bottom.
- Children render in normal flow (positional). The first 2 children are assumed to be top/bottom in Lua emission.

## Lua emission notes
Emit divider config: `SetTopHeight`, `SetDividerHeight`, `SetTopMin`, `SetTopMax`, `SetBottomMin`.
After children are emitted, append:
```lua
divider:SetTop(child0)    -- if children[0] exists
divider:SetBottom(child1) -- if children[1] exists
```
This requires post-processing in `traverse` similar to DTab's `AddSheet` post-step.
Add `DVerticalDivider` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- **Positional child semantics:** first child = SetTop, second child = SetBottom. Document this in the PropertiesPanel description so users know.
- Default size 200×200.
- Default `dividerTopHeight = 100`, `dividerHeight = 4`.
- Children are NOT auto-positioned within the top/bottom zones in canvas — the user manually positions them or uses Fill Parent. The visual TOP/BOTTOM zones are diagrammatic guides only.
- DHorizontalDivider exists too with analogous methods — not in this chunk.
