# Implementation Recipe

Step-by-step for taking ONE element from 🔴 Stub to 🟢 Complete. Estimated effort: 10–30 min per element depending on complexity.

## Pre-flight

1. Open `progress.md`. Confirm the element you're about to do is in the current chunk and not already done.
2. Open `elements/<ElementName>.md`. If it doesn't exist:
   - Fetch `https://wiki.facepunch.com/gmod/<ElementName>` (use WebFetch, prompt for "What this element looks like, key properties with their setter methods, key callback methods (DoClick, OnChange, etc.), inheritance chain")
   - Create the element file using the template in `README.md`. Fill in everything you learned.
3. Skim the wiki info — note the **3–5 most important properties** and **2–3 most important callbacks**. We don't need to expose every method, just the ones a real Derma user actually sets.

## Step-by-step

### 1. Add element-specific props to `types.ts`

If the element needs new state (e.g. DSlider needs min/max/value/decimals), add optional fields to `ComponentProps`. Use a consistent prefix when natural (e.g. `slider*`, `progress*`) so it's clear where they belong.

```ts
// Slider
sliderMin?: number;
sliderMax?: number;
sliderValue?: number;
sliderDecimals?: number;
```

### 2. Sidebar entry — `components/Sidebar.tsx`

Add to `COMPONENT_INFO`:

```ts
[ComponentType.DXxx]: { desc: "Short one-liner what it does.", icon: <LucideIcon> },
```

Pick the closest `lucide-react` icon (browse https://lucide.dev). Add the import at the top.

### 3. Default props on add — `App.tsx`

In `addComponent`, after the existing size defaults, add:

```ts
else if (type === ComponentType.DXxx) {
  w = ...; h = ...;
}
```

If the element needs default props beyond size (e.g. `sliderMin: 0, sliderMax: 100, sliderValue: 50`), set them inline in the `newElement.props` block — there's already conditional logic there for `text` and `color`.

### 4. Render — `components/Canvas.tsx`

Add a `case ComponentType.DXxx:` in `renderVGUIContent`. Match the in-game look as closely as DOM/CSS allows. The render is **declarative** based on `el.props` — it should re-render correctly when props change.

Key conventions:
- Use Tailwind classes for static styling, inline `style` for prop-driven values.
- For text, route through `editableText(el, text, className, style)`.
- For interactive elements (sliders, checkboxes), the render is **visual-only** — drag/click is handled by the editor framework, not the rendered control. So a slider thumb should be positioned based on `(value - min) / (max - min)` but doesn't need a drag handler in the canvas.
- For complex containers (multi-zone like DColorMixer), keep the JSX tidy by extracting helper functions if needed.

If the element should support double-click text editing (it has a primary visible text), add it to `TEXT_EDITABLE_TYPES` at the top of `Canvas.tsx`.

### 5. Properties editor — `components/PropertiesPanel.tsx`

Add a new `Section` block guarded by `{type === ComponentType.DXxx && (...)}`. Expose the new props as inputs (number, text, checkbox, color, etc.). Use existing helpers (`Section`, `ColorInput`).

For numeric props, add the prop name to the `handleChange` int-list near the top so it parses correctly.

### 6. Methods — `utils/componentDefinitions.ts`

Add to `COMPONENT_METHODS`:

```ts
[ComponentType.DXxx]: [
  { name: 'OnValueChanged', args: ['self', 'value'], description: 'Called when the value changes.' },
  ...
],
```

Only include element-specific callbacks. The common Panel methods are already added globally.

### 7. Lua emission — `utils/luaGenerator.ts`

Add a block in `traverse`:

```ts
if (el.type === ComponentType.DXxx) {
  if (el.props.sliderMin !== undefined) lines.push(`${varName}:SetMin(${el.props.sliderMin})`);
  if (el.props.sliderMax !== undefined) lines.push(`${varName}:SetMax(${el.props.sliderMax})`);
  if (el.props.sliderValue !== undefined) lines.push(`${varName}:SetValue(${el.props.sliderValue})`);
}
```

If the element has internal painting (DColorMixer, DListView etc.) **and** you don't want the generic Paint override to clobber it, add it to the `safeToOverridePaint` exclusion list at line ~199.

### 8. Verify

1. `npx tsc --noEmit` — should pass clean.
2. Reload the dev server, drop the element on the canvas, see that:
   - It looks reasonable (not a default-placeholder dashed box).
   - Properties in the right panel reflect the new fields and update the canvas live.
   - The Lua output panel shows the new `Set*` calls.
3. Add the element to the methods picker (open Methods modal — it should list element-specific callbacks).

### 9. Update `progress.md`

Move the element from the active chunk to "Done", update the status emoji, and add any caveats encountered.

### 10. Update `elements/_index.md`

Bump the status row.

## Common pitfalls

- **Forgetting `safeToOverridePaint`** — if your container has its own visual children (lists, grids, sheets), the generic Paint override will repaint over them in Lua output. Add the type to the exclusion list.
- **Hardcoded measurements that fight zoom** — anything in canvas-space scales with `viewState.zoom`. Things in screen-space (toolbars, handles) need `/z` divisors.
- **Adding a property that needs to round-trip through luaParser** — for now, parser recreates the tree but only restores well-known props. New props will be lost on import. Document this in the element's caveats.
- **Marking 🟢 too early** — see verification checklist in `README.md`. If even one of the 5 boxes isn't checked, leave it 🟡.
