# DForm (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DForm
**Status:** 🟡 → 🟢 (chunk 5 audit)
**Inherits:** **DCollapsibleCategory** (not DPanel as we'd assumed)

## Visual description
A collapsible-category-based form for stacking labelled controls vertically. Has a title bar (the "name") and a body that contains rows. Rows are typically `Label + Control` pairs (the form's helper methods like `:CheckBox(label, convar)` create these row pairs in one call).

## Audit findings
| Aspect | Pre-chunk-5 state | Post-chunk-5 |
|--------|-------------------|--------------|
| Render | Header + body — looked correct | Unchanged (already good) |
| `text` → Lua | Emits `SetName(text)` ✓ | Unchanged |
| Children layout | `flex column gap:5` ✓ | Unchanged |
| Inheritance from DCollapsibleCategory | Not modeled | Document; user can manually add `expanded` prop later if desired |
| Helper methods (`:CheckBox`, `:NumSlider`, etc.) | Not exposed | Skip — these are programmatic shortcuts; user can model the same children explicitly. |

## Key properties (state)
Unchanged from before. Just `text` (used as form name).

## Key methods (callbacks)
None DForm-specific (inherits DCollapsibleCategory's `OnToggle`).

## Render strategy
Unchanged.

## Lua emission notes
Unchanged. `SetName(text)` is correct.

## Caveats / decisions
- DForm's `:CheckBox(label, convar)` etc. are **convenience constructors** in Lua. We don't expose them — instead, users add real children (DCheckBox, DNumSlider, etc.) which the form's vertical-flex layout handles.
- Could optionally also emit `:DoExpansion(true)` after creation if we want forms to definitely render expanded. Not adding for now — Derma forms are typically expanded by default.
- This audit completes DForm as 🟢. Could not find any required Lua emission gaps.
