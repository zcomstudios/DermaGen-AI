import { EditorState, UIElement, ComponentType } from '../types';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
};

const hexToColorObj = (hex: string, alpha: number = 255) => {
  return `Color(${hexToRgb(hex)}, ${alpha})`;
};

// Simplified map for standard fonts just for unique naming
const createFontName = (family: string, size: number, weight: number) => {
    return `${family.replace(/\s+/g, '')}_${size}_${weight}`;
};

export const generateLuaCode = (state: EditorState): string => {
  const { elements, rootId } = state;
  if (!rootId) return "-- Add a DFrame to start";

  const lines: string[] = [];
  
  // 1. Generate Fonts
  const fontsToCreate = new Set<string>();
  Object.values(elements).forEach(el => {
      if (el.props.fontFamily && el.props.fontSize) {
          fontsToCreate.add(JSON.stringify({
              font: el.props.fontFamily,
              size: el.props.fontSize,
              weight: el.props.fontWeight || 400
          }));
      }
  });

  if (fontsToCreate.size > 0) {
      lines.push("-- Fonts");
      fontsToCreate.forEach(f => {
          const font = JSON.parse(f);
          const name = createFontName(font.font, font.size, font.weight);
          lines.push(`surface.CreateFont("${name}", {`);
          lines.push(`    font = "${font.font}",`);
          lines.push(`    size = ${font.size},`);
          lines.push(`    weight = ${font.weight}`);
          lines.push(`})`);
      });
      lines.push("");
  }

  // Helper to generate unique var names if needed, but we use the stored one
  const getVar = (id: string) => elements[id]?.props.variableName || 'elem';

  // Recursive function to generate code
  const traverse = (id: string, parentVarName: string | null) => {
    const el = elements[id];
    if (!el) return;

    const varName = el.props.variableName;
    const isRoot = parentVarName === null;

    lines.push("");
    lines.push(`local ${varName} = vgui.Create("${el.type}"${!isRoot ? `, ${parentVarName}` : ''})`);
    lines.push(`${varName}:SetSize(${el.props.w}, ${el.props.h})`);
    
    // Position handling
    if (isRoot) {
      lines.push(`${varName}:SetPos(${el.props.x}, ${el.props.y})`); 
      lines.push(`${varName}:MakePopup()`);
    } else {
       lines.push(`${varName}:SetPos(${el.props.x}, ${el.props.y})`);
    }

    // Basic Properties
    if (el.props.text !== undefined) {
      if (el.type === ComponentType.DLabel || el.type === ComponentType.DButton || el.type === ComponentType.DCheckBox) {
        lines.push(`${varName}:SetText("${el.props.text}")`);
      } else if (el.type === ComponentType.DFrame) {
        lines.push(`${varName}:SetTitle("${el.props.text}")`);
      } else if (el.type === ComponentType.DTextEntry) {
         lines.push(`${varName}:SetText("${el.props.text}")`);
      }
    }

    if (el.type === ComponentType.DCheckBox && el.props.checked !== undefined) {
        lines.push(`${varName}:SetChecked(${el.props.checked})`);
    }

    // Image Property
    if (el.type === ComponentType.DImage && el.props.imageUrl) {
        lines.push(`${varName}:SetImage("${el.props.imageUrl}")`);
    }

    // Font
    if (el.props.fontFamily && el.props.fontSize) {
        const fontName = createFontName(el.props.fontFamily, el.props.fontSize, el.props.fontWeight || 400);
        lines.push(`${varName}:SetFont("${fontName}")`);
    }

    // Tooltip
    if (el.props.tooltip) {
        lines.push(`${varName}:SetTooltip("${el.props.tooltip}")`);
    }

    // Text Alignment
    if (el.props.textAlign) {
        let alignVal = 5; // Center default
        if (el.props.textAlign === 'left') alignVal = 4;
        if (el.props.textAlign === 'right') alignVal = 6;
        lines.push(`${varName}:SetContentAlignment(${alignVal})`);
    }
    
    // Opacity (Alpha)
    if (el.props.opacity !== undefined && el.props.opacity < 255) {
        lines.push(`${varName}:SetAlpha(${el.props.opacity})`);
    }

    // Custom Painting (Background, Hover, Borders)
    const hasCustomPaint = el.props.color || el.props.hoverColor || (el.props.borderWidth && el.props.borderWidth > 0);
    const hasHoverScale = el.props.hoverScale && el.props.hoverScale !== 1;
    
    if ((hasCustomPaint || hasHoverScale) && (el.type === ComponentType.DPanel || el.type === ComponentType.DButton || el.type === ComponentType.DFrame)) {
         lines.push(`${varName}.Paint = function(self, w, h)`);
         
         const baseColor = el.props.color || '#ffffff';
         const hoverColor = el.props.hoverColor || baseColor;
         const borderRadius = el.props.borderRadius || 0;
         const borderColor = el.props.borderColor || '#000000';
         const borderWidth = el.props.borderWidth || 0;
         
         if (hasHoverScale) {
              lines.push(`    if self:IsHovered() then`);
              lines.push(`        -- Simple scale effect logic would require Matrix`);
              lines.push(`        -- This is a placeholder for Matrix scaling logic in Lua`);
              lines.push(`        local m = Matrix()`);
              lines.push(`        local cX, cY = w/2, h/2`);
              lines.push(`        m:Translate(Vector(cX, cY, 0))`);
              lines.push(`        m:Scale(Vector(${el.props.hoverScale}, ${el.props.hoverScale}, 1))`);
              lines.push(`        m:Translate(-Vector(cX, cY, 0))`);
              lines.push(`        cam.PushModelMatrix(m)`);
              lines.push(`    end`);
         }

         // Background logic with Hover
         if (el.props.hoverColor) {
             lines.push(`    if self:IsHovered() then`);
             lines.push(`        draw.RoundedBox(${borderRadius}, 0, 0, w, h, ${hexToColorObj(hoverColor)})`);
             lines.push(`    else`);
             lines.push(`        draw.RoundedBox(${borderRadius}, 0, 0, w, h, ${hexToColorObj(baseColor)})`);
             lines.push(`    end`);
         } else {
             lines.push(`    draw.RoundedBox(${borderRadius}, 0, 0, w, h, ${hexToColorObj(baseColor)})`);
         }

         // Border logic
         if (borderWidth > 0) {
             lines.push(`    surface.SetDrawColor(${hexToRgb(borderColor)})`);
             lines.push(`    surface.DrawOutlinedRect(0, 0, w, h, ${borderWidth})`); 
         }

         if (hasHoverScale) {
             lines.push(`    if self:IsHovered() then cam.PopModelMatrix() end`);
         }

         lines.push(`end`);
    }

    // Process children
    el.children.forEach(childId => traverse(childId, varName));
  };

  traverse(rootId, null);

  return lines.join('\n');
};
