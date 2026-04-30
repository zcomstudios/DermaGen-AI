# DIconLayout

**Wiki:** https://wiki.facepunch.com/gmod/DIconLayout
**Status:** 🔴 → 🟢 (chunk 4)
**Inherits:** DDragBase (Panel descendant)

## Visual description
An auto-wrapping grid that arranges children in rows or columns with configurable spacing and border. Unlike DGrid (fixed cell size), DIconLayout uses each child's natural size and wraps when they don't fit.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `iconSpaceX` | number | 5 | `SetSpaceX(n)` | Horizontal gap |
| `iconSpaceY` | number | 5 | `SetSpaceY(n)` | Vertical gap |
| `iconBorder` | number | 0 | `SetBorder(n)` | Outer padding |
| `iconLayoutDir` | "LEFT" \| "TOP" | "TOP" | `SetLayoutDir(d)` | Wrap direction |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnModified` | self | Layout was rearranged |

## Render strategy
- Override `childrenContainerStyle`:
  - `display: flex`
  - `flexDirection: 'row'` if dir=`LEFT` (wrap horizontally), `'column'` if dir=`TOP` (stack vertically with wrap)
  - `flexWrap: 'wrap'`
  - `gap: ${iconSpaceY}px ${iconSpaceX}px`
  - `padding: ${iconBorder}px`

## Lua emission notes
- Emit `SetSpaceX`, `SetSpaceY`, `SetBorder` if defined.
- For `SetLayoutDir`: emit `SetLayoutDir(LEFT)` or `SetLayoutDir(TOP)` (Source DOCK enum).
- Children parented to DIconLayout don't need explicit positioning — they auto-flow.
- Add `DIconLayout` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Allow as a parent in PropertiesPanel reparent dropdown.
- DColorPalette inherits DIconLayout — but we already model its swatches as a CSV prop, not as real children. So DColorPalette's renderer ignores child auto-layout. That's intentional — they're conceptually different content.
- Default size 200×120.
