import { EditorState, UIElement, ComponentType } from '../types';

/**
 * A heuristic parser to convert simple GLua VGUI code back into EditorState.
 * Note: This is not a full Lua AST parser. It looks for specific patterns
 * used in VGUI creation (vgui.Create, SetPos, SetSize, etc.).
 */
export const parseLuaToState = (luaCode: string): EditorState | null => {
  try {
    const lines = luaCode.split('\n');
    const elements: Record<string, UIElement> = {};
    const varNameToId: Record<string, string> = {};
    let rootId: string | null = null;
    
    // Helper to get or create ID from varName
    const getId = (varName: string) => {
      if (varNameToId[varName]) return varNameToId[varName];
      const newId = Math.random().toString(36).substr(2, 9);
      varNameToId[varName] = newId;
      return newId;
    };

    // 1. First Pass: Identify all created elements
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Pattern: local myFrame = vgui.Create("DFrame")
      // Pattern: local btn = vgui.Create("DButton", myFrame)
      const createMatch = trimmed.match(/local\s+(\w+)\s*=\s*vgui\.Create\s*\(\s*"([^"]+)"(?:\s*,\s*(\w+))?\s*\)/);
      
      if (createMatch) {
        const varName = createMatch[1];
        const type = createMatch[2] as ComponentType;
        const parentVar = createMatch[3];
        
        const id = getId(varName);
        
        // Default props based on type (will be overwritten by setters)
        elements[id] = {
          id,
          type,
          parentId: parentVar ? getId(parentVar) : null,
          children: [], // will populate later
          props: {
            x: 0, y: 0, w: 100, h: 100,
            variableName: varName,
            // Defaults
            text: (type === 'DLabel' || type === 'DButton') ? type : undefined
          }
        };

        if (!parentVar && type === 'DFrame') {
          rootId = id;
        }
      }
    });

    // 2. Second Pass: properties and relationships
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Extract variable name starting the line
      const varMatch = trimmed.match(/^(\w+):/);
      if (!varMatch) return;
      
      const varName = varMatch[1];
      const id = varNameToId[varName];
      if (!id || !elements[id]) return;

      const el = elements[id];

      // :SetSize(w, h)
      const sizeMatch = trimmed.match(/:SetSize\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (sizeMatch) {
        el.props.w = parseInt(sizeMatch[1]);
        el.props.h = parseInt(sizeMatch[2]);
      }

      // :SetPos(x, y)
      const posMatch = trimmed.match(/:SetPos\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (posMatch) {
        el.props.x = parseInt(posMatch[1]);
        el.props.y = parseInt(posMatch[2]);
      }

      // :SetText("text") or :SetTitle("text")
      const textMatch = trimmed.match(/:(?:SetText|SetTitle)\s*\(\s*"([^"]*)"\s*\)/);
      if (textMatch) {
        el.props.text = textMatch[1];
      }

      // :SetImage("path")
      const imgMatch = trimmed.match(/:SetImage\s*\(\s*"([^"]*)"\s*\)/);
      if (imgMatch) {
        el.props.imageUrl = imgMatch[1];
      }
      
      // :SetChecked(bool)
      const checkMatch = trimmed.match(/:SetChecked\s*\(\s*(true|false)\s*\)/);
      if (checkMatch) {
        el.props.checked = checkMatch[1] === 'true';
      }

      // :SetAlpha(int)
      const alphaMatch = trimmed.match(/:SetAlpha\s*\(\s*(\d+)\s*\)/);
      if (alphaMatch) {
        el.props.opacity = parseInt(alphaMatch[1]);
      }
      
      // :SetContentAlignment(int) - heuristic map back to string
      const alignMatch = trimmed.match(/:SetContentAlignment\s*\(\s*(\d)\s*\)/);
      if (alignMatch) {
          const val = parseInt(alignMatch[1]);
          if (val === 4) el.props.textAlign = 'left';
          else if (val === 6) el.props.textAlign = 'right';
          else el.props.textAlign = 'center';
      }

      // Color parsing is tricky in Lua "Color(r,g,b)", simplistic approach
      // Look for custom paint containing Color(r,g,b)
      // This is very loose, but handles the generator's style
      if (line.includes('draw.RoundedBox')) {
          const colorMatch = line.match(/Color\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
          if (colorMatch) {
              const r = parseInt(colorMatch[1]).toString(16).padStart(2,'0');
              const g = parseInt(colorMatch[2]).toString(16).padStart(2,'0');
              const b = parseInt(colorMatch[3]).toString(16).padStart(2,'0');
              
              // If we see IsHovered, it might be hover color, otherwise base color
              // This parser assumes the generator structure: if else block
              // We'll simplisticly assume first color found in Paint is base or hover
              if (!el.props.color) {
                   el.props.color = `#${r}${g}${b}`;
              }
          }
      }
    });

    // 3. Link Children
    Object.values(elements).forEach(el => {
      if (el.parentId && elements[el.parentId]) {
        elements[el.parentId].children.push(el.id);
      }
    });

    if (Object.keys(elements).length === 0) return null;

    return {
      elements,
      rootId,
      selectedId: rootId,
      canvasWidth: 800,
      canvasHeight: 600
    };

  } catch (e) {
    console.error("Failed to parse Lua:", e);
    return null;
  }
};
