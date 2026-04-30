# DCollapsibleCategory

**Wiki:** https://wiki.facepunch.com/gmod/DCollapsibleCategory
**Status:** 🔴 → 🟢 (chunk 2)
**Inherits:** Panel

## Visual description
A header bar with a title (and expand/collapse caret on the right) sits on top; a content area is shown below the header when expanded. Header is ~20px tall, dark background like a section divider in DForm. Standard usage is grouping rows in property panels.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `text` | string | "Category" | `SetLabel(s)` | Header text (reuses existing `text` prop) |
| `expanded` | boolean | true | `SetExpanded(b)` | Collapsed hides children (header still visible) |
| `headerHeight` | number | 20 | `SetHeaderHeight(n)` | Header bar height in px |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnToggle` | self, expanded | User toggles via clicking header |
| `DoExpansion` | self, expand | Programmatic expansion hook |

## Render strategy
- Outer div: full size of element.
- Header div: `height: ${headerHeight}px`, dark bg, text on left, ▼ (expanded) or ▶ (collapsed) caret on right. Uses `editableText` for the label.
- Content area: below header. Visible only when `expanded`. Children render inside it.
- Children container is offset by `headerHeight` (similar to DFrame title bar offset). Add a special-case in `renderElement`'s children container style.
- For Fill Parent on children: `getInnerArea` should subtract `headerHeight`.

## Lua emission notes
Emit `SetLabel(text)` (NOT `SetText` — the wiki documents `SetLabel`).
Emit `SetExpanded(b)` if defined.
Emit `SetHeaderHeight(n)` if defined.
Add `DCollapsibleCategory` to `safeToOverridePaint` exclusion list — its internal Paint draws the header chrome.

## Caveats / decisions
- Reuses `text` prop for the label; emission uses `SetLabel` not `SetText`.
- Default expanded=true so newly-added category is open and you can see the contents area.
- Default size 200×100.
- Children that flow inside the category render in normal absolute coords relative to the contents area top-left, NOT the category top-left. (We re-use the `top: ${headerHeight}px` offset trick.)
