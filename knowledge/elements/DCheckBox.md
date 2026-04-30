# DCheckBox / DCheckBoxLabel (audit)

**Wiki:** https://wiki.facepunch.com/gmod/DCheckBox · https://wiki.facepunch.com/gmod/DCheckBoxLabel
**Status:** 🟡 → 🟢 (chunk 5 audit)
**Inherits:** DButton (DCheckBox); DPanel (DCheckBoxLabel)

## Visual description
- Plain `DCheckBox` is JUST the checkbox square (~16×16); no label.
- `DCheckBoxLabel` is the composite: checkbox + label inline; `:SetText("X")` sets the label.
- The editor's existing render shows checkbox + label — which matches **DCheckBoxLabel**, not plain DCheckBox.

## The audit fix
The original Lua emission was:
```lua
local cb = vgui.Create("DCheckBox", parent)
cb:SetText("My label")  -- this sets the inherited Label prop but does NOT show it visually!
cb:SetChecked(true)
```

That doesn't render the label in-game. Fix:

```lua
-- If text is set, use the labeled variant so what you see in the editor matches in-game:
local cb = vgui.Create("DCheckBoxLabel", parent)
cb:SetText("My label")
cb:SetChecked(true)
```

When `text` is empty/undefined, emit plain `DCheckBox`. This is **automatic** — the user just clears the text to opt out.

## Key properties (state)
| Prop | Type | Notes |
|------|------|-------|
| `text` | string | Label text. Presence triggers DCheckBoxLabel emission. |
| `checked` | boolean | Checked state |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnChange` | self, bVal | State changes (works on both variants) |

## Render strategy
Unchanged — already shows checkbox + label inline.

## Lua emission notes
**Critical change** in `luaGenerator.ts`:
- Modify the `vgui.Create` line to emit `DCheckBoxLabel` when `el.type === ComponentType.DCheckBox && el.props.text`.
- Keep `SetText` and `SetChecked` calls as-is — both work on DCheckBoxLabel.
- This is the **first time we change the emitted type** based on a prop. Document as a cross-cutting decision.

## Caveats / decisions
- We don't add `DCheckBoxLabel` as a separate `ComponentType` — it would fragment the model and confuse users. Instead, the existing DCheckBox component "becomes" DCheckBoxLabel in Lua when it has a label.
- Lua import (luaParser) won't round-trip a DCheckBoxLabel back to DCheckBox cleanly without parser updates — accept this for now and document.
