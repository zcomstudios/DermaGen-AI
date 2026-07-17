# Implementation Progress

> **Read this file FIRST when resuming a session.** Update it LAST in every session.

## Status legend

- 🟢 Complete · 🟡 Basic · 🔴 Stub · ⚪ Deferred (programmatic-only, skip)

## Active chunk

**ALL CHUNKS CLOSED.** Every non-deferred element is at 🟢. KB is in maintenance mode.

Future work would be:
- **Upstream removals (found 2026-07-14):** DBevel, DRichText, DSysButton no longer exist in GMod — no wiki page and no file in Facepunch/garrysmod. Our implementations targeted docs that have since been deleted. Decide whether to keep them as legacy types or remove. They show with a "removed from wiki" badge in File > Import VGUI Panel.
- DHorizontalDivider (sister of DVerticalDivider — would mostly mirror chunk 2)
- Per-element fidelity refinements as users surface in-game vs preview discrepancies
- `luaParser.ts` round-trip support for the new props (currently parser only restores well-known fields)
- Optional: lift `DCheckBoxLabel` to a first-class type if users want the choice explicit

(Chunks 1–6 closed — see Done.)

## Per-chunk plan (queue)

| Chunk | Elements | Theme |
|-------|----------|-------|
| 1 (active) | DBevel, DProgress, DSlider, DNumSlider, DImageButton | Simple visuals + slider family |
| 2 | DCollapsibleCategory, DRichText, DBinder, DNumberWang, DVerticalDivider | Single-purpose widgets |
| 3 | DColorMixer, DColorCube, DColorPalette, DSysButton, DHTML | Color family + DFrame extras |
| 4 | DTree, DMenu, DMenuBar, DGrid, DIconLayout | Layout containers + menus |
| 5 | DColumnSheet, DListView (audit), DComboBox (audit), DCheckBox (audit + DCheckBoxLabel), DForm (audit) | Container audits + missing models |
| 6 | DFrame audit, DButton audit, DLabel audit, DTextEntry audit, DPanel audit | Quality pass on existing renders |

Deferred (skip): **DNotify**, **DTooltip** (programmatic-only).

## Done

### Chunk 1 — completed 2026-04-24

| Element | Status | Notes |
|---------|:------:|-------|
| DBevel | 🟢 | Beveled panel via inset box-shadow. Added to `safeToOverridePaint` exclusion. |
| DProgress | 🟢 | Fill ratio 0–1 via `progressFraction`. Color reuses existing `color` prop. Added to `safeToOverridePaint`. |
| DSlider | 🟢 | 1D/2D knob. Lock-X/Y/TrapInside supported. Added `OnValueChanged`/`TranslateValues` methods. |
| DNumSlider | 🟢 | Label + track + numeric box. Editable label via double-click. Lua emits in min/max/decimals/value order so value clamps correctly. |
| DImageButton | 🟢 | Inherits DButton callbacks. Image fits via `object-fit: contain/fill/none`. |

### Chunk 2 — completed 2026-04-24

| Element | Status | Notes |
|---------|:------:|-------|
| DCollapsibleCategory | 🟢 | Header (editable label) + collapsible content area. Added to `TEXT_EDITABLE_TYPES`, `getInnerArea`, and child-container offset. Children hidden when `expanded === false`. Lua emits `SetLabel` (NOT SetText), `SetExpanded`, `SetHeaderHeight`. |
| DRichText | 🟢 | Multi-line content via `text` prop with `\n` separators. PropertiesPanel uses a `<textarea>`. Lua escapes newlines and emits `AppendText`. |
| DBinder | 🟢 | Two related props: `binderKey` for visual preview, `binderKeyCode` (numeric) for `SetSelectedNumber` emission. Inherits DButton chrome and callbacks via inheritance — added `OnChange`. |
| DNumberWang | 🟢 | Reuses chunk-1 slider family (sliderMin/Max/Value/Decimals). New: `numberInterval` for step. Lua emits clamp-safe order. |
| DVerticalDivider | 🟢 | Visual top/divider/bottom zones. **Positional child semantics:** first child → SetTop, second → SetBottom, emitted as post-processing in `traverse` after children are created. |

### Chunk 3 — completed 2026-04-24

| Element | Status | Notes |
|---------|:------:|-------|
| DColorMixer | 🟢 | Composite picker — cube + alpha bar + RGBA wangs + palette + label. Visibility toggles for each subzone. Lua emits visibility/label/ConVars first, then `SetColor(Color(r,g,b,a))` last so wangs reflect. (Methods entry was already in `componentDefinitions.ts` from before — don't re-add.) |
| DColorCube | 🟢 | 2D sat/value gradient with crosshair. Inherits DSlider — reuses `sliderX`/`sliderY` for crosshair. **Extended the DSlider Lua emission block to also fire for DColorCube** so SetSlideX/Y work via inheritance. New prop `cubeBaseColor` for `SetBaseRGB`. |
| DColorPalette | 🟢 | Grid of swatches stored as CSV string in `paletteColors`. Lua parses CSV → `SetColorButtons({Color(...), ...})`. PropertiesPanel uses a textarea for the CSV. |
| DSysButton | 🟢 | Small glyph button with 4 types (close ✕, minim –, maxim □, newwin ↗). Type stored as a string union, emitted via `SetType`. Close hover turns red. |
| DHTML | 🟢 | Faux browser preview: URL bar + content area. URL takes precedence over inline content; inline uses Lua long-bracket `[[ ]]`. We do NOT render an iframe (security + cross-origin makes it pointless in editor). |

### Chunk 4 — completed 2026-04-26

| Element | Status | Notes |
|---------|:------:|-------|
| DTree | 🟢 | Indented-text format for nodes (2-space indent = nesting; `\|<icon>` suffix). Recursive Lua emission uses a depth-keyed stack to track parent var names — `node_n${counter}` naming avoids collisions across multiple trees in one Lua script. |
| DMenu | 🟢 | Newline-separated items, `---` for spacer, optional `\|<icon>`. Editor renders as a static panel (always visible), even though DMenu is normally a popup at runtime. Lua emits `AddOption("...", function() end):SetIcon(...)` chain. |
| DMenuBar | 🟢 | Newline format `Label: opt1, opt2, ---, opt3`. Per-menu var naming `${bar}_m${counter}`. Editor doesn't render dropdowns — just the bar of buttons. |
| DGrid | 🟢 | Container with CSS-grid `childrenContainerStyle` override. **Pre-existing in Sidebar's `COMPONENT_INFO`** (uses `Table` icon) — must NOT add again or TS1117 fires. Post-traverse emits `:AddItem(child)` per child. |
| DIconLayout | 🟢 | Container with flex-wrap `childrenContainerStyle` override. `iconLayoutDir` switches between row-wrap (LEFT) and column-wrap (TOP). **Inheritance note:** DColorPalette inherits DIconLayout but uses its own CSV-swatches model; we deliberately do NOT auto-flow real children inside palettes. |

### Chunk 5 — completed 2026-04-26

| Element | Status | Notes |
|---------|:------:|-------|
| DColumnSheet | 🟢 | Vertical tab strip on left + content area on right. Reuses DTab children convention from DPropertySheet. **Extended `isTab` and `isTabInSheet` checks to include DColumnSheet** so tab post-traverse and child positioning work uniformly. AddSheet signature is identical to DPropertySheet. |
| DListView | 🟢 | Audit fix: replaced hardcoded "Column 1, Item A" with real `listColumns` (CSV) + `listRows` (newline-of-CSV) model. Display config: multiSelect, hideHeaders, sortable. Lua emits `AddColumn`/`AddLine` with quote-escaped values. |
| DComboBox | 🟢 | Audit fix: added `comboChoices` (newline-separated) model + `comboSortItems`. Crucial Lua change: emit `:SetValue("X")` for displayed text (NOT `:SetText`) — the wiki documents SetValue for the collapsed display. |
| DCheckBox | 🟢 | **Audit fix with cross-cutting impact**: when `text` is set, the generator now emits `vgui.Create("DCheckBoxLabel", parent)` instead of `vgui.Create("DCheckBox", parent)`. This is the **first time we change the emitted vgui type based on a prop**. Result: the in-game render finally matches the editor (label visible). PropertiesPanel shows an info note when text is set. |
| DForm | 🟢 | Audit complete — no code changes needed. Existing `SetName` emission is correct; render is correct. **Documented the inheritance from DCollapsibleCategory** (not DPanel as the codebase had loosely assumed). |

### Chunk 6 — completed 2026-04-26

| Element | Status | Notes |
|---------|:------:|-------|
| DFrame | 🟢 | Audit added: `frameIcon` (rendered title-bar swatch + `:SetIcon`), `frameMinWidth`/`frameMinHeight` (`:SetMinWidth`/`:SetMinHeight`), `frameScreenLock` (`:SetScreenLock`), `frameBackgroundBlur` (rendered as backdrop-blur visual + `:SetBackgroundBlur`). |
| DButton | 🟢 | Audit added: `buttonEnabled` (default true; render greys + cursor:not-allowed when false; emits `:SetEnabled(false)`), `buttonIcon` (renders 14×14 placeholder left of text + `:SetIcon`), `buttonConsoleCommand` (parsed into cmd + space-separated args for `:SetConsoleCommand`). New callbacks: DoDoubleClick, OnDepressed, OnReleased. |
| DLabel | 🟢 | Audit added: `labelTextColor` (overrides default white in render + `:SetTextColor(Color(...))`), `labelAutoStretchVertical` (`:SetAutoStretchVertical(true)`). New callbacks: DoClick, DoRightClick, DoDoubleClick, OnDepressed, OnReleased. |
| DTextEntry | 🟢 | **Biggest audit delta** — added 8 setters previously missing: `entryMultiline` (switches render to text-area mode), `entryNumeric`, `entryEditable`, `entryEnterAllowed`, `entryUpdateOnType`, `entryPlaceholderText` (renders muted gray when text empty), `entryMaxChars`, `entryTextColor`. New callbacks: OnValueChange, OnKeyCode. |
| DPanel | 🟢 | Audit added: `panelDisabled` (50% opacity preview + `:SetDisabled`), `panelPaintBackground` (default true; false → dashed-outline preview + `:SetPaintBackground(false)`). Branched the render out from DScrollPanel/DTab so it can carry the new behavior. |

## In flight (current session)

(none — chunk 6 closed; KB in maintenance mode)

## Cross-cutting decisions made

(record durable decisions about how we render or model things, so future-you doesn't re-litigate)

- **Element-specific props live on the universal `ComponentProps` bag, prefixed by family.** E.g. `slider*`, `progress*`, `image*`, `divider*`, `binder*`. We do NOT introduce per-element interfaces — keeps `App.tsx` patching simple and the prop diff trivial. (Chunk 1.)
- **`safeToOverridePaint` exclusion is mandatory for any element that paints itself.** When you add an element with custom Paint, add its `ComponentType` to the array in `luaGenerator.ts`. Otherwise the generic Paint override clobbers its visuals on Lua output.
- **Visual renders are declarative; user does NOT drag canvas controls.** Slider knobs, progress fills, etc. are positioned from props. The user adjusts via the PropertiesPanel. This keeps Canvas event handling sane (drag = move element, not interact with element).
- **Numeric props split into int vs float lists in `PropertiesPanel.handleChange`.** `sliderDecimals` is int; `sliderValue/Min/Max`, `progressFraction`, `slider[X|Y]`, `sliderLock[X|Y]` are float. Add new numeric props to the appropriate list. (Note: when a prop has `undefined` as a meaningful "blank/none" sentinel — e.g. `sliderLockX`, `dividerTopMin` — bypass `handleChange` and call `onChange(id, { key: parsed })` inline so we can pass `undefined`.)
- **Lua method ordering matters for `SetValue`-style calls.** Always emit `SetMin`/`SetMax`/`SetDecimals` BEFORE `SetValue` so the value clamps against the just-set range. Same pattern for any element with a bounded value.
- **Container chrome offsets cascade to two places:** `getInnerArea` (for Fill Parent) AND the children container wrapper in `renderElement` (for visual rendering). When adding a container with a header (DFrame, DCollapsibleCategory, DPropertySheet, DForm), update BOTH. (Chunk 2.)
- **Positional child semantics for divider-like elements.** DVerticalDivider uses `children[0] → SetTop`, `children[1] → SetBottom` via post-processing in `traverse`, after children are created. Document this prominently in the PropertiesPanel section. (Chunk 2.)
- **`text` prop overload across element families.** It serves as: button label (DButton), display text (DLabel), title (DFrame), checkbox label (DCheckBox), entry value (DTextEntry), tab title (DTab), form label (DForm), slider label (DNumSlider), category header (DCollapsibleCategory), multi-line content (DRichText). Generator emits the right `Set*` per element type. Don't introduce a `label` prop separate from `text` — it would fragment the model.
- **Inheritance-aware Lua emission.** When element B inherits from element A in Derma, B can use A's setter methods. To emit them correctly, **extend the type guard** in A's Lua emission block to OR-include B's type. Example: DColorCube inherits DSlider, so the DSlider block now fires for `el.type === ComponentType.DSlider || el.type === ComponentType.DColorCube`. Same pattern will apply when DBinder needs DButton's emission and DNumberWang needs DTextEntry's. (Chunk 3.)
- **CSV strings for array-shaped props.** When a prop is conceptually a list (palette colors), store as comma-separated hex string in the prop bag rather than a JS array. Keeps the universal flat-prop model intact. PropertiesPanel uses a `<textarea>` for editing; generator parses on emit. (Chunk 3.)
- **Editor renders a faithful preview, not a working widget.** DHTML doesn't actually load URLs; DColorMixer doesn't actually pick colors interactively. The render is a visual stand-in that conveys "this is what will be here at runtime". This keeps complexity bounded and avoids security/sandbox concerns. (Chunk 3.)
- **WATCH FOR PRE-EXISTING ENTRIES IN `componentDefinitions.ts` AND `Sidebar.tsx`.** Chunk 3 hit a duplicate in `componentDefinitions.ts` (DColorMixer, DNumSlider). Chunk 4 hit a duplicate in `Sidebar.tsx`'s `COMPONENT_INFO` (DGrid). **Always grep both files before adding an entry** — duplicate object keys are TS1117. (Chunks 3 + 4.)
- **Indented-text format for tree-shaped data.** DTree uses 2-space indent per nesting level, optional `|<icon>` suffix per line. Recursive Lua emission uses a depth-keyed parent-var stack. Same shape works for any future hierarchical config (e.g. nested submenus if we later expand DMenu's format). (Chunk 4.)
- **Container layout overrides happen in `childrenContainerStyle`, NOT in `renderVGUIContent`.** The render produces the chrome; the children container style — set in `renderElement` per-element — controls how children flow. DGrid uses CSS grid; DIconLayout uses flex-wrap. When adding a new container, add a new branch in the `childrenContainerStyle` mutation block (around `Canvas.tsx:600`+) and let the standard child-render loop do the work. (Chunk 4.)
- **Post-traverse child wiring patterns are now multi-element:** DTab uses `AddSheet`, DVerticalDivider uses `SetTop`/`SetBottom`, DGrid uses `AddItem`. All happen in the post-children block of `traverse`. When adding a container that requires explicit child registration in Lua, append a new block there.
- **Emitted vgui type can vary based on props.** New in chunk 5: `DCheckBox` with `text` set emits as `DCheckBoxLabel`. Pattern: compute an `emittedType` variable in `traverse` based on `el.type` plus relevant props, then use it in the `vgui.Create` line. Future use cases: any "convenience class" pairing where one editor type maps to multiple Derma classes depending on configuration.
- **Sheet-container behavior is parameterized by tab-strip orientation, not duplicated.** DPropertySheet (horizontal) and DColumnSheet (vertical) share the DTab child convention, the `isTab`/`isTabInSheet` checks, and the AddSheet post-traverse. The only differences live in `renderVGUIContent` (which strip to draw) and `childrenContainerStyle` (where the content area is). Future tabbed containers should follow this split.
- **CSV vs. newline-separated string formats** — pick by content semantics. CSV when items are short tokens with no commas (palette colors, list view columns, list view row cells); newline when items may legitimately contain commas or are longer (combo box choices, menu items, tree nodes, rich-text content). DColorPalette uses CSV (chunk 3), DListView columns use CSV but rows use newline-of-CSV (chunk 5). Document choice when adding a new prop.
- **Audits often reveal more gaps than new elements have.** DTextEntry shipped with only `text` exposed; the chunk-6 audit added 8 setters. Lesson: the originally-shipped 🟡 elements were under-modeled relative to wiki coverage — when in doubt during future audits, fetch the wiki and grep for `Set*` methods, then add the props the user is likely to want. (Chunk 6.)
- **Render-or-emit dichotomy for runtime-only props.** Some properties (e.g. `entryEditable: false`, `panelDisabled: true`) affect runtime behavior but their visual change is hard to preview faithfully (Derma skin handles the grey-out). For those: either ship the Lua and leave the editor preview unchanged, OR add a deliberate "preview hint" (50% opacity, dashed border). Document in the element file which approach was taken. (Chunk 6.)

## Open questions for the user

- For DSlider on canvas: should the knob be visually drag-interactive (i.e. user drags knob to set sliderX/Y), or stay declarative (only PropertiesPanel updates it)? Current implementation is declarative for consistency with the "drag = move element" model. **(Recommend: leave declarative; ask if user disagrees in Chunk 2 prep.)**
