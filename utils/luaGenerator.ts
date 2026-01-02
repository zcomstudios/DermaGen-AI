import { EditorState, UIElement, ComponentType } from '../types';
import { getMethodsForComponent } from './componentDefinitions';

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
    // If it's a standard GMod font, don't create a new one, just return it.
    const standardFonts = ['DermaDefault', 'DermaDefaultBold', 'DermaLarge', 'ChatFont', 'TargetID', 'BudgetLabel'];
    if (standardFonts.includes(family)) return null;

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
          const fontName = createFontName(el.props.fontFamily, el.props.fontSize, el.props.fontWeight || 400);
          if (fontName) {
              fontsToCreate.add(JSON.stringify({
                  font: el.props.fontFamily,
                  size: el.props.fontSize,
                  weight: el.props.fontWeight || 400
              }));
          }
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

  // Recursive function to generate code
  const traverse = (id: string, parentVarName: string | null) => {
    const el = elements[id];
    if (!el) return;
    
    // Check if parent has auto-layout
    const parent = parentVarName ? Object.values(elements).find(e => e.props.variableName === parentVarName) : null;
    const isDocked = parent && parent.props.layoutMode && parent.props.layoutMode !== 'none';
    const isTab = el.type === ComponentType.DTab && parent?.type === ComponentType.DPropertySheet;

    const varName = el.props.variableName;
    const isRoot = parentVarName === null;

    lines.push("");
    
    // Creation Logic
    if (isTab) {
        // DTab acts as a DPanel inside the sheet
        lines.push(`local ${varName} = vgui.Create("DPanel", ${parentVarName})`);
    } else {
        lines.push(`local ${varName} = vgui.Create("${el.type}"${!isRoot ? `, ${parentVarName}` : ''})`);
    }
    
    // Layout Logic
    if (isTab) {
        // No explicit position needed usually, it's added to sheet later
        // But we might want to set size if not auto? Usually Sheet handles it.
        lines.push(`${varName}:SetBackgroundColor(${hexToColorObj(el.props.color || '#ffffff')})`);
    } else if (isDocked) {
         // Auto Layout means we use Dock instead of SetPos
         if (parent?.props.layoutMode === 'vertical') {
             lines.push(`${varName}:Dock(TOP)`);
         } else if (parent?.props.layoutMode === 'horizontal') {
             lines.push(`${varName}:Dock(LEFT)`);
         }
         
         if (parent?.props.layoutSpacing && parent.props.layoutSpacing > 0) {
              lines.push(`${varName}:DockMargin(0, 0, ${parent.props.layoutMode === 'horizontal' ? parent.props.layoutSpacing : 0}, ${parent.props.layoutMode === 'vertical' ? parent.props.layoutSpacing : 0})`);
         }

         lines.push(`${varName}:SetSize(${el.props.w}, ${el.props.h})`);
    } else {
         // Manual Positioning
         lines.push(`${varName}:SetSize(${el.props.w}, ${el.props.h})`);
         lines.push(`${varName}:SetPos(${el.props.x}, ${el.props.y})`);
    }

    if (isRoot) {
      lines.push(`${varName}:MakePopup()`);
    }

    // Auto Layout Padding for Container
    if (el.props.layoutMode && el.props.layoutMode !== 'none' && el.props.layoutPadding) {
        lines.push(`${varName}:DockPadding(${el.props.layoutPadding}, ${el.props.layoutPadding}, ${el.props.layoutPadding}, ${el.props.layoutPadding})`);
    }

    // Basic Properties
    if (el.props.text !== undefined) {
      if (el.type === ComponentType.DLabel || el.type === ComponentType.DButton || el.type === ComponentType.DCheckBox) {
        lines.push(`${varName}:SetText("${el.props.text}")`);
      } else if (el.type === ComponentType.DFrame) {
        lines.push(`${varName}:SetTitle("${el.props.text}")`);
      } else if (el.type === ComponentType.DTextEntry) {
         lines.push(`${varName}:SetText("${el.props.text}")`);
      } else if (el.type === ComponentType.DForm) {
          lines.push(`${varName}:SetName("${el.props.text}")`); // DForm uses SetName for label
      }
    }

    if (el.type === ComponentType.DCheckBox && el.props.checked !== undefined) {
        lines.push(`${varName}:SetChecked(${el.props.checked})`);
    }

    // DFrame Specifics
    if (el.type === ComponentType.DFrame) {
        if (el.props.draggable !== undefined) lines.push(`${varName}:SetDraggable(${el.props.draggable})`);
        if (el.props.sizable !== undefined) lines.push(`${varName}:SetSizable(${el.props.sizable})`);
        if (el.props.showCloseButton !== undefined) lines.push(`${varName}:ShowCloseButton(${el.props.showCloseButton})`);
        if (el.props.deleteOnClose !== undefined) lines.push(`${varName}:SetDeleteOnClose(${el.props.deleteOnClose})`);
    }

    // Image Property
    if ((el.type === ComponentType.DImage) && el.props.imageUrl) {
        lines.push(`${varName}:SetImage("${el.props.imageUrl}")`);
        if (el.props.imageColor) {
             lines.push(`${varName}:SetImageColor(${hexToColorObj(el.props.imageColor)})`);
        }
    }

    // Model Panel
    if (el.type === ComponentType.DModelPanel) {
        if (el.props.modelPath) lines.push(`${varName}:SetModel("${el.props.modelPath}")`);
        if (el.props.modelFov) lines.push(`${varName}:SetFOV(${el.props.modelFov})`);
    }

    // Font
    let fontName = null;
    if (el.props.fontFamily) {
        fontName = createFontName(el.props.fontFamily, el.props.fontSize || 0, el.props.fontWeight || 400);
        // If null, it's a standard font, use the name directly
        if (!fontName) fontName = el.props.fontFamily;
    }
    
    if (fontName) {
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

    // Hover Opacity Logic
    if (el.props.hoverOpacity !== undefined) {
        const normalAlpha = el.props.opacity !== undefined ? el.props.opacity : 255;
        lines.push(`${varName}.OnCursorEntered = function(self) self:SetAlpha(${el.props.hoverOpacity}) end`);
        lines.push(`${varName}.OnCursorExited = function(self) self:SetAlpha(${normalAlpha}) end`);
    }

    // Custom Painting (Background, Hover, Borders, Text Shadows)
    const hasCustomPaint = el.props.color || el.props.hoverColor || (el.props.borderWidth && el.props.borderWidth > 0) || el.props.hoverBorderColor;
    const hasHoverScale = el.props.hoverScale && el.props.hoverScale !== 1;
    const hasTextShadow = el.props.textShadow;
    const hasTitleBarColor = el.type === ComponentType.DFrame && el.props.titleBarColor;
    const hasCustomPaintMethod = el.props.methods && el.props.methods['Paint'];
    
    // DTab/DModelPanel/DForm might have internal paint, be careful overriding
    const safeToOverridePaint = ![ComponentType.DModelPanel, ComponentType.DForm, ComponentType.DPropertySheet, ComponentType.DListView, ComponentType.DScrollPanel].includes(el.type);

    if (hasCustomPaintMethod) {
        // User defined logic takes precedence
    } else if (safeToOverridePaint && (hasCustomPaint || hasHoverScale || hasTextShadow || hasTitleBarColor)) {
         // ... existing paint logic ...
         lines.push(`${varName}.Paint = function(self, w, h)`);
         
         if (hasHoverScale) {
              lines.push(`    if self:IsHovered() then`);
              lines.push(`        local m = Matrix()`);
              lines.push(`        local cX, cY = w/2, h/2`);
              lines.push(`        m:Translate(Vector(cX, cY, 0))`);
              lines.push(`        m:Scale(Vector(${el.props.hoverScale}, ${el.props.hoverScale}, 1))`);
              lines.push(`        m:Translate(-Vector(cX, cY, 0))`);
              lines.push(`        cam.PushModelMatrix(m)`);
              lines.push(`    end`);
         }

         const baseColor = el.props.color || (el.type === ComponentType.DPanel || el.type === ComponentType.DFrame ? '#ffffff' : null);
         if (baseColor) {
             const hoverColor = el.props.hoverColor || baseColor;
             const borderRadius = el.props.borderRadius || 0;
             lines.push(`    if self:IsHovered() then`);
             lines.push(`        draw.RoundedBox(${borderRadius}, 0, 0, w, h, ${hexToColorObj(hoverColor)})`);
             lines.push(`    else`);
             lines.push(`        draw.RoundedBox(${borderRadius}, 0, 0, w, h, ${hexToColorObj(baseColor)})`);
             lines.push(`    end`);
         }
         
         if (hasTitleBarColor) {
             lines.push(`    -- Title Bar`);
             lines.push(`    draw.RoundedBoxEx(${el.props.borderRadius || 0}, 0, 0, w, 24, ${hexToColorObj(el.props.titleBarColor!)}, true, true, false, false)`);
         }

         const borderWidth = el.props.borderWidth || 0;
         if (borderWidth > 0) {
             const borderColor = el.props.borderColor || '#000000';
             const hoverBorderColor = el.props.hoverBorderColor || borderColor;
             
             lines.push(`    if self:IsHovered() then`);
             lines.push(`        surface.SetDrawColor(${hexToRgb(hoverBorderColor)})`);
             lines.push(`    else`);
             lines.push(`        surface.SetDrawColor(${hexToRgb(borderColor)})`);
             lines.push(`    end`);
             lines.push(`    surface.DrawOutlinedRect(0, 0, w, h, ${borderWidth})`); 
         }

         if ((el.type === ComponentType.DLabel || el.type === ComponentType.DButton) && el.props.text) {
             const txtColor = 'color_white'; 
             const align = el.props.textAlign === 'left' ? 0 : el.props.textAlign === 'right' ? 2 : 1;
             const txtX = el.props.textAlign === 'left' ? 5 : el.props.textAlign === 'right' ? 'w-5' : 'w/2';
             const txtY = 'h/2';
             const font = fontName || (el.type === ComponentType.DLabel ? "DermaDefault" : "DermaDefaultBold");

             if (hasTextShadow) {
                 const shadowOff = el.props.textShadowOffset || 1;
                 const shadowCol = el.props.textShadowColor || '#000000';
                 lines.push(`    -- Text Shadow`);
                 lines.push(`    draw.SimpleText("${el.props.text}", "${font}", ${txtX}+${shadowOff}, ${txtY}+${shadowOff}, ${hexToColorObj(shadowCol)}, ${align}, 1)`);
             }
             lines.push(`    draw.SimpleText("${el.props.text}", "${font}", ${txtX}, ${txtY}, ${txtColor}, ${align}, 1)`);
         }

         if (hasHoverScale) {
             lines.push(`    if self:IsHovered() then cam.PopModelMatrix() end`);
         }

         lines.push(`end`);
    }
    
    // Custom Methods
    if (el.props.methods) {
        const availableMethods = getMethodsForComponent(el.type);
        Object.entries(el.props.methods).forEach(([methodName, code]) => {
            if (code && code.trim() !== '') {
                const sig = availableMethods.find(m => m.name === methodName);
                const args = sig ? sig.args.join(', ') : 'self, ...';
                lines.push(`${varName}.${methodName} = function(${args})`);
                code.split('\n').forEach(line => lines.push(`    ${line}`));
                lines.push(`end`);
            }
        });
    }

    // Process children
    el.children.forEach(childId => traverse(childId, varName));

    // Post-Processing for specific relationships
    if (isTab) {
        // AddSheet after children are processed (so everything is attached to the tab panel)
        lines.push(`${parentVarName}:AddSheet("${el.props.text || 'Tab'}", ${varName}, "${el.props.imageUrl || 'icon16/application.png'}")`);
    }
  };

  traverse(rootId, null);

  return lines.join('\n');
};