# DBevel

**Wiki:** _no dedicated page; element exists in `garrysmod/lua/vgui/dbevel.lua`_
**Status:** 🔴 → 🟡 (this chunk)
**Inherits:** Panel

## Visual description
A simple framed/beveled rectangle used as a content area background. Renders as a flat panel with a 1px inset border that gives a subtle "chiseled-in" or "raised" look. No text. Often used as a card/group separator inside DForm or property panels.

## Key properties (state)
None beyond Panel. No `Set*` methods of its own.

## Key methods (callbacks)
None of its own. Inherits standard Panel hooks (Paint, Think, OnMousePressed).

## Render strategy
A single `<div>` styled with:
- Background tone slightly darker than the parent (`#2a2a2a` on dark theme).
- Inset border using `box-shadow: inset 0 0 0 1px ...` to fake the chisel highlight + shadow.

No editable text, no element-specific props.

## Lua emission notes
Nothing special — `vgui.Create("DBevel", parent)` + `SetSize`/`SetPos`. The generic Paint override **must not** apply (DBevel paints its own bevel). Add `DBevel` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Skip `text` property in the editable-types set; DBevel is a pure container.
- Default size 200×100, fits as a card.
