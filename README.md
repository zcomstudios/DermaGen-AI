# DermaGen AI

<div align="center">
  <img src="header_dermagen.jpg" alt="DermaGen AI" width="auto" height="300">
</div>

# About
<span style='color:#00CCFF;font-size:16px'>DermaGen-AI</span> is a web-based WYSIWYG editor that generates Garry's Mod Derma/VGUI GLua code. Build UI hierarchies visually and export copy-paste ready Lua.
I made this because I was <span style='color:#FF6666'><b>tired of having to refresh my scripts/the map</b></span> just to see the result of small visual changes to components or layouts.

## Please Note: Work-In-Progress

This project is still in active development and may not work perfectly. It is still a far-cry from where I would like it to be, but it is good enough to provide a starting point and help you build your UI faster. With a community like Garry's Mod, I'm sure this can be improved upon with enough contributions.

## Installation and Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/zcomstudios/DermaGen-AI.git
cd DermaGen-AI
npm install
npm run dev
```

App runs on local server at `http://localhost:3000`.

## Contributing and Support

Contributions are welcome! Please feel free to submit a Pull Request. Or contact me if you want to help in some other way.
### Donations

If you enjoy DermaGen AI and find it useful, consider a small donation to support its continued development.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Generous-yellow?logo=buy-me-a-coffee)](https://www.buymeacoffee.com/zcomstudios)
[![Donate Bitcoin](https://img.shields.io/badge/Donate-Bitcoin-orange?logo=bitcoin)](bitcoin:bc1qz536q88a9zqgk58q4zqw0z88z3a6z62k0xvj6y)
[![Donate Crypto.com](https://img.shields.io/badge/Donate-Crypto.com-orange?logo=crypto.com)](https://crypto.com/pay/zcom)

# Workflow

1. File > New Project

<a href="screenshot_001.png" target="_blank"><img src="screenshot_001.png" alt="New Project" width="auto" height="150"></a>

2. Add a **DFrame** as the root (required)

<a href="screenshot_002.png" target="_blank"><img src="screenshot_002.png" alt="Add DFrame" width="auto" height="150"></a>

3. Adjust the grid-size to your preference to control snapping precision

<a href="screenshot_003.png" target="_blank"><img src="screenshot_003.png" alt="New Project" width="auto" height="150"></a>

4. Add child components from the sidebar and Edit properties in the right panel

<a href="screenshot_004.png" target="_blank"><img src="screenshot_004.png" alt="Add Components and Edit Properties" width="auto" height="150"></a>

5. Copy/export the generated Lua from the output panel, launch the game and test it:

<a href="screenshot_005.png" target="_blank"><img src="screenshot_005.png" alt="Copy/Export Generated Lua" width="auto" height="150"></a>
  
## Testing Your Code In-Game

There are multiple ways to test your code in-game, the one I prefer involves creating a simple client-side console command that renders your VGUI code instantly. Here's the way I do it:

1. Copy the generated Lua code
2. Navigate to the following folder:
```bash
%garrysmod%/lua/autorun/client
```
3. Create a new .lua file with the following code:

```lua
local function openUI( ply, cmd, arg)
    -- Paste your generated code here
end

concommand.Add("open_ui", openUI)
```

4. Save the file, and either launch the game or refresh the map/rejoin the server.
5. Open your console, and run the command `open_ui`

### Importing Existing Code

File > Import Glua — loads a `.lua` file using standard `vgui.Create` patterns and reconstructs the component tree on the canvas.

<span style="color:#ff6600; background-color:#FF663322; border:1px solid #FF6633; padding:4px; font-family:'Inconsolata'; font-weight: 600; font-size: 1.15rem;"><b>WARNING</b>: This feature is still in development and may not work perfectly with all code.</span>

### Saving

- **Ctrl+S** — save as JSON (preserves all properties for future editing)
- Export — download as `.lua` for direct use in a gamemode


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

I am actively working on adding support for more components, and the list is constantly growing, with some components having more support/more comprehensive adaptation than others. So I appreciate your patience as I work to improve support for all components. That being said: **the following components are currently supported**:

- **Containers:**
  - DFrame
  - DPanel
  - DScrollPanel
  - DPropertySheet
  - DColumnSheet
  - DCollapsibleCategory
  - DForm
  - DTab
- **Input:**
  - DTextEntry
  - DNumberWang
  - DSlider
  - DNumSlider
  - DBinder
  - DCheckBox
  - DComboBox
- **Buttons:**
  - DButton
  - DImageButton
  - DSysButton
- **Display:**
  - DLabel
  - DRichText
  - DProgress
  - DBevel
  - DHTML
  - DImage
  - DModelPanel
  - DTooltip
  - DNotify
- **Layout:**
  - DIconLayout
  - DGrid
  - DVerticalDivider
  - DHorizontalDivider
- **Color:**
  - DColorMixer
  - DColorCube
  - DColorPalette
- **Navigation:**
  - DTree
  - DMenu
  - DMenuBar

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS, Lucide React
- Google Generative AI (`@google/genai`)

## Troubleshooting

**AI generation not working** — confirm the Gemini API key is set and the browser console shows no auth errors.

**Lua won't compile in GMod** — verify parent-child relationships are valid and all required properties are set. Test in a minimal gamemode first.

**Import fails** — the parser expects standard `vgui.Create("...")` patterns and UTF-8 encoding.

# Planned Features

The following features are either not completely implemented, or soon-to-be implemented:

- **AI Generation** — generate components from natural language descriptions
- **Prebuilt Starter Templates** — save and load component templates for reuse
- **Additional Component Properties** — a more comprehensive set of properties for each component
- **Events** — support for component events and callbacks
- **Animations** — support for component animations and transitions
- **GWEN Skins & Themes** — support for component themes and styles
- **Localization** — support for component localization and internationalization
- **Improvements to Console for Testing** — support for component testing and debugging
- **Built-in Documentation** — support for component documentation and help

## AI Generation

<span style="color:#ff6600; background-color:#FF663322; border:1px solid #FF6633; padding:4px; font-family:'Inconsolata'; font-weight: 600; font-size: 1.15rem;"><b>WARNING</b>: This feature is still in development and may not work perfectly. Using it may cause unexpected behavior.</span>

Enter a natural language description in the toolbar prompt. Examples:

- `A dark login panel with username, password fields, and a login button`
- `A settings menu with sliders for volume and brightness, plus a color picker`
- `An admin panel with a player list and kick buttons`

The generator produces a component tree using the Gemini API. Review the output before use.

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


## License

MIT
