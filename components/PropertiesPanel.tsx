import React from 'react';
import { UIElement, ComponentType } from '../types';
import { Hash, Type, Layout, Palette, CheckCircle, Trash2, Settings2, AlignLeft, AlignCenter, AlignRight, MousePointer, Info, FolderTree, Sparkles, Image as ImageIcon, Layers, Move, Wand2, Box, Eye, LayoutTemplate } from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: UIElement | null;
  allElements: Record<string, UIElement>; // Needed for parenting
  onChange: (id: string, updates: Partial<UIElement['props']>) => void;
  onReparent: (id: string, newParentId: string | null) => void;
  onDelete: (id: string) => void;
}

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
  <div className="border-b border-neutral-800 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
    <div className="flex items-center gap-2 mb-3 text-neutral-500 bg-neutral-800/30 p-1.5 rounded">
      <Icon className="w-3.5 h-3.5" />
      <h3 className="text-[10px] font-bold uppercase tracking-wider">{title}</h3>
    </div>
    <div className="space-y-3 px-1">
      {children}
    </div>
  </div>
);

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    // Basic hex helper
    const r = parseInt(value.slice(1, 3), 16) || 0;
    const g = parseInt(value.slice(3, 5), 16) || 0;
    const b = parseInt(value.slice(5, 7), 16) || 0;

    const updateHex = (c: 'r' | 'g' | 'b', val: number) => {
        val = Math.min(255, Math.max(0, val));
        const hex = val.toString(16).padStart(2, '0');
        let newHex = value;
        if (c === 'r') newHex = `#${hex}${value.slice(3, 7)}`;
        if (c === 'g') newHex = `#${value.slice(1, 3)}${hex}${value.slice(5, 7)}`;
        if (c === 'b') newHex = `#${value.slice(1, 5)}${hex}`;
        onChange(newHex);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-[10px] text-neutral-400">{label}</label>
                <span className="text-[9px] font-mono text-neutral-500">{value}</span>
            </div>
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded border border-neutral-700 overflow-hidden relative cursor-pointer shrink-0">
                    <input 
                        type="color" value={value} onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-[-4px] w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                    />
                </div>
                <div className="flex gap-1 flex-1">
                    <input type="number" value={r} onChange={(e) => updateHex('r', parseInt(e.target.value))} className="w-full bg-neutral-800 rounded border border-neutral-700 text-center text-[10px] text-red-300" placeholder="R" />
                    <input type="number" value={g} onChange={(e) => updateHex('g', parseInt(e.target.value))} className="w-full bg-neutral-800 rounded border border-neutral-700 text-center text-[10px] text-green-300" placeholder="G" />
                    <input type="number" value={b} onChange={(e) => updateHex('b', parseInt(e.target.value))} className="w-full bg-neutral-800 rounded border border-neutral-700 text-center text-[10px] text-blue-300" placeholder="B" />
                </div>
            </div>
        </div>
    );
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, allElements, onChange, onReparent, onDelete }) => {
  if (!selectedElement) {
    return (
      <div className="w-full h-full bg-neutral-900 p-6 flex flex-col items-center justify-center text-center text-neutral-500 shrink-0">
        <Settings2 className="w-10 h-10 mb-4 opacity-20" />
        <p className="text-sm font-medium">No Selection</p>
        <p className="text-xs mt-1 opacity-60">Click an element to edit</p>
      </div>
    );
  }

  const { props, type, id } = selectedElement;

  const handleChange = (key: string, value: any) => {
    const finalValue = (['x','y','w','h', 'borderWidth', 'borderRadius', 'opacity', 'fontSize', 'fontWeight', 'layoutSpacing', 'layoutPadding', 'textShadowOffset', 'hoverOpacity', 'modelFov'].includes(key)) ? parseInt(value) || 0 : value;
    const floatValue = (['hoverScale'].includes(key)) ? parseFloat(value) || 1 : finalValue;
    onChange(id, { [key]: floatValue });
  };

  const autoGenerateHoverColor = () => {
      if (!props.color) return;
      // Simple lighten logic
      const hex = props.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Lighten by 20%
      const lighten = (c: number) => Math.min(255, Math.floor(c + (255 - c) * 0.2));
      const nr = lighten(r).toString(16).padStart(2, '0');
      const ng = lighten(g).toString(16).padStart(2, '0');
      const nb = lighten(b).toString(16).padStart(2, '0');
      
      onChange(id, { hoverColor: `#${nr}${ng}${nb}` });
  };

  // Logic for finding valid parents
  const validParents = (Object.values(allElements) as UIElement[]).filter((el) => {
      if (el.id === id) return false;
      return (el.type === ComponentType.DFrame || el.type === ComponentType.DPanel || el.type === ComponentType.DScrollPanel || el.type === ComponentType.DPropertySheet || el.type === ComponentType.DTab || el.type === ComponentType.DForm); 
  });

  // Check parent layout mode
  const parent = selectedElement.parentId ? allElements[selectedElement.parentId] : null;
  const isParentAutoLayout = parent && parent.props.layoutMode && parent.props.layoutMode !== 'none';
  const parentLayoutMode = parent?.props.layoutMode;

  // DTab specific: if parent is DPropertySheet, we assume auto layout in a way (tab managed)
  const isTabInSheet = type === ComponentType.DTab && parent?.type === ComponentType.DPropertySheet;

  return (
    <div className="w-full h-full bg-neutral-900 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-tight">{type}</span>
          <span className="text-sm font-bold text-white truncate font-mono" title={props.variableName}>{props.variableName}</span>
        </div>
        <button 
          onClick={() => onDelete(id)}
          className="text-neutral-500 hover:text-red-400 hover:bg-red-900/20 p-2 rounded transition-colors shrink-0"
          title="Delete Element"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        
        {/* Dimensions Section */}
        <Section title="Geometry" icon={Layout}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">X Pos</label>
              <input 
                type="number" value={props.x} onChange={(e) => handleChange('x', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isParentAutoLayout || isTabInSheet}
                title={(isParentAutoLayout || isTabInSheet) ? "Controlled by parent layout" : ""}
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Y Pos</label>
              <input 
                type="number" value={props.y} onChange={(e) => handleChange('y', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isParentAutoLayout || isTabInSheet}
                title={(isParentAutoLayout || isTabInSheet) ? "Controlled by parent layout" : ""}
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Width</label>
              <input 
                type="number" value={props.w} onChange={(e) => handleChange('w', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(isParentAutoLayout && parentLayoutMode === 'vertical') || isTabInSheet}
                title={((isParentAutoLayout && parentLayoutMode === 'vertical') || isTabInSheet) ? "Fills parent width" : ""}
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Height</label>
              <input 
                type="number" value={props.h} onChange={(e) => handleChange('h', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(isParentAutoLayout && parentLayoutMode === 'horizontal') || isTabInSheet}
                title={((isParentAutoLayout && parentLayoutMode === 'horizontal') || isTabInSheet) ? "Fills parent height" : ""}
              />
            </div>
          </div>
        </Section>
        
        {/* Structure Section for Parenting */}
        {type !== ComponentType.DFrame && (
            <Section title="Hierarchy" icon={FolderTree}>
                <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-400">Parent Element</label>
                    <select 
                        value={selectedElement.parentId || ''}
                        onChange={(e) => onReparent(id, e.target.value || null)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                        {validParents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                                {parent.props.variableName} ({parent.type})
                            </option>
                        ))}
                    </select>
                </div>
            </Section>
        )}

        {/* Auto Layout Section */}
        {(type === ComponentType.DFrame || type === ComponentType.DPanel || type === ComponentType.DScrollPanel || type === ComponentType.DTab || type === ComponentType.DForm) && (
             <Section title="Auto Layout" icon={Move}>
                 <div className="space-y-3">
                     <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Children Layout Mode</label>
                        <select 
                            value={props.layoutMode || 'none'} 
                            onChange={(e) => handleChange('layoutMode', e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                        >
                            <option value="none">None (Manual)</option>
                            <option value="vertical">Vertical Stack (Fill Top)</option>
                            <option value="horizontal">Horizontal Stack (Fill Left)</option>
                        </select>
                     </div>
                     {props.layoutMode && props.layoutMode !== 'none' && (
                         <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Spacing (px)</label>
                                <input 
                                    type="number" value={props.layoutSpacing || 0} onChange={(e) => handleChange('layoutSpacing', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                />
                             </div>
                             <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Padding (px)</label>
                                <input 
                                    type="number" value={props.layoutPadding || 0} onChange={(e) => handleChange('layoutPadding', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                />
                             </div>
                         </div>
                     )}
                 </div>
             </Section>
        )}
        
        {/* DFrame Window Settings */}
        {type === ComponentType.DFrame && (
            <Section title="Window Settings" icon={LayoutTemplate}>
                <div className="space-y-3">
                    <ColorInput label="Title Bar Color" value={props.titleBarColor || '#2a2a2a'} onChange={(v) => handleChange('titleBarColor', v)} />
                    
                    <div className="flex flex-col gap-2">
                         <label className="flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-800/50 p-1.5 rounded">
                            <span>Show Close Button</span>
                            <input 
                                type="checkbox" checked={props.showCloseButton !== false} onChange={(e) => handleChange('showCloseButton', e.target.checked)} 
                                className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-offset-neutral-900"
                            />
                         </label>
                         <label className="flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-800/50 p-1.5 rounded">
                            <span>Draggable (Runtime)</span>
                            <input 
                                type="checkbox" checked={props.draggable !== false} onChange={(e) => handleChange('draggable', e.target.checked)} 
                                className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-offset-neutral-900"
                            />
                         </label>
                         <label className="flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-800/50 p-1.5 rounded">
                            <span>Sizable (Runtime)</span>
                            <input 
                                type="checkbox" checked={props.sizable !== false} onChange={(e) => handleChange('sizable', e.target.checked)} 
                                className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-offset-neutral-900"
                            />
                         </label>
                         <label className="flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-800/50 p-1.5 rounded">
                            <span>Delete on Close</span>
                            <input 
                                type="checkbox" checked={props.deleteOnClose !== false} onChange={(e) => handleChange('deleteOnClose', e.target.checked)} 
                                className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-offset-neutral-900"
                            />
                         </label>
                    </div>
                </div>
            </Section>
        )}

        {/* Content Section */}
        <Section title="Content" icon={Type}>
             <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Variable Name</label>
                <input 
                  type="text" value={props.variableName} onChange={(e) => handleChange('variableName', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                />
             </div>
             
             {(type === ComponentType.DLabel || type === ComponentType.DButton || type === ComponentType.DFrame || type === ComponentType.DCheckBox || type === ComponentType.DTextEntry || type === ComponentType.DComboBox || type === ComponentType.DTab || type === ComponentType.DForm) && (
                <div className="mt-2">
                  <label className="block text-[10px] text-neutral-400 mb-1">
                      {type === ComponentType.DTab ? "Tab Title" : 
                       type === ComponentType.DForm ? "Form Label" : "Label / Text"}
                  </label>
                  <input 
                    type="text" value={props.text || ''} onChange={(e) => handleChange('text', e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
             )}

             {/* Text Shadow */}
             {(type === ComponentType.DLabel || type === ComponentType.DButton) && (
                 <div className="mt-3 pt-3 border-t border-neutral-800">
                     <div className="flex items-center justify-between mb-2">
                         <label className="text-[10px] text-neutral-400 font-semibold">Text Shadow</label>
                         <input 
                            type="checkbox" checked={props.textShadow || false} onChange={(e) => handleChange('textShadow', e.target.checked)}
                            className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-offset-neutral-900"
                         />
                     </div>
                     {props.textShadow && (
                         <div className="space-y-2">
                             <ColorInput 
                                label="Shadow Color" 
                                value={props.textShadowColor || '#000000'} 
                                onChange={(val) => handleChange('textShadowColor', val)} 
                             />
                             <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Offset (px)</label>
                                <input 
                                    type="number" value={props.textShadowOffset || 1} onChange={(e) => handleChange('textShadowOffset', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                />
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {/* Font Controls */}
             {(type === ComponentType.DLabel || type === ComponentType.DButton || type === ComponentType.DTextEntry || type === ComponentType.DCheckBox) && (
                 <div className="mt-4 pt-3 border-t border-neutral-800">
                     <label className="block text-[10px] text-neutral-400 mb-2 font-semibold">Typography</label>
                     <div className="space-y-2">
                         <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">Font Family</label>
                            <select 
                                value={props.fontFamily || 'DermaDefault'} 
                                onChange={(e) => handleChange('fontFamily', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                            >
                                <option value="DermaDefault">DermaDefault</option>
                                <option value="DermaDefaultBold">DermaDefaultBold</option>
                                <option value="DermaLarge">DermaLarge</option>
                                <option value="ChatFont">ChatFont</option>
                                <option value="TargetID">TargetID</option>
                                <option value="BudgetLabel">BudgetLabel</option>
                                <option value="Arial">Arial (Standard)</option>
                            </select>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] text-neutral-500 mb-1">Size (Override)</label>
                                <input 
                                    type="number" value={props.fontSize || 0} onChange={(e) => handleChange('fontSize', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white placeholder-neutral-600"
                                    placeholder="Default"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-neutral-500 mb-1">Weight</label>
                                <select 
                                    value={props.fontWeight || 400} 
                                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                >
                                    <option value="300">Light (300)</option>
                                    <option value="400">Normal (400)</option>
                                    <option value="600">Semi-Bold (600)</option>
                                    <option value="700">Bold (700)</option>
                                </select>
                            </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* Text Alignment */}
             {(type === ComponentType.DLabel || type === ComponentType.DButton || type === ComponentType.DTextEntry) && (
                 <div className="mt-3">
                    <label className="block text-[10px] text-neutral-400 mb-1">Text Alignment</label>
                    <div className="flex bg-neutral-800 rounded border border-neutral-700 p-0.5">
                        {['left', 'center', 'right'].map((align) => (
                            <button
                                key={align}
                                onClick={() => handleChange('textAlign', align)}
                                className={`flex-1 flex items-center justify-center py-1 rounded-sm transition-colors ${props.textAlign === align || (!props.textAlign && align === 'center') ? 'bg-neutral-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                title={`Align ${align}`}
                            >
                                {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                                {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                                {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>
                 </div>
             )}
             
             {/* Tooltip */}
             <div className="mt-3">
                  <label className="block text-[10px] text-neutral-400 mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Tooltip Text
                  </label>
                  <input 
                    type="text" value={props.tooltip || ''} onChange={(e) => handleChange('tooltip', e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none placeholder-neutral-700"
                    placeholder="Hover text..."
                  />
             </div>
        </Section>

        {/* Image Section */}
        {(type === ComponentType.DImage || type === ComponentType.DTab) && (
             <Section title={type === ComponentType.DTab ? "Icon" : "Image Source"} icon={ImageIcon}>
                <div className="space-y-3">
                    <div>
                       <label className="block text-[10px] text-neutral-400 mb-1">
                           {type === ComponentType.DTab ? "Icon Path (icon16/...)" : "Image URL / Material Path"}
                       </label>
                       <input 
                         type="text" value={props.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)}
                         className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 font-mono"
                         placeholder={type === ComponentType.DTab ? "icon16/page.png" : "vgui/avatar.png"}
                       />
                    </div>
                    {type === ComponentType.DImage && (
                        <ColorInput 
                            label="Image Tint Color" 
                            value={props.imageColor || '#ffffff'} 
                            onChange={(val) => handleChange('imageColor', val)} 
                        />
                    )}
                </div>
             </Section>
        )}

        {/* Model Section */}
        {type === ComponentType.DModelPanel && (
            <Section title="Model Settings" icon={Box}>
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Model Path</label>
                        <input 
                            type="text" value={props.modelPath || ''} onChange={(e) => handleChange('modelPath', e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 font-mono"
                            placeholder="models/player/kleiner.mdl"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">FOV</label>
                        <input 
                            type="number" value={props.modelFov || 50} onChange={(e) => handleChange('modelFov', e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500"
                        />
                    </div>
                </div>
            </Section>
        )}

        {/* Style Section */}
        <Section title="Styling" icon={Palette}>
            <div className="space-y-4">
                <ColorInput 
                    label="Background Color" 
                    value={props.color || '#ffffff'} 
                    onChange={(val) => handleChange('color', val)} 
                />
                
                {/* ... existing styles ... */}

                <div className="space-y-2">
                    <label className="block text-[10px] text-neutral-400">Opacity (0-255)</label>
                    <div className="flex gap-2 items-center">
                        <input 
                           type="range" min="0" max="255" value={props.opacity !== undefined ? props.opacity : 255} 
                           onChange={(e) => handleChange('opacity', e.target.value)}
                           className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <input 
                           type="number" min="0" max="255" value={props.opacity !== undefined ? props.opacity : 255} 
                           onChange={(e) => handleChange('opacity', e.target.value)}
                           className="w-10 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-xs text-right"
                        />
                    </div>
                </div>

                <div className="border-t border-neutral-800 pt-3 mt-3">
                     <label className="block text-[10px] text-neutral-400 mb-2 font-semibold">Border Style</label>
                     <div className="space-y-2">
                        <ColorInput 
                            label="Border Color" 
                            value={props.borderColor || '#000000'} 
                            onChange={(val) => handleChange('borderColor', val)} 
                        />
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Width (px)</label>
                                <input 
                                    type="number" value={props.borderWidth || 0} onChange={(e) => handleChange('borderWidth', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500"
                                    min="0"
                                />
                             </div>
                             <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Radius (px)</label>
                                <input 
                                    type="number" value={props.borderRadius || 0} onChange={(e) => handleChange('borderRadius', e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500"
                                    min="0"
                                />
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </Section>
        
        {/* Effects Section */}
         <Section title="Effects" icon={Sparkles}>
            <div className="space-y-4">
                 <div>
                    <div className="flex items-center justify-between mb-2">
                         <label className="block text-[10px] text-neutral-400">Hover Color</label>
                         <button 
                             onClick={autoGenerateHoverColor}
                             className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                             title="Auto-generate a lighter hover color"
                         >
                             <Wand2 className="w-3 h-3" /> Auto
                         </button>
                    </div>
                    <ColorInput 
                        label="" 
                        value={props.hoverColor || props.color || '#ffffff'} 
                        onChange={(val) => handleChange('hoverColor', val)} 
                    />
                 </div>
                 
                 <div>
                     <label className="block text-[10px] text-neutral-400 mb-2">Hover Scale Multiplier</label>
                     <div className="flex gap-2 items-center">
                         <input 
                            type="range" min="0.5" max="2.0" step="0.05" 
                            value={props.hoverScale || 1} 
                            onChange={(e) => handleChange('hoverScale', e.target.value)}
                            className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                         />
                         <span className="text-xs font-mono w-8 text-right">{props.hoverScale || 1}x</span>
                     </div>
                 </div>

                 <div className="space-y-2">
                    <label className="block text-[10px] text-neutral-400">Hover Opacity (0-255)</label>
                    <div className="flex gap-2 items-center">
                        <input 
                           type="range" min="0" max="255" value={props.hoverOpacity !== undefined ? props.hoverOpacity : 255} 
                           onChange={(e) => handleChange('hoverOpacity', e.target.value)}
                           className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <input 
                           type="number" min="0" max="255" value={props.hoverOpacity !== undefined ? props.hoverOpacity : 255} 
                           onChange={(e) => handleChange('hoverOpacity', e.target.value)}
                           className="w-10 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-xs text-right"
                        />
                    </div>
                </div>
                
                <ColorInput 
                    label="Hover Border Color" 
                    value={props.hoverBorderColor || props.borderColor || '#000000'} 
                    onChange={(val) => handleChange('hoverBorderColor', val)} 
                />
            </div>
         </Section>

        {/* Component Specifics */}
        {type === ComponentType.DCheckBox && (
           <Section title="Specifics" icon={CheckCircle}>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-800">
                <label htmlFor="chk-prop" className="text-xs text-neutral-300">Default Checked</label>
                <input 
                  type="checkbox" id="chk-prop" checked={props.checked || false} onChange={(e) => handleChange('checked', e.target.checked)}
                  className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-offset-neutral-900"
                />
             </div>
           </Section>
        )}

      </div>
    </div>
  );
};

export default PropertiesPanel;