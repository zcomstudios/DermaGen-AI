# DermaGen AI

<div align="center">
  <img src="logo_dermagen.png" alt="DermaGen Logo" width="120" height="120">
  
  **A Visual UI Editor for Garry's Mod Derma**
  
  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
  [![License](https://img.shields.io/badge/license-MIT-blue)]()
  [![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
</div>

## Overview

DermaGen AI is a comprehensive visual editor designed for creating and managing Garry's Mod Derma UI elements. It combines an intuitive drag-and-drop canvas with AI-powered generation capabilities, allowing developers to rapidly prototype and build complex UI layouts without manually writing Lua code.

Whether you're building admin panels, custom menus, or complex user interfaces for your Garry's Mod server, DermaGen AI streamlines the entire workflow from concept to deployment.

## Key Features

✨ **Visual Canvas Editor**
- Intuitive drag-and-drop interface for building UI hierarchies
- Real-time visual feedback as you design
- Multi-select and grouping capabilities for complex layouts

🧩 **Comprehensive Component Library**
- Support for 30+ Derma component types
- DFrame, DPanel, DButton, DLabel, DTextEntry, and many more
- Full property customization for each component

🤖 **AI-Powered Generation**
- Powered by Google Gemini for intelligent UI generation
- Describe your UI in natural language and watch it come to life
- Perfect for rapid prototyping and exploration

📝 **Live Code Export**
- Real-time Lua code generation as you design
- Copy generated code directly to your clipboard
- Export as `.lua` files ready for deployment

📂 **Import/Export Support**
- Save projects as JSON for version control and sharing
- Load existing Lua code to inspect and modify
- Perfect for collaborative development

⏮️ **Complete Undo/Redo System**
- Full history tracking for all canvas operations
- Jump back and forth through your design iterations
- Never lose your work

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Garry's Mod (for testing generated Lua code)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dermagen-ai.git
cd dermagen-ai

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Basic Workflow

1. **Create a new project** - Start with File > New Project
2. **Add a DFrame** - The root window container (required first step)
3. **Add components** - Use the sidebar to add UI elements
4. **Customize properties** - Modify each component's properties in the right panel
5. **Generate code** - View and export the Lua code in the output panel
6. **Save your work** - File > Save Project to preserve your design

### AI Generation

Describe the UI you want, and let DermaGen AI do the heavy lifting:

**Example prompts:**
- "A dark login panel with username, password fields, and a blue login button"
- "A settings menu with sliders for volume, brightness, and text color picker"
- "An admin panel with a table showing player names, health, and kick buttons"

## Technology Stack

- **React 19** - Modern UI framework with hooks
- **TypeScript** - Type-safe JavaScript for reliability
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast build tool and dev server
- **Lucide React** - Beautiful icon library
- **Google Generative AI** - AI-powered UI generation

## Project Structure

```
dermagen-ai/
├── components/           # React components
│   ├── Canvas.tsx        # Main drawing canvas
│   ├── Toolbar.tsx       # Top toolbar with AI prompt
│   ├── Sidebar.tsx       # Component library sidebar
│   ├── PropertiesPanel.tsx # Property editor
│   ├── MenuBar.tsx       # File and edit menus
│   ├── AboutModal.tsx    # About dialog
│   └── ...
├── services/             # External API services
│   └── gemini.ts         # Google Gemini AI integration
├── utils/                # Utility functions
│   ├── luaGenerator.ts   # Converts UI state to Lua code
│   ├── luaParser.ts      # Parses Lua code to UI state
│   └── ...
├── types.ts              # TypeScript type definitions
├── App.tsx               # Root application component
└── index.tsx             # Application entry point
```

## Usage

### Creating Components

1. Click "New Project" or start with an existing project
2. Add a **DFrame** (the window) as the root container
3. Select the DFrame and add child components from the sidebar
4. Customize each component's properties in the right panel
5. Preview your UI on the canvas in real-time

### Exporting Code

The **Lua Output** panel at the bottom shows the generated Glua code:
- **Copy** - Copy the entire code block to clipboard
- **Export** - Download as a `.lua` file ready to use in your gamemode

### Importing Existing Code

Load existing Derma code to view and modify it:
1. File > Import Glua...
2. Select a `.lua` file
3. The UI structure appears on the canvas for editing

### Saving Your Work

- **Save Project** (Ctrl+S) - Saves as JSON (preserves all properties)
- **Save As** - Choose a custom filename
- **Open Project** (Ctrl+O) - Load a previously saved JSON file

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save Project |
| `Ctrl+O` | Open Project |
| `Ctrl+D` | Duplicate Selected |
| `Delete` | Delete Selected |

## Configuration

### Google Gemini API Setup

To use AI generation features, you'll need a Google Gemini API key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Create a new API key
3. Add it to your environment or configure in the application settings

## Supported Derma Components

DermaGen AI supports the following Garry's Mod Derma components:

- **Containers**: DFrame, DPanel
- **Input**: DTextEntry, DNumberWang, DSlider, DNumSlider, DBinder
- **Buttons**: DButton, DCheckBox, DImageButton
- **Selection**: DComboBox, DListView, DMenu, DMenuBar
- **Display**: DLabel, DRichText, DProgress, DBevel, DHTML
- **Advanced**: DColorMixer, DColorCube, DColorPalette, DTree, DGrid, DIconLayout, DColumnSheet, DCollapsibleCategory, DVerticalDivider
- **Special**: DSysButton

## Tips & Best Practices

### Performance
- Keep component hierarchies shallow when possible
- Use grouping to organize complex layouts
- Test exported code in-game before deployment

### Design
- Start with a DFrame for any new UI
- Use semantic naming for variables (e.g., `btn_login_submit`)
- Organize panels logically in the tree view

### Code Quality
- Review generated Lua code before using in production
- Add custom event handlers after code generation
- Consider version control for JSON project files

## Troubleshooting

**Issue: AI generation not working**
- Verify your Google Gemini API key is configured
- Check browser console for error messages
- Ensure you have internet connectivity

**Issue: Lua code doesn't compile**
- Verify all component properties are valid
- Check that parent-child relationships are correct
- Test the code in a simple Garry's Mod gamemode first

**Issue: Import fails**
- Ensure the Lua file follows standard vgui.Create patterns
- Check that the file encoding is UTF-8
- Verify the code structure is valid

## Contributing

Contributions are welcome! Feel free to:
- Report bugs and suggest features
- Submit pull requests with improvements
- Share UI designs and tips with the community

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check existing discussions for common problems
- Review the Help > Shortcuts menu for keyboard shortcuts

## Roadmap

- [ ] Advanced layout constraints
- [ ] Custom theme builder
- [ ] Component templates library
- [ ] Live preview in Garry's Mod
- [ ] Collaborative editing
- [ ] Plugin system for custom components
- [ ] Animation timeline editor
- [ ] Dark/Light theme toggle

## Acknowledgments

Built with ❤️ for the Garry's Mod community.

Special thanks to:
- [Facepunch Studios](https://www.facepunch.com/) - Garry's Mod
- [Google AI](https://ai.google.dev/) - Gemini API
- [React](https://react.dev/) - UI Framework

---

**Version 1.0.0** - Built for Garry's Mod • Open Source

[GitHub](https://github.com/yourusername/dermagen-ai) • [Issues](https://github.com/yourusername/dermagen-ai/issues) • [Discussions](https://github.com/yourusername/dermagen-ai/discussions)
