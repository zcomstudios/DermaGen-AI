# DermaGen AI

<div align="center">
  <img src="header_dermagen.jpg" alt="DermaGen AI" width="auto" height="300">
</div>

Web-based WYSIWYG editor that generates Garry's Mod Derma/VGUI GLua code. Build UI hierarchies visually and export copy-paste ready Lua.

## Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/zcomstudios/DermaGen-AI.git
cd DermaGen-AI
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Gemini API Key

AI generation requires a Google Gemini key. Get one at [aistudio.google.com](https://aistudio.google.com/app/apikeys).

The key is stored in `.env.local` at the project root. Open it and set:

```
GEMINI_API_KEY=your_key_here
```

Then restart the dev server (`Ctrl+C`, `npm run dev`). The key is injected at compile time via `vite.config.ts` — it does not take effect without a restart.

#### Changing the Key

Edit `.env.local`, replace the value of `GEMINI_API_KEY`, and restart the dev server. No other files need to change.

#### Switching to a Different AI Provider

The integration is isolated to `services/gemini.ts`. To swap providers:

1. Install the provider's SDK: `npm install <provider-sdk>`
2. Add the provider's API key to `.env.local`, e.g. `OPENAI_API_KEY=your_key`
3. In `vite.config.ts`, add the new key to the `define` block:
   ```ts
   'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY)
   ```
4. Rewrite `services/gemini.ts` to call the new provider's API. The function signature to preserve is:
   ```ts
   generateLayoutFromPrompt(prompt: string): Promise<AIComponentDefinition | null>
   ```
   Return `null` on error or when the key is missing. `App.tsx` consumes only this function.
5. Restart the dev server.

## Workflow

1. File > New Project
2. Add a **DFrame** as the root (required)
3. Add child components from the sidebar
4. Edit properties in the right panel
5. Copy/export the generated Lua from the output panel

### Importing Existing Code

File > Import Glua — loads a `.lua` file using standard `vgui.Create` patterns and reconstructs the component tree on the canvas.

### Saving

- **Ctrl+S** — save as JSON (preserves all properties for future editing)
- Export — download as `.lua` for direct use in a gamemode

## AI Generation

Enter a natural language description in the toolbar prompt. Examples:

- `A dark login panel with username, password fields, and a login button`
- `A settings menu with sliders for volume and brightness, plus a color picker`
- `An admin panel with a player list and kick buttons`

The generator produces a component tree using the Gemini API. Review the output before use.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save Project |
| `Ctrl+O` | Open Project |
| `Ctrl+D` | Duplicate Selected |
| `Delete` | Delete Selected |

## Supported Components

**Containers:** DFrame, DPanel, DScrollPanel, DPropertySheet, DColumnSheet, DCollapsibleCategory, DForm, DTab

**Input:** DTextEntry, DNumberWang, DSlider, DNumSlider, DBinder, DCheckBox, DComboBox

**Buttons:** DButton, DImageButton, DSysButton

**Display:** DLabel, DRichText, DProgress, DBevel, DHTML, DImage, DModelPanel, DTooltip, DNotify

**Layout:** DIconLayout, DGrid, DVerticalDivider, DHorizontalDivider

**Color:** DColorMixer, DColorCube, DColorPalette

**Navigation:** DTree, DMenu, DMenuBar

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS, Lucide React
- Google Generative AI (`@google/genai`)

## Troubleshooting

**AI generation not working** — confirm the Gemini API key is set and the browser console shows no auth errors.

**Lua won't compile in GMod** — verify parent-child relationships are valid and all required properties are set. Test in a minimal gamemode first.

**Import fails** — the parser expects standard `vgui.Create("...")` patterns and UTF-8 encoding.

## License

MIT
