import React, { useRef, useState, useEffect } from 'react';
import { EditorState, UIElement, ComponentType, ViewState } from '../types';
import { ZoomIn, ZoomOut, Grid as GridIcon, ImageOff, Cuboid } from 'lucide-react';

interface CanvasProps {
  state: EditorState;
  viewState: ViewState;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<UIElement['props']>) => void;
  onViewChange: (newView: ViewState) => void;
  onDeleteElement?: (id: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({ state, viewState, onSelect, onUpdateElement, onViewChange, onDeleteElement }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const snap = (val: number) => {
      if (!viewState.showGrid) return val;
      const s = viewState.gridSize;
      return Math.round(val / s) * s;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.001;
        const newZoom = Math.min(Math.max(0.1, viewState.zoom + zoomDelta), 5);
        onViewChange({ ...viewState, zoom: newZoom });
    } else {
        onViewChange({ 
            ...viewState, 
            panX: viewState.panX - e.deltaX, 
            panY: viewState.panY - e.deltaY 
        });
    }
  };

  const startPan = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
        e.stopPropagation();
    } else if (e.button === 0 && e.target === containerRef.current) {
        onSelect(null);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            onViewChange({
                ...viewState,
                panX: viewState.panX + dx,
                panY: viewState.panY + dy
            });
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleGlobalMouseUp = () => {
        setIsPanning(false);
    };

    if (isPanning) {
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, lastMousePos, viewState, onViewChange]);

  const renderResizeHandles = (el: UIElement) => {
      // Don't show handles if element is in an auto-layout container
      const parent = el.parentId ? state.elements[el.parentId] : null;
      if (parent && parent.props.layoutMode && parent.props.layoutMode !== 'none') return null;

      const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
      const size = 8 / viewState.zoom;
      
      const onResizeStart = (e: React.MouseEvent, dir: string) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startY = e.clientY;
          const startProps = { ...el.props };

          const handleResizeMove = (moveEvent: MouseEvent) => {
              const dx = (moveEvent.clientX - startX) / viewState.zoom;
              const dy = (moveEvent.clientY - startY) / viewState.zoom;
              
              const newProps = { ...startProps };

              if (dir.includes('e')) newProps.w = Math.max(10, startProps.w + dx);
              if (dir.includes('s')) newProps.h = Math.max(10, startProps.h + dy);
              if (dir.includes('w')) {
                  const delta = Math.min(startProps.w - 10, dx);
                  newProps.x = startProps.x + delta;
                  newProps.w = startProps.w - delta;
              }
              if (dir.includes('n')) {
                  const delta = Math.min(startProps.h - 10, dy);
                  newProps.y = startProps.y + delta;
                  newProps.h = startProps.h - delta;
              }

              newProps.x = snap(newProps.x);
              newProps.y = snap(newProps.y);
              newProps.w = snap(newProps.w);
              newProps.h = snap(newProps.h);

              onUpdateElement(el.id, newProps);
          };

          const handleResizeUp = () => {
              document.removeEventListener('mousemove', handleResizeMove);
              document.removeEventListener('mouseup', handleResizeUp);
          };

          document.addEventListener('mousemove', handleResizeMove);
          document.addEventListener('mouseup', handleResizeUp);
      };

      return handles.map(dir => {
          const style: React.CSSProperties = {
              position: 'absolute',
              width: size,
              height: size,
              backgroundColor: '#3b82f6',
              border: '1px solid white',
              zIndex: 50,
              pointerEvents: 'auto'
          };
          
          if (dir === 'n') { style.top = -size/2; style.left = '50%'; style.transform = 'translateX(-50%)'; style.cursor = 'ns-resize'; }
          if (dir === 's') { style.bottom = -size/2; style.left = '50%'; style.transform = 'translateX(-50%)'; style.cursor = 'ns-resize'; }
          if (dir === 'w') { style.left = -size/2; style.top = '50%'; style.transform = 'translateY(-50%)'; style.cursor = 'ew-resize'; }
          if (dir === 'e') { style.right = -size/2; style.top = '50%'; style.transform = 'translateY(-50%)'; style.cursor = 'ew-resize'; }
          if (dir === 'nw') { style.top = -size/2; style.left = -size/2; style.cursor = 'nwse-resize'; }
          if (dir === 'ne') { style.top = -size/2; style.right = -size/2; style.cursor = 'nesw-resize'; }
          if (dir === 'sw') { style.bottom = -size/2; style.left = -size/2; style.cursor = 'nesw-resize'; }
          if (dir === 'se') { style.bottom = -size/2; style.right = -size/2; style.cursor = 'nwse-resize'; }

          return <div key={dir} style={style} onMouseDown={(e) => onResizeStart(e, dir)} />;
      });
  };

  const renderVGUIContent = (el: UIElement, isSelected: boolean) => {
      const baseText = "font-sans text-[11px] select-none";
      const isHovered = hoveredId === el.id;

      // Dynamic styles based on props
      const bgColor = (isHovered && el.props.hoverColor) ? el.props.hoverColor : el.props.color;
      const borderColor = (isHovered && el.props.hoverBorderColor) ? el.props.hoverBorderColor : el.props.borderColor;
      const opacity = (isHovered && el.props.hoverOpacity !== undefined) ? el.props.hoverOpacity / 255 : (el.props.opacity !== undefined ? el.props.opacity / 255 : 1);
      
      const textShadowStyle = (el.props.textShadow && el.props.textShadowColor) 
          ? `${el.props.textShadowOffset || 1}px ${el.props.textShadowOffset || 1}px 0px ${el.props.textShadowColor}`
          : undefined;

      const commonStyle: React.CSSProperties = {
          backgroundColor: bgColor,
          borderColor: borderColor || 'transparent',
          borderWidth: el.props.borderWidth ? `${el.props.borderWidth}px` : '0px',
          borderStyle: (el.props.borderWidth && el.props.borderWidth > 0) ? 'solid' : 'none',
          borderRadius: el.props.borderRadius ? `${el.props.borderRadius}px` : '0px',
          justifyContent: el.props.textAlign === 'center' ? 'center' : el.props.textAlign === 'right' ? 'flex-end' : 'flex-start',
          opacity: opacity,
          fontFamily: el.props.fontFamily || 'Arial, sans-serif',
          fontSize: el.props.fontSize ? `${el.props.fontSize}px` : undefined,
          fontWeight: el.props.fontWeight,
          textShadow: textShadowStyle,
      };

      const titleBarStyle: React.CSSProperties = {
          fontFamily: el.props.fontFamily || 'Arial, sans-serif',
          fontSize: el.props.fontSize ? `${el.props.fontSize}px` : undefined,
          fontWeight: el.props.fontWeight,
      };

      switch (el.type) {
          case ComponentType.DFrame:
              const titleColor = el.props.titleBarColor || '#2a2a2a';
              return (
                  <div 
                      className="flex flex-col h-full w-full bg-[#323232] shadow-xl"
                      style={{ ...commonStyle, backgroundColor: bgColor || '#323232', overflow: 'hidden' }}
                  >
                      <div 
                        className="h-6 flex items-center px-2 border-b border-black/40 shrink-0 dframe-titlebar"
                        style={{ backgroundColor: titleColor }}
                      >
                          <span className={`${baseText} text-white/90 font-bold`} style={titleBarStyle}>{el.props.text || 'DFrame'}</span>
                          <div className="ml-auto flex gap-1 opacity-60">
                              <div className="w-3 h-3 bg-white/10 rounded-sm hover:bg-white/20"></div>
                              {el.props.showCloseButton !== false && (
                                <div 
                                    className="w-3 h-3 bg-white/10 rounded-sm hover:bg-red-500/80 cursor-pointer pointer-events-auto"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeleteElement) onDeleteElement(el.id);
                                    }}
                                    title="Close"
                                ></div>
                              )}
                          </div>
                      </div>
                      <div className="flex-1 relative overflow-hidden bg-transparent">
                          {/* Children area */}
                      </div>
                  </div>
              );
          
          case ComponentType.DButton:
              return (
                  <div 
                      className="w-full h-full bg-[#505050] hover:bg-[#606060] border border-black/50 flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] px-2"
                      style={{ ...commonStyle, backgroundColor: bgColor || (isHovered ? '#606060' : '#505050') }}
                  >
                      <span className={`${baseText} text-white w-full text-center`} style={commonStyle}>{el.props.text || 'Button'}</span>
                  </div>
              );
          
          case ComponentType.DTextEntry:
              return (
                  <div className="w-full h-full bg-white border border-neutral-400 flex items-center px-1.5 shadow-inner" style={{borderRadius: commonStyle.borderRadius}}>
                      <span className={`${baseText} text-black truncate w-full`} style={{...commonStyle, backgroundColor: 'transparent', borderWidth: 0 }}>{el.props.text}</span>
                      {!el.props.text && <div className="w-[1px] h-3 bg-black animate-pulse"></div>}
                  </div>
              );
          
          case ComponentType.DCheckBox:
              return (
                  <div className="flex items-center gap-1.5 h-full" style={{opacity: commonStyle.opacity}}>
                      <div className="w-4 h-4 bg-white border border-neutral-400 flex items-center justify-center shadow-sm shrink-0">
                          {el.props.checked && <div className="w-2.5 h-2.5 bg-[#3399FF] shadow-sm"></div>}
                      </div>
                      <span className={`${baseText} text-white`} style={{fontFamily: commonStyle.fontFamily, fontSize: commonStyle.fontSize, fontWeight: commonStyle.fontWeight}}>{el.props.text || 'CheckBox'}</span>
                  </div>
              );

          case ComponentType.DLabel:
               // Simple font mapping for visualization
               let fontStyle = commonStyle.fontFamily;
               let fontWeight = commonStyle.fontWeight;
               let fontSize = commonStyle.fontSize;
               if (fontStyle === 'DermaDefault') { fontStyle = 'Arial, sans-serif'; fontSize = '13px'; }
               if (fontStyle === 'DermaDefaultBold') { fontStyle = 'Arial, sans-serif'; fontWeight = 700; fontSize = '13px'; }
               if (fontStyle === 'DermaLarge') { fontStyle = 'Arial, sans-serif'; fontWeight = 700; fontSize = '18px'; }
               if (fontStyle === 'ChatFont') { fontStyle = 'Verdana, sans-serif'; fontSize = '14px'; }

               return (
                  <div className="w-full h-full flex items-center" style={{ ...commonStyle, fontFamily: fontStyle, fontWeight, fontSize, backgroundColor: 'transparent', border: 'none' }}>
                       <span className={`${baseText} text-white`} style={{...commonStyle, fontFamily: fontStyle, fontWeight, fontSize}}>{el.props.text || 'Label'}</span>
                  </div>
               );
               
          case ComponentType.DImage:
              return (
                  <div className="w-full h-full overflow-hidden relative" style={commonStyle}>
                      {el.props.imageUrl ? (
                          <>
                            {/* Wrapper for tinting using blend mode */}
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: el.props.imageColor || 'transparent' }}>
                                <img 
                                    src={el.props.imageUrl} 
                                    alt="DImage" 
                                    className="w-full h-full object-cover pointer-events-none" 
                                    style={{ mixBlendMode: el.props.imageColor ? 'multiply' : 'normal' }}
                                />
                            </div>
                          </>
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-600 border border-dashed border-neutral-700">
                             <ImageOff className="w-6 h-6 mb-1 opacity-50" />
                             <span className="text-[9px]">No Image</span>
                          </div>
                      )}
                  </div>
              );
          
          case ComponentType.DModelPanel:
              return (
                  <div className="w-full h-full bg-[#1a1a1a] border border-neutral-700 flex flex-col items-center justify-center relative overflow-hidden" style={commonStyle}>
                       <Cuboid className="w-8 h-8 text-neutral-600 mb-2 opacity-50" />
                       <span className="text-[9px] text-neutral-500 font-mono text-center px-1 break-all">{el.props.modelPath || "No Model"}</span>
                       <div className="absolute top-1 right-1 text-[8px] text-neutral-600">3D</div>
                  </div>
              );
              
          case ComponentType.DForm:
              return (
                  <div className="w-full h-full bg-white flex flex-col border border-neutral-400 rounded-sm" style={commonStyle}>
                       <div className="bg-neutral-200 border-b border-neutral-300 px-2 py-1">
                           <span className="text-black text-[10px] font-bold">{el.props.text || "Form"}</span>
                       </div>
                       <div className="flex-1 bg-white p-1">
                           {/* Form content goes here */}
                       </div>
                  </div>
              );

          case ComponentType.DPanel:
          case ComponentType.DScrollPanel:
          case ComponentType.DTab: 
          // DTab usually renders as a panel inside the sheet content area
              return (
                  <div 
                    className="w-full h-full bg-[#383838] border border-black/30" 
                    style={{ ...commonStyle, backgroundColor: bgColor || '#383838' }}
                  >
                  </div>
              );

          case ComponentType.DComboBox:
              return (
                  <div className="w-full h-full bg-[#505050] border border-black/50 flex items-center justify-between px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" style={commonStyle}>
                      <span className={`${baseText} text-white`}>{el.props.text || 'Select...'}</span>
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white/80"></div>
                  </div>
              );
          
          case ComponentType.DPropertySheet:
              return (
                  <div className="w-full h-full bg-[#383838] flex flex-col" style={commonStyle}>
                      {/* Fake Tab Bar */}
                      <div className="flex px-1 pt-1 gap-1 overflow-hidden">
                          {/* Render fake tabs based on children DTabs */}
                          {el.children.map(childId => {
                               const child = state.elements[childId];
                               if (child.type === ComponentType.DTab) {
                                   return (
                                       <div key={childId} className="bg-[#f0f0f0] text-black text-[10px] px-2 py-0.5 rounded-t-sm border-t border-l border-r border-neutral-400 flex items-center gap-1">
                                           {child.props.imageUrl && <div className="w-3 h-3 bg-neutral-400 rounded-full" />}
                                           {child.props.text || "Tab"}
                                       </div>
                                   );
                               }
                               return null;
                          })}
                          {el.children.filter(c => state.elements[c].type === ComponentType.DTab).length === 0 && (
                              <div className="bg-[#f0f0f0] text-black text-[10px] px-2 py-0.5 rounded-t-sm border-t border-l border-r border-neutral-400 opacity-50">Empty Sheet</div>
                          )}
                      </div>
                      <div className="flex-1 bg-[#f0f0f0] border border-neutral-400 rounded-b-sm m-1 mt-0 relative p-1">
                          {/* Children area for sheet content */}
                      </div>
                  </div>
              );

          case ComponentType.DListView:
              return (
                  <div className="w-full h-full bg-white border border-neutral-400 flex flex-col shadow-inner" style={{ ...commonStyle, backgroundColor: 'white' }}>
                      {/* Header */}
                      <div className="h-5 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0] border-b border-[#a0a0a0] flex">
                          <div className="flex-1 border-r border-[#a0a0a0] px-1 flex items-center">
                              <span className="text-[10px] text-black/80 font-medium">Column 1</span>
                          </div>
                          <div className="flex-1 px-1 flex items-center">
                               <span className="text-[10px] text-black/80 font-medium">Column 2</span>
                          </div>
                      </div>
                      {/* Rows */}
                      <div className="flex-1 bg-white flex flex-col">
                           <div className="flex h-4 hover:bg-[#3399FF] hover:text-white group text-black">
                               <div className="flex-1 px-1 flex items-center truncate text-[10px]">Item A</div>
                               <div className="flex-1 px-1 flex items-center truncate text-[10px]">Detail A</div>
                           </div>
                      </div>
                  </div>
              );

          default:
              return (
                  <div className="w-full h-full bg-[#2a2a2a] border border-dashed border-neutral-600 flex items-center justify-center" style={{opacity: commonStyle.opacity}}>
                      <span className="text-[10px] text-neutral-500 font-mono">{el.type}</span>
                  </div>
              );
      }
  };

  const renderElement = (id: string) => {
    const el = state.elements[id];
    if (!el) return null;

    const isSelected = state.selectedId === id;
    const isHovered = hoveredId === id;
    const parent = el.parentId ? state.elements[el.parentId] : null;
    const isAutoLayout = parent?.props.layoutMode && parent.props.layoutMode !== 'none';
    
    // Check if element is a Tab inside a PropertySheet
    const isTabInSheet = el.type === ComponentType.DTab && parent?.type === ComponentType.DPropertySheet;

    // Apply Scale Transform if Hovered
    const scale = (isHovered && el.props.hoverScale) ? el.props.hoverScale : 1;
    
    // Simulate Dock behavior:
    const layoutWidth = (isAutoLayout && parent?.props.layoutMode === 'vertical') ? '100%' : el.props.w;
    const layoutHeight = (isAutoLayout && parent?.props.layoutMode === 'horizontal') ? '100%' : el.props.h;

    // DForm header fix: Auto-layout usually, but we want it to look like a form
    // If it's DForm, children stack vertically by default in GMod (DForm inherits DCollapsibleCategory/Panel which layouts children)
    // We can force auto-layout visual for DForm children if we want, but user controls it via props.
    
    let finalStyle: React.CSSProperties = {
      position: (isAutoLayout || isTabInSheet) ? 'relative' : 'absolute',
      left: (isAutoLayout || isTabInSheet) ? undefined : el.props.x,
      top: (isAutoLayout || isTabInSheet) ? undefined : el.props.y,
      width: isTabInSheet ? '100%' : layoutWidth,
      height: isTabInSheet ? '100%' : layoutHeight,
      zIndex: isSelected ? 10 : 1,
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transition: 'transform 0.1s ease-out',
      transformOrigin: 'center center',
      flexShrink: 0 
    };
    
    // DPropertySheet Children Handling
    // If element is DPropertySheet, its children (DTabs) should be rendered inside the content area.
    // We override children container style for PropertySheet.
    if (el.type === ComponentType.DPropertySheet) {
        // We need to target the content area div which is the second child of the main render
        // But here we wrap children. 
        // We will just let them render in the flow of the container div we created in renderVGUIContent?
        // No, renderVGUIContent returns a specific structure.
        // We need to Portal them? Or just use CSS grid/absolute?
        // Simplest: renderVGUIContent renders the *frame*, this children loop renders the contents.
        // We use absolute positioning for children inside the padding area.
    }
    
    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
      
      if (isAutoLayout || isTabInSheet) return; 

      // If DFrame, check if we clicked the title bar for dragging
      if (el.type === ComponentType.DFrame) {
         // Get the click position relative to the element
         const rect = e.currentTarget.getBoundingClientRect();
         const relativeY = e.clientY - rect.top;
         
         // Standard DFrame title bar height is around 24px
         if (relativeY > 24) {
             return; // Don't drag if not on title bar
         }
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = el.props.x;
      const startTop = el.props.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / viewState.zoom;
        const dy = (moveEvent.clientY - startY) / viewState.zoom;
        
        const newX = snap(startLeft + dx);
        const newY = snap(startTop + dy);

        onUpdateElement(id, { x: newX, y: newY });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // Calculate layout style for children container
    const childrenContainerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        // Auto Layout Flexbox Logic
        display: el.props.layoutMode && el.props.layoutMode !== 'none' ? 'flex' : 'block',
        flexDirection: el.props.layoutMode === 'horizontal' ? 'row' : 'column',
        gap: el.props.layoutSpacing ? `${el.props.layoutSpacing}px` : undefined,
        padding: el.props.layoutPadding ? `${el.props.layoutPadding}px` : undefined,
        overflowY: el.type === ComponentType.DScrollPanel ? 'auto' : 'hidden',
        overflowX: 'hidden'
    };
    
    // DPropertySheet Children Handling
    if (el.type === ComponentType.DPropertySheet) {
        childrenContainerStyle.position = 'absolute';
        childrenContainerStyle.top = '24px'; // Below tab bar
        childrenContainerStyle.left = '4px';
        childrenContainerStyle.right = '4px';
        childrenContainerStyle.bottom = '4px';
        childrenContainerStyle.width = 'auto';
        childrenContainerStyle.height = 'auto';
        childrenContainerStyle.overflow = 'hidden';
    }
    
    // DForm Children Handling
    if (el.type === ComponentType.DForm) {
        childrenContainerStyle.position = 'absolute';
        childrenContainerStyle.top = '24px'; // Below label
        childrenContainerStyle.left = '4px';
        childrenContainerStyle.right = '4px';
        childrenContainerStyle.bottom = '4px';
        childrenContainerStyle.width = 'auto';
        childrenContainerStyle.height = 'auto';
        // Force vertical layout for DForm typically
        childrenContainerStyle.display = 'flex';
        childrenContainerStyle.flexDirection = 'column';
        childrenContainerStyle.gap = '5px';
    }

    return (
      <div 
        key={id}
        style={finalStyle}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHoveredId(id)}
        onMouseLeave={() => setHoveredId(null)}
        title={el.props.tooltip} // Native Tooltip
        className={`group select-none ${isSelected ? 'outline outline-2 outline-blue-500' : ''}`}
      >
        {renderVGUIContent(el, isSelected)}
        
        <div className={`absolute inset-0 pointer-events-none ${el.type === ComponentType.DFrame ? 'top-6' : ''}`}>
             <div style={childrenContainerStyle} className="custom-scrollbar">
                 {el.children.map(childId => renderElement(childId))}
             </div>
        </div>

        {isSelected && renderResizeHandles(el)}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#151515] relative overflow-hidden flex flex-col">
       {/* Canvas Toolbar */}
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-neutral-800/80 backdrop-blur border border-neutral-700 rounded-lg p-1 flex flex-col shadow-xl">
                <button onClick={() => onViewChange({...viewState, zoom: Math.min(5, viewState.zoom + 0.1)})} className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => onViewChange({...viewState, zoom: Math.max(0.1, viewState.zoom - 0.1)})} className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => onViewChange({...viewState, showGrid: !viewState.showGrid})} className={`p-2 rounded transition-colors ${viewState.showGrid ? 'text-blue-400 bg-blue-900/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-700'}`} title="Toggle Grid"><GridIcon className="w-4 h-4" /></button>
                <div className="h-px bg-neutral-700 my-1"></div>
                <button onClick={() => onViewChange({...viewState, zoom: 1, panX: 0, panY: 0})} className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors text-xs font-bold" title="Reset View">1:1</button>
            </div>
       </div>

        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={startPan}
          style={{
            cursor: isPanning ? 'grabbing' : 'default',
            backgroundImage: viewState.showGrid ? 'radial-gradient(#444 1px, transparent 1px)' : undefined,
            backgroundSize: `${viewState.gridSize * viewState.zoom}px ${viewState.gridSize * viewState.zoom}px`,
            backgroundPosition: `${viewState.panX}px ${viewState.panY}px`
          }}
        >
            <div 
                className="absolute transform-gpu origin-top-left"
                style={{
                    transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`,
                    width: '100%',
                    height: '100%'
                }}
            >
                {state.rootId ? renderElement(state.rootId) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `scale(${1/viewState.zoom})` }}>
                        <div className="text-center text-neutral-600 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 backdrop-blur-sm">
                            <p className="text-xl font-bold mb-2">Empty Canvas</p>
                            <p className="text-sm">Add a DFrame to start building your UI.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        <div className="h-6 bg-neutral-900 border-t border-neutral-800 flex items-center px-4 text-[10px] text-neutral-500 space-x-4 z-10">
            <span>Zoom: {Math.round(viewState.zoom * 100)}%</span>
            <span>Grid: {viewState.showGrid ? `${viewState.gridSize}px` : 'Off'}</span>
        </div>
    </div>
  );
};

export default Canvas;