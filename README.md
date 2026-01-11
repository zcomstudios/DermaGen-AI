<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1byAd2fow2iYRdyC4lWkIuHM-z6pV8qxb

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:      
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

##📖 Usage Guide for Beginners
Add a Frame: Drag a DFrame from the toolbox onto the canvas.

Style It: Click the frame to select it. Use the Properties Panel on the right to change the Background Color, Title, and Size.

Add Controls: Drag a DButton inside the DFrame.
                                                        
Export: Click        1 the "Export Lua" button in the top right. Copy the code and paste it into a file in lua/autorun/client/ in your GMod addon.

## for Advanced Developers
Custom Painting: Select an element, go to the Methods tab, and edit the Paint hook.

Example: function(w, h) draw.RoundedBox(0, 0, 0, w, h, Color(255, 0, 0))

Docking: Instead of manual SetPos, use the Layout tab to set Dock: Top and Margin: 5. DermaGen handles the layout calculation automatically.

Logic: Use the OnClick hook to add interaction logic immediately, such as RunConsoleCommand("say", "hello").

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
