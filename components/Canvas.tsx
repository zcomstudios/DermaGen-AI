import React, { useRef, useState, useEffect } from 'react';
import { EditorState, UIElement, ComponentType, ViewState } from '../types';
import { ZoomIn, ZoomOut, Grid as GridIcon, ImageOff, Cuboid, ChevronDown, ChevronRight, Layers, Check, Folder, FileText, Menu as MenuIcon, EyeOff, Lock, ArrowDown, ArrowRight, Layout } from 'lucide-react';

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
        // Only deselect if clicking strictly on the canvas background
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
      const parent = el.parentId ? state.elements[el.parentId] : null;
      if (parent && ((parent.props.layoutMode && parent.props.layoutMode !== 'none') || parent.type === ComponentType.DIconLayout || parent.type === ComponentType.DCollapsibleCategory)) {
           if (el.props.autoLayoutBehavior === 'fill') return null;
      }
      
      // DFrame sizable check
      if (el.type === ComponentType.DFrame && el.props.sizable === false) return null;

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
              position: 'absolute', width: size, height: size,
              backgroundColor: '#3b82f6', border: '1px solid white',
              zIndex: 50, cursor: `${dir}-resize`
          };
          if (dir === 'n') { style.top = -size/2; style.left = '50%'; style.transform = 'translateX(-50%)'; style.cursor = 'ns-resize'; }
          if (dir === 's') { style.bottom = -size/2; style.left = '50%'; style.transform = 'translateX(-50%)'; style.cursor = 'ns-resize'; }
          if (dir === 'w') { style.left = -size/2; style.top = '50%'; style.transform = 'translateY(-50%)'; style.cursor = 'ew-resize'; }
          if (dir === 'e') { style.right = -size/2; style.top = '50%'; style.transform = 'translateY(-50%)'; style.cursor = 'ew-resize'; }
          if (dir.includes('nw')) { style.top = -size/2; style.left = -size/2; }
          if (dir.includes('ne')) { style.top = -size/2; style.right = -size/2; }
          if (dir.includes('sw')) { style.bottom = -size/2; style.left = -size/2; }
          if (dir.includes('se')) { style.bottom = -size/2; style.right = -size/2; }

          return <div key={dir} style={style} onMouseDown={(e) => onResizeStart(e, dir)} />;
      });
  };

  const renderVGUIContent = (el: UIElement, isSelected: boolean) => {
      const baseText = "font-sans text-[11px] select-none";
      const isHovered = hoveredId === el.id;

      // Dynamic styles based on props
      const bgColor = (isHovered && el.props.hoverColor) ? el.props.hoverColor : el.props.color;
      const borderColor = (isHovered && el.props.hoverBorderColor) ? el.props.hoverBorderColor : el.props.borderColor;
      const borderWidth = (isHovered && el.props.hoverBorderWidth !== undefined) ? el.props.hoverBorderWidth : (el.props.borderWidth || 0);
      const opacity = (isHovered && el.props.hoverOpacity !== undefined) ? el.props.hoverOpacity / 255 : (el.props.opacity !== undefined ? el.props.opacity / 255 : 1);
      
      const textShadowStyle = (el.props.textShadow && el.props.textShadowColor) 
          ? `${el.props.textShadowOffset || 1}px ${el.props.textShadowOffset || 1}px 0px ${el.props.textShadowColor}`
          : undefined;

      const commonStyle: React.CSSProperties = {
          backgroundColor: bgColor || 'transparent',
          borderColor: borderColor || 'transparent',
          borderWidth: `${borderWidth}px`,
          borderStyle: borderWidth > 0 ? 'solid' : 'none',
          borderRadius: el.props.borderRadius ? `${el.props.borderRadius}px` : '0px',
          opacity: opacity,
          fontFamily: el.props.fontFamily || 'Arial, sans-serif',
          fontSize: el.props.fontSize ? `${el.props.fontSize}px` : undefined,
          fontWeight: el.props.fontWeight,
          textShadow: textShadowStyle,
          color: 'white', 
      };

      switch (el.type) {
          case ComponentType.DFrame:
              const titleColor = el.props.titleBarColor || '#2a2a2a';
              return (
                  <div className="flex flex-col h-full w-full bg-[#323232] shadow-xl overflow-hidden rounded-sm" style={commonStyle}>
                      <div className="h-6 flex items-center px-2 shrink-0 rounded-t-sm" style={{ backgroundColor: titleColor }}>
                          <span className={`${baseText} text-white/90 font-bold truncate max-w-[80%]`} style={{textShadow: textShadowStyle}}>{el.props.text || 'DFrame'}</span>
                          <div className="ml-auto flex gap-1">
                              {el.props.showCloseButton !== false && (
                                <div className="w-3.5 h-3.5 bg-white/10 rounded-sm hover:bg-red-500/80 cursor-pointer pointer-events-auto flex items-center justify-center" onClick={(e) => { e.stopPropagation(); onDeleteElement?.(el.id); }}>
                                    <span className="text-[8px] leading-none">×</span>
                                </div>
                              )}
                          </div>
                      </div>
                      <div className="flex-1 relative bg-transparent" />
                  </div>
              );
          case ComponentType.DButton:
              return (
                  <div className="w-full h-full bg-[#f0f0f0] border border-[#999999] flex items-center justify-center px-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] rounded-[2px]" style={{...commonStyle, backgroundColor: isHovered ? '#e1e1e1' : '#f0f0f0', color: 'black'}}>
                      <span className={baseText} style={{textShadow: textShadowStyle, textAlign: el.props.textAlign || 'center'}}>{el.props.text || 'Button'}</span>
                  </div>
              );
          case ComponentType.DBinder:
               return (
                  <div className="w-full h-full bg-[#505050] border border-black/50 flex items-center justify-center px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[3px]" style={commonStyle}>
                      <span className={baseText} style={{textShadow: textShadowStyle, textAlign: el.props.textAlign || 'center', color: '#d0d0d0'}}>{el.props.text || 'NONE'}</span>
                  </div>
              );
          case ComponentType.DLabel:
              return (
                  <div className="w-full h-full flex items-center" style={{ ...commonStyle, backgroundColor: 'transparent', border: 'none' }}>
                       <span className={baseText} style={{ ...commonStyle, textShadow: textShadowStyle, textAlign: el.props.textAlign || 'left', width: '100%' }}>{el.props.text || 'Label'}</span>
                  </div>
              );
          case ComponentType.DCheckBox:
              return (
                  <div className="flex items-center gap-2 h-full" style={{ opacity: commonStyle.opacity }}>
                      <div 
                        className={`w-3.5 h-3.5 rounded-[2px] border border-[#999999] bg-white flex items-center justify-center shadow-inner cursor-pointer pointer-events-auto`}
                        onClick={(e) => {
                            if (isSelected) {
                                e.stopPropagation();
                                onUpdateElement(el.id, { checked: !el.props.checked });
                            }
                        }}
                      >
                          {el.props.checked && (
                              <div className="text-black font-bold text-[10px] leading-none">✓</div>
                          )}
                      </div>
                      <span className={`${baseText}`} style={{ fontFamily: commonStyle.fontFamily, fontSize: commonStyle.fontSize, color: 'inherit' }}>{el.props.text || 'CheckBox'}</span>
                  </div>
              );
          case ComponentType.DComboBox:
              return (
                  <div className="w-full h-full bg-gradient-to-b from-white to-[#dddddd] border border-[#888888] flex items-center justify-between px-2 shadow-sm rounded-[2px]" style={{...commonStyle, color: 'black'}}>
                      <span className={`${baseText} truncate`}>{el.props.text || 'Select...'}</span>
                      <ChevronDown className="w-3 h-3 text-black/70" />
                  </div>
              );
          case ComponentType.DListView:
               return (
                  <div className="w-full h-full bg-white border border-[#999] flex flex-col shadow-inner overflow-hidden" style={{ ...commonStyle, backgroundColor: 'white' }}>
                      <div className="h-4 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0] border-b border-[#888] flex shrink-0 divide-x divide-[#a0a0a0]">
                          <div className="flex-1 px-1 flex items-center hover:bg-white/20"><span className="text-[10px] text-black font-medium">Column 1</span></div>
                          <div className="flex-1 px-1 flex items-center hover:bg-white/20"><span className="text-[10px] text-black font-medium">Column 2</span></div>
                      </div>
                      <div className="flex-1 bg-white flex flex-col overflow-y-auto">
                           <div className="flex h-4 border-b border-[#eee] text-black items-center hover:bg-[#3399ff] hover:text-white group"><div className="flex-1 px-1 text-[9px]">Item 1</div><div className="flex-1 px-1 text-[9px]">Data</div></div>
                           <div className="flex h-4 border-b border-[#eee] text-black items-center hover:bg-[#3399ff] hover:text-white group"><div className="flex-1 px-1 text-[9px]">Item 2</div><div className="flex-1 px-1 text-[9px]">Data</div></div>
                      </div>
                  </div>
              );
          case ComponentType.DPropertySheet:
              return (
                  <div className="w-full h-full flex flex-col" style={commonStyle}>
                      <div className="flex px-1 gap-0.5 overflow-hidden h-[18px]">
                          <div className="bg-[#f0f0f0] text-black text-[10px] px-2 rounded-t-[3px] border-t border-l border-r border-[#999] flex items-center h-full relative z-10 -mb-[1px] pb-[1px]">Active</div>
                          <div className="bg-[#dcdcdc] text-[#666] text-[10px] px-2 rounded-t-[3px] border-t border-l border-r border-[#999] flex items-center h-[16px] mt-[2px] hover:bg-[#e8e8e8]">Inactive</div>
                      </div>
                      <div className="flex-1 bg-[#f0f0f0] border border-[#999] relative rounded-b-[2px] rounded-tr-[2px]" />
                  </div>
              );
          case ComponentType.DColumnSheet:
              return (
                   <div className="w-full h-full flex bg-[#f0f0f0] border border-[#999] rounded-[2px]" style={commonStyle}>
                       <div className="w-1/4 bg-white border-r border-[#999] flex flex-col p-1 gap-1">
                            <div className="h-5 bg-[#e1e1e1] rounded-sm w-full border border-transparent hover:border-[#ccc] flex items-center px-1 text-black text-[9px]">Option 1</div>
                            <div className="h-5 rounded-sm w-full border border-transparent hover:border-[#ccc] hover:bg-[#f5f5f5] flex items-center px-1 text-black text-[9px]">Option 2</div>
                       </div>
                       <div className="flex-1 p-2 bg-[#f0f0f0]">
                           <div className="border border-[#ccc] w-full h-full bg-[#f9f9f9]"></div>
                       </div>
                  </div>
              );
          case ComponentType.DScrollPanel:
              return (
                  <div className="w-full h-full bg-transparent border border-transparent relative" style={commonStyle}>
                      <div className="absolute top-0 right-0 bottom-0 w-3.5 bg-[#f0f0f0] border-l border-[#ccc] flex flex-col items-center">
                          <div className="w-full h-3.5 bg-[#e0e0e0] border-b border-[#ccc] flex items-center justify-center text-[8px] text-[#666]">▲</div>
                          <div className="w-full flex-1 bg-[#e0e0e0]/30 py-0.5 px-[2px]">
                               <div className="w-full h-8 bg-[#cdcdcd] rounded-[2px] border border-[#aaa]" />
                          </div>
                          <div className="w-full h-3.5 bg-[#e0e0e0] border-t border-[#ccc] flex items-center justify-center text-[8px] text-[#666]">▼</div>
                      </div>
                  </div>
              );
          case ComponentType.DTree:
              return (
                  <div className="w-full h-full bg-white border border-[#999] flex flex-col p-1 overflow-hidden font-sans shadow-inner" style={{ ...commonStyle, backgroundColor: 'white', color: 'black' }}>
                      <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 px-1 py-0.5 hover:bg-[#e0e0e0] cursor-pointer group">
                              <div className="w-2.5 h-2.5 border border-[#ababab] bg-white flex items-center justify-center text-[7px] text-black shadow-sm">-</div>
                              <Folder className="w-3.5 h-3.5 text-[#e6b800] fill-[#e6b800]" />
                              <span className="text-[11px] text-black">models</span>
                          </div>
                          <div className="flex items-center gap-1 px-1 py-0.5 pl-5 bg-[#3399FF] text-white cursor-pointer border border-[#3399FF] rounded-sm">
                              <div className="w-2.5 h-2.5 border border-[#ababab] bg-white flex items-center justify-center text-[7px] text-black shadow-sm" style={{borderColor: '#888'}}>-</div>
                              <Folder className="w-3.5 h-3.5 text-white fill-white/20" />
                              <span className="text-[11px]">weapons</span>
                          </div>
                          <div className="flex items-center gap-1 px-1 py-0.5 pl-9 hover:bg-[#e0e0e0] cursor-pointer">
                              <div className="w-2.5 h-2.5" />
                              <FileText className="w-3 h-3 text-neutral-500" />
                              <span className="text-[11px] text-black">w_pistol.mdl</span>
                          </div>
                      </div>
                  </div>
              );
          case ComponentType.DCollapsibleCategory:
              return (
                  <div className="w-full h-full flex flex-col bg-white overflow-hidden border border-[#a0a0a0] shadow-sm" style={commonStyle}>
                       <div className="h-5 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0] border-b border-[#a0a0a0] px-1 flex items-center justify-between cursor-pointer">
                           <span className="text-[10px] text-black font-bold pl-1">{el.props.text || "Category"}</span>
                           <div className="w-3.5 h-3.5 flex items-center justify-center bg-white border border-neutral-400 rounded-sm text-black text-[8px] hover:border-blue-400">{el.props.expanded !== false ? '-' : '+'}</div>
                       </div>
                       <div className="flex-1 bg-[#f9f9f9] relative p-1" />
                  </div>
              );
          case ComponentType.DImage:
              return (
                  <div className="w-full h-full overflow-hidden relative" style={commonStyle}>
                      {el.props.imageUrl ? (
                        <div className="absolute inset-0" style={{ backgroundColor: el.props.imageColor || 'transparent' }}>
                            <img src={el.props.imageUrl} alt="" className={`w-full h-full ${el.props.keepAspect ? 'object-contain' : 'object-cover'}`} style={{ mixBlendMode: el.props.imageColor ? 'multiply' : 'normal' }} />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600 border border-dashed border-neutral-700">
                             <ImageOff className="w-6 h-6" />
                        </div>
                      )}
                  </div>
              );
          case ComponentType.DModelPanel:
              return (
                  <div className="w-full h-full bg-[#222] border border-[#666] flex flex-col items-center justify-center relative overflow-hidden shadow-inner" style={{...commonStyle, backgroundColor: '#222'}}>
                       <Cuboid className="w-10 h-10 text-neutral-500 mb-2 opacity-40" />
                       <div className="absolute top-1 right-1 text-[8px] text-[#666] font-bold border border-[#444] px-1 rounded bg-[#333]">3D</div>
                  </div>
              );
          case ComponentType.DNumSlider:
              return (
                  <div className="w-full h-full flex items-center gap-2 px-1 text-black" style={{...commonStyle, color: 'black'}}>
                       <span className={`${baseText} truncate w-16`} style={{textShadow: textShadowStyle}}>{el.props.text || "Slider"}</span>
                       <div className="flex-1 h-0.5 bg-[#999] relative flex items-center mx-1">
                           <div className="absolute left-[30%] w-2.5 h-3.5 bg-[#d0d0d0] border border-[#666] shadow-sm cursor-pointer hover:bg-white" />
                       </div>
                       <div className="w-10 h-4 bg-white border border-[#aaa] text-black text-[9px] flex items-center px-1 font-mono">
                           {el.props.value || 0}
                       </div>
                  </div>
              );
          case ComponentType.DNumberWang:
              return (
                  <div className="w-full h-full bg-white border border-[#aaa] flex rounded-[2px] overflow-hidden" style={{...commonStyle, color: 'black'}}>
                     <div className="flex-1 flex items-center px-1 text-black text-[10px]">{el.props.value || 0}</div>
                     <div className="w-3.5 border-l border-[#aaa] flex flex-col bg-[#f0f0f0]">
                         <div className="flex-1 flex items-center justify-center hover:bg-[#ddd] cursor-pointer text-[6px] text-black/70">▲</div>
                         <div className="flex-1 flex items-center justify-center hover:bg-[#ddd] cursor-pointer text-[6px] text-black/70 border-t border-[#aaa]">▼</div>
                     </div>
                  </div>
              );
          case ComponentType.DPanel:
              return (
                  <div className="w-full h-full bg-[#f0f0f0] border border-[#999]" style={{ ...commonStyle, backgroundColor: bgColor || '#f0f0f0' }} />
              );
          case ComponentType.DTab:
               return (
                  <div className="w-full h-full bg-[#f0f0f0] border border-neutral-400" style={{ ...commonStyle, backgroundColor: bgColor || '#f0f0f0' }} />
              );
          case ComponentType.DProgress:
               return (
                  <div className="w-full h-full bg-white border border-[#999] p-[1px] relative rounded-[2px]" style={commonStyle}>
                      <div className="h-full bg-[#5a81e4] w-[60%] shadow-sm relative overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px]" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] text-black font-medium shadow-black drop-shadow-sm">60%</div>
                  </div>
               );
          case ComponentType.DColorPalette:
               return (
                  <div className="w-full h-full bg-[#333] border border-[#666] grid grid-cols-6 grid-rows-4 gap-[1px] p-[1px]" style={commonStyle}>
                      {Array.from({length: 24}).map((_, i) => (
                          <div key={i} className="bg-red-500 hover:outline hover:outline-1 hover:outline-white cursor-pointer" style={{backgroundColor: `hsl(${i * 15}, 100%, 50%)`}} />
                      ))}
                  </div>
               );
          case ComponentType.DColorCube:
               return (
                  <div className="w-full h-full border border-[#666] relative" style={{...commonStyle, background: 'linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, red)'}}>
                      <div className="absolute right-2 top-2 w-2 h-2 rounded-full border border-white ring-1 ring-black cursor-pointer" />
                  </div>
               );
          case ComponentType.DColorMixer:
               return (
                  <div className="w-full h-full bg-[#f0f0f0] border border-[#999] flex gap-1 p-1" style={{...commonStyle, color: 'black'}}>
                       <div className="flex-1 h-full border border-[#666] relative" style={{background: 'linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, red)'}}>
                            <div className="absolute right-2 top-2 w-2 h-2 rounded-full border border-white ring-1 ring-black" />
                       </div>
                       <div className="w-4 h-full border border-[#666]" style={{background: 'linear-gradient(to bottom, red, yellow, lime, cyan, blue, magenta, red)'}}></div>
                       <div className="w-12 flex flex-col gap-1 justify-center">
                           <div className="h-3 bg-white border border-[#aaa] text-[8px] flex items-center justify-center">255</div>
                           <div className="h-3 bg-white border border-[#aaa] text-[8px] flex items-center justify-center">0</div>
                           <div className="h-3 bg-white border border-[#aaa] text-[8px] flex items-center justify-center">0</div>
                           <div className="h-3 bg-white border border-[#aaa] text-[8px] flex items-center justify-center">255</div>
                       </div>
                  </div>
               );
          case ComponentType.DMenu:
               return (
                  <div className="w-full h-full bg-white border border-[#ccc] shadow-lg flex flex-col py-1" style={commonStyle}>
                      <div className="px-3 py-1 text-[10px] text-black hover:bg-[#3399ff] hover:text-white cursor-pointer flex justify-between items-center">
                          <span>Option One</span>
                      </div>
                      <div className="px-3 py-1 text-[10px] text-black hover:bg-[#3399ff] hover:text-white cursor-pointer flex justify-between items-center">
                          <span>Option Two</span>
                          <span className="text-[8px] opacity-70">Ctrl+A</span>
                      </div>
                      <div className="h-px bg-[#eee] my-1 mx-1" />
                      <div className="px-3 py-1 text-[10px] text-black hover:bg-[#3399ff] hover:text-white cursor-pointer flex justify-between items-center">
                          <span>Exit</span>
                      </div>
                  </div>
               );
          case ComponentType.DVerticalDivider:
               return (
                   <div className="w-full h-full bg-[#f0f0f0] border-l border-[#fff] border-r border-[#999] flex items-center justify-center cursor-col-resize" style={commonStyle}>
                       <div className="h-4 w-[1px] bg-[#999] mx-[1px]" />
                       <div className="h-4 w-[1px] bg-[#fff] mx-[1px]" />
                   </div>
               );
          case ComponentType.DHorizontalDivider:
               return (
                   <div className="w-full h-full bg-[#f0f0f0] border-t border-[#fff] border-b border-[#999] flex flex-col items-center justify-center cursor-row-resize" style={commonStyle}>
                       <div className="w-4 h-[1px] bg-[#999] my-[1px]" />
                       <div className="w-4 h-[1px] bg-[#fff] my-[1px]" />
                   </div>
               );
          default:
              return (
                  <div className="w-full h-full bg-[#3a3a3a] border border-neutral-500 flex flex-col items-center justify-center shadow-md relative group" style={commonStyle}>
                      <div className="absolute inset-0 bg-neutral-900/10" />
                      <span className="text-[10px] text-neutral-400 font-mono font-bold z-10">{el.type}</span>
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
    const isAutoLayout = parent && ((parent.props.layoutMode && parent.props.layoutMode !== 'none') || parent.type === ComponentType.DIconLayout || parent.type === ComponentType.DCollapsibleCategory);
    const autoBehavior = el.props.autoLayoutBehavior || 'fixed';
    const isTabInSheet = el.type === ComponentType.DTab && parent?.type === ComponentType.DPropertySheet;
    const isListInColumnSheet = parent?.type === ComponentType.DColumnSheet;

    const scale = (isHovered && el.props.hoverScale) ? el.props.hoverScale : 1;
    
    // Visibility and Enabled State
    const isVisible = el.props.visible !== false;
    const isEnabled = el.props.enabled !== false;

    let layoutWidth: string | number = el.props.w;
    let layoutHeight: string | number = el.props.h;
    let flexGrow = 0;
    let flexShrink = 0;
    
    if (isAutoLayout) {
        if (parent?.type === ComponentType.DIconLayout) {
             layoutWidth = el.props.w;
             layoutHeight = el.props.h;
        } else if (parent?.type === ComponentType.DCollapsibleCategory) {
             layoutWidth = '100%';
             layoutHeight = el.props.h;
        } else if (parent?.props.layoutMode === 'vertical') {
            layoutWidth = '100%'; 
            if (autoBehavior === 'fill') { flexGrow = 1; layoutHeight = 'auto'; }
            else if (autoBehavior === 'shrink') { layoutHeight = 'auto'; flexShrink = 1; }
        } else if (parent?.props.layoutMode === 'horizontal') {
            layoutHeight = '100%'; 
            if (autoBehavior === 'fill') { flexGrow = 1; layoutWidth = 'auto'; }
            else if (autoBehavior === 'shrink') { layoutWidth = 'auto'; flexShrink = 1; }
        }
    }

    if (isTabInSheet) {
        layoutWidth = '100%';
        layoutHeight = '100%';
    }

    const finalStyle: React.CSSProperties = {
      position: (isAutoLayout || isTabInSheet || isListInColumnSheet) ? 'relative' : 'absolute',
      left: (isAutoLayout || isTabInSheet || isListInColumnSheet) ? undefined : el.props.x,
      top: (isAutoLayout || isTabInSheet || isListInColumnSheet) ? undefined : el.props.y,
      width: layoutWidth,
      height: layoutHeight,
      zIndex: isSelected ? 10 : 1,
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transition: 'transform 0.1s ease-out, opacity 0.15s ease-out',
      flexGrow: flexGrow,
      flexShrink: flexShrink,
      minWidth: (isAutoLayout && autoBehavior === 'fixed') ? el.props.w : undefined,
      minHeight: (isAutoLayout && autoBehavior === 'fixed') ? el.props.h : undefined,
      // Handle visibility and enabled state visuals
      opacity: isVisible ? (isEnabled ? 1 : 0.6) : 0.2, // Ghosted if hidden, dimmed if disabled
      filter: isEnabled ? 'none' : 'grayscale(0.5)',
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
      if (isAutoLayout || isTabInSheet || isListInColumnSheet) return; 
      
      const startX = e.clientX, startY = e.clientY, startLeft = el.props.x, startTop = el.props.y;

      if (el.type === ComponentType.DFrame) {
         if (el.props.draggable === false) return; 
         const rect = e.currentTarget.getBoundingClientRect();
         // Ensure click is on title bar for DFrame dragging
         if (e.clientY - rect.top > 24) return;
      }

      const handleMouseMove = (mv: MouseEvent) => {
        onUpdateElement(id, { x: snap(startLeft + (mv.clientX - startX) / viewState.zoom), y: snap(startTop + (mv.clientY - startY) / viewState.zoom) });
      };
      const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const containerStyle: React.CSSProperties = {
        position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto',
        display: (el.props.layoutMode && el.props.layoutMode !== 'none') || el.type === ComponentType.DIconLayout ? 'flex' : 'block',
        flexDirection: el.props.layoutMode === 'horizontal' ? 'row' : (el.type === ComponentType.DIconLayout ? 'row' : 'column'),
        flexWrap: el.type === ComponentType.DIconLayout ? 'wrap' : 'nowrap',
        gap: el.type === ComponentType.DIconLayout ? `${el.props.spaceY || 0}px ${el.props.spaceX || 0}px` : (el.props.layoutSpacing ? `${el.props.layoutSpacing}px` : undefined),
        padding: el.props.layoutPadding ? `${el.props.layoutPadding}px` : undefined,
    };
    
    // Special handling for content rendering of complex components
    // We only render children inside the container area
    let childrenContainerClass = `absolute inset-0 pointer-events-none ${el.type === ComponentType.DFrame ? 'top-6' : ''}`;
    
    if (el.type === ComponentType.DPropertySheet) {
        childrenContainerClass = "absolute top-[20px] left-[1px] right-[1px] bottom-[1px] pointer-events-none"; 
        containerStyle.padding = '4px';
    } else if (el.type === ComponentType.DColumnSheet) {
        // For column sheet, children are typically rendered in the right panel or left list. 
        // For simplicity in this editor, we put them in the right panel area
        childrenContainerClass = "absolute top-0 right-0 bottom-0 left-[25%] pointer-events-none p-2";
    }

    const renderLayoutIndicators = () => {
        if (!isSelected) return null;
        if (el.props.layoutMode === 'vertical' || el.props.layoutMode === 'horizontal') {
            const padding = el.props.layoutPadding || 0;
            const spacing = el.props.layoutSpacing || 0;
            return (
                <div className="absolute inset-0 pointer-events-none border-2 border-blue-400/30 border-dashed z-50 rounded-sm overflow-hidden">
                    <div 
                        className="absolute inset-0 border border-blue-400/20 bg-blue-500/5"
                        style={{ margin: padding }}
                    />
                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 font-mono">
                        {el.props.layoutMode === 'vertical' ? <ArrowDown className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        <span className="font-bold">{el.props.layoutMode === 'vertical' ? 'V-Stack' : 'H-Stack'}</span>
                        <span className="opacity-80 ml-1 text-[8px] border-l border-white/30 pl-1">P:{padding} S:{spacing}</span>
                    </div>
                </div>
            )
        }
        return null;
    }

    return (
      <div 
        key={id} style={finalStyle} onMouseDown={handleMouseDown}
        onMouseEnter={() => setHoveredId(id)} onMouseLeave={() => setHoveredId(null)}
        className={`group select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        {renderVGUIContent(el, isSelected)}
        {renderLayoutIndicators()}
        
        {/* State Indicators Overlay */}
        <div className="absolute top-0 right-0 p-1 flex gap-1 pointer-events-none z-20">
             {!isVisible && (
                 <div className="bg-red-500/80 rounded p-0.5" title="Hidden (SetVisible(false))">
                     <EyeOff className="w-3 h-3 text-white" />
                 </div>
             )}
             {!isEnabled && (
                 <div className="bg-neutral-600/80 rounded p-0.5" title="Disabled (SetEnabled(false))">
                     <Lock className="w-3 h-3 text-white" />
                 </div>
             )}
        </div>

        <div className={childrenContainerClass}>
             <div style={containerStyle} className="custom-scrollbar">
                 {el.children.map(childId => renderElement(childId))}
             </div>
        </div>
        {isSelected && renderResizeHandles(el)}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#151515] relative overflow-hidden flex flex-col">
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-neutral-800/80 backdrop-blur border border-neutral-700 rounded-lg p-1 flex flex-col shadow-xl">
                <button onClick={() => onViewChange({...viewState, zoom: Math.min(5, viewState.zoom + 0.1)})} className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => onViewChange({...viewState, zoom: Math.max(0.1, viewState.zoom - 0.1)})} className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => onViewChange({...viewState, showGrid: !viewState.showGrid})} className={`p-2 rounded ${viewState.showGrid ? 'text-blue-400 bg-blue-900/20' : 'text-neutral-400 hover:bg-neutral-700'}`}><GridIcon className="w-4 h-4" /></button>
            </div>
       </div>
        <div 
          ref={containerRef} className="flex-1 relative overflow-hidden"
          onWheel={handleWheel} onMouseDown={startPan}
          style={{ cursor: isPanning ? 'grabbing' : 'default', backgroundImage: viewState.showGrid ? 'radial-gradient(#444 1px, transparent 1px)' : undefined, backgroundSize: `${viewState.gridSize * viewState.zoom}px ${viewState.gridSize * viewState.zoom}px`, backgroundPosition: `${viewState.panX}px ${viewState.panY}px` }}
        >
            <div className="absolute transform-gpu origin-top-left" style={{ transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`, width: '100%', height: '100%' }}>
                {state.rootId ? renderElement(state.rootId) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `scale(${1/viewState.zoom})` }}>
                        <div className="text-center text-neutral-600 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
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