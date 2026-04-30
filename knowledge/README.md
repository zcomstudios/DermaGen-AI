# Derma Element Knowledge Base

This folder is **Claude's persistent memory** for the multi-session task of bringing every Derma/VGUI element in `types.ts:ComponentType` up to render-accurate, behavior-accurate parity with its in-game GLua counterpart.

## How to use this KB (read on every session resume)

1. **Open `progress.md` first.** It is the single source of truth for what's done, what's in flight, and what's queued. Update it last in every session.
2. **Read `architecture.md`** if you've forgotten where in the codebase to wire a new element.
3. **Read `implementation-recipe.md`** for the step-by-step recipe — copy-paste from the template, fill in the blanks.
4. **Open `elements/<Element>.md`** for the element you're working on. If it doesn't exist, create one by fetching the gmod wiki page and following the per-element template.
5. **Work in chunks of 4–5 elements** per session. Update `progress.md` as each one is checked off.

## Folder layout

```
knowledge/
├── README.md              # this file
├── progress.md            # checklist & status table — read FIRST on resume
├── architecture.md        # codebase touchpoints (where each kind of change lives)
├── implementation-recipe.md  # step-by-step recipe + code template
└── elements/
    ├── _index.md          # short one-line summary of each element's status
    └── <Element>.md       # one per element: wiki notes + render notes + decisions
```

## Per-element file template

Every `elements/<Element>.md` file should follow this template (copy when creating new):

```markdown
# <ElementName>

**Wiki:** https://wiki.facepunch.com/gmod/<ElementName>
**Status:** 🔴 Stub | 🟡 Basic | 🟢 Complete
**Inherits:** <ParentClass>

## Visual description
What it looks like in-game (1–3 sentences). Note key visual landmarks.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| ...  |      |         |           |       |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| ...    |      |            |

## Render strategy
How we'll render it in the editor. Mention DOM structure, any tricky measurement.

## Lua emission notes
Anything special the generator needs to do (e.g. ordering of method calls, defaults to skip).

## Caveats / decisions
Anything that came up during implementation that future-me should know.
```

## Status legend

- 🔴 **Stub** — falls through to default placeholder; no dedicated render
- 🟡 **Basic** — has dedicated render but is missing properties, methods, or Lua emission
- 🟢 **Complete** — render is faithful, key properties + methods are exposed in PropertiesPanel and emitted to Lua
- ⚪ **Deferred** — element is created programmatically (DTooltip, DNotify) and doesn't belong on a visual canvas; mark and skip

## Verification before marking 🟢

A 🟢 element must:
1. Render in Canvas with a visible appearance that resembles the in-game look (not a placeholder).
2. Have its element-specific properties surfaced in `PropertiesPanel.tsx`.
3. Emit correct Lua in `luaGenerator.ts` (the right `Set*` calls in the right order).
4. Have its element-specific callback methods added to `componentDefinitions.ts`.
5. Have a default size + reasonable initial props in `App.tsx` addComponent.
