import React, { useRef, useState, useEffect } from 'react';
import { EditorState, UIElement, ComponentType, ViewState } from '../types';
import { ZoomIn, ZoomOut, Grid as GridIcon, ImageOff } from 'lucide-react';

interface CanvasProps {
  state: EditorState;
  viewState: ViewState;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<UIElement['props']>) => void;
  onViewChange: (newView: ViewState) => void;
}

const Canvas: React.FC<CanvasProps> = ({ state, viewState, onSelect, onUpdateElement, onViewChange }) => {
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
      
      const commonStyle: React.CSSProperties = {
          backgroundColor: bgColor,
          borderColor: el.props.borderColor || 'transparent',
          borderWidth: el.props.borderWidth ? `${el.props.borderWidth}px` : '0px',
          borderStyle: (el.props.borderWidth && el.props.borderWidth > 0) ? 'solid' : 'none',
          borderRadius: el.props.borderRadius ? `${el.props.borderRadius}px` : '0px',
          justifyContent: el.props.textAlign === 'center' ? 'center' : el.props.textAlign === 'right' ? 'flex-end' : 'flex-start',
          opacity: el.props.opacity !== undefined ? el.props.opacity / 255 : 1,
          fontFamily: el.props.fontFamily || 'Arial, sans-serif',
          fontSize: el.props.fontSize ? `${el.props.fontSize}px` : undefined,
          fontWeight: el.props.fontWeight,
      };

      const titleBarStyle: React.CSSProperties = {
          fontFamily: el.props.fontFamily || 'Arial, sans-serif',
          fontSize: el.props.fontSize ? `${el.props.fontSize}px` : undefined,
          fontWeight: el.props.fontWeight,
      };

      switch (el.type) {
          case ComponentType.DFrame:
              return (
                  <div 
                      className="flex flex-col h-full w-full bg-[#323232] rounded-t-sm shadow-xl border border-black/50"
                      style={{ ...commonStyle, backgroundColor: bgColor || '#323232' }}
                  >
                      <div className="h-6 bg-[#2a2a2a] flex items-center px-2 border-b border-black/40 shrink-0">
                          <span className={`${baseText} text-white/90 font-bold`} style={titleBarStyle}>{el.props.text || 'DFrame'}</span>
                          <div className="ml-auto flex gap-1 opacity-60">
                              <div className="w-3 h-3 bg-white/10 rounded-sm hover:bg-white/20"></div>
                              <div className="w-3 h-3 bg-white/10 rounded-sm hover:bg-red-500/80"></div>
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
               return (
                  <div className="w-full h-full flex items-center" style={{ ...commonStyle, backgroundColor: 'transparent', border: 'none' }}>
                       <span className={`${baseText} text-white`} style={commonStyle}>{el.props.text || 'Label'}</span>
                  </div>
               );
               
          case ComponentType.DImage:
              return (
                  <div className="w-full h-full overflow-hidden" style={commonStyle}>
                      {el.props.imageUrl ? (
                          <img src={el.props.imageUrl} alt="DImage" className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-600 border border-dashed border-neutral-700">
                             <ImageOff className="w-6 h-6 mb-1 opacity-50" />
                             <span className="text-[9px]">No Image</span>
                          </div>
                      )}
                  </div>
              );

          case ComponentType.DPanel:
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
    
    // Apply Scale Transform if Hovered
    const scale = (isHovered && el.props.hoverScale) ? el.props.hoverScale : 1;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: el.props.x,
      top: el.props.y,
      width: el.props.w,
      height: el.props.h,
      zIndex: isSelected ? 10 : 1,
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transition: 'transform 0.1s ease-out',
      transformOrigin: 'center center'
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
      
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

    return (
      <div 
        key={id}
        style={style}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHoveredId(id)}
        onMouseLeave={() => setHoveredId(null)}
        title={el.props.tooltip} // Native Tooltip
        className={`group select-none ${isSelected ? 'outline outline-2 outline-blue-500' : ''}`}
      >
        {renderVGUIContent(el, isSelected)}
        
        <div className={`absolute inset-0 pointer-events-none ${el.type === ComponentType.DFrame ? 'top-6' : ''}`}>
             <div className="relative w-full h-full pointer-events-auto">
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
