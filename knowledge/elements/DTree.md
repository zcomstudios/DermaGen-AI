# DTree

**Wiki:** https://wiki.facepunch.com/gmod/DTree
**Status:** 🔴 → 🟢 (chunk 4)
**Inherits:** DScrollPanel

## Visual description
A scrollable tree view. Each node is a row with optional icon (default: `icon16/folder.png` or `icon16/page.png` for leaves), a label, and an expand/collapse caret if it has children. Nesting is shown via horizontal indent.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `treeNodes` | string (indented text) | DEFAULT_TREE | (recursive `AddNode` calls) | See format below |
| `treeIndentSize` | number | 16 | `SetIndentSize(n)` | Horizontal indent per level |
| `treeLineHeight` | number | 17 | `SetLineHeight(n)` | Row height |
| `treeShowIcons` | boolean | true | `SetShowIcons(b)` | Toggle icon column |

### `treeNodes` text format
Indent level = nesting (2 spaces per level). Optional `|<icon>` suffix sets the node icon.
```
Folder|icon16/folder.png
  Subfolder|icon16/folder.png
    Document.txt|icon16/page.png
    Image.png|icon16/picture.png
  Another sub
Other root item
```

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnNodeSelected` | self, node | Node clicked |
| `DoClick` | self, node | Node clicked (alias) |
| `DoRightClick` | self, node | Right click |

## Render strategy
- Outer div: white scrollable container.
- Recursive function: parse the indented text into nested objects, render each node as a row (icon + caret + label), and indent each row by `level * treeIndentSize`.
- All nodes shown expanded in editor (we don't model expand/collapse state per node for editor preview).

## Lua emission notes
- Parse indented text → tree of nodes.
- Emit `SetIndentSize`, `SetLineHeight`, `SetShowIcons` first.
- Then for each top-level node:
  ```lua
  local node1 = varName:AddNode("Folder", "icon16/folder.png")
  local node1_1 = node1:AddNode("Subfolder", "icon16/folder.png")
  ```
  Track parent var names per depth level using a stack.
- Add `DTree` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Default size 200×180.
- Indented text format chosen over JSON for readability — same spirit as the CSV format used in DColorPalette.
- Generated node variable names: `${treeVar}_n${counter}` where counter increments per node. This avoids name collisions across multiple trees.
