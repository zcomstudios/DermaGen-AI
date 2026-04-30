# DGrid

**Wiki:** https://wiki.facepunch.com/gmod/DGrid
**Status:** 🔴 → 🟢 (chunk 4)
**Inherits:** Panel

## Visual description
A fixed-cell grid layout. Children are placed in cells of `gridColWide × gridRowHeight`, wrapping to a new row every `gridCols` items. Each cell is the same size; child sizing within the cell is the child's responsibility.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `gridCols` | number | 4 | `SetCols(n)` | Columns per row |
| `gridColWide` | number | 50 | `SetColWide(n)` | Cell width |
| `gridRowHeight` | number | 50 | `SetRowHeight(n)` | Cell height |

## Key methods (callbacks)
None standard. Children are added via `:AddItem(panel)` programmatically.

## Render strategy
- Override `childrenContainerStyle` to use CSS grid:
  - `display: grid`
  - `grid-template-columns: repeat(${gridCols}, ${gridColWide}px)`
  - `grid-auto-rows: ${gridRowHeight}px`
- Children render at their own intrinsic size inside each cell.

## Lua emission notes
- Emit `SetCols`, `SetColWide`, `SetRowHeight`.
- Children created with this grid as parent must be added via `varName:AddItem(child)` after their creation. We add this as **post-traverse emission** (similar to DVerticalDivider's SetTop/SetBottom).
- Add `DGrid` to `safeToOverridePaint` exclusion list (Panel ancestor, no special paint).

## Caveats / decisions
- Allow as a parent in PropertiesPanel reparent dropdown.
- Children get auto-positioned by the grid; their `x`/`y` props are ignored when inside DGrid.
- Default size 220×120 (≈ 4 cells × 50 wide + padding).
- Post-traverse emission needed because `AddItem` must be called AFTER children exist.
