import React, { useState, useEffect, useCallback } from 'react';
import { ComponentType, EditorState, UIElement, ViewState } from './types';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import { generateLuaCode } from './utils/luaGenerator';
import { generateLayoutFromPrompt } from './services/gemini';
import { Copy, Terminal, Undo2, Redo2, Grid, ChevronDown, ChevronUp } from 'lucide-react';

const initialState: EditorState = {
  elements: {},
  rootId: null,
  selectedId: null,
  canvasWidth: 800,
  canvasHeight: 600
};

const initialViewState: ViewState = {
    zoom: 1,
    panX: 0,
    panY: 0,
    gridSize: 10,
    showGrid: true
};

const App: React.FC = () => {
  const [history, setHistory] = useState<EditorState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentState = history[historyIndex];

  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('dermaGenState');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            setHistory([parsed]);
            setHistoryIndex(0);
        } catch (e) {
            console.error("Failed to load state", e);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dermaGenState', JSON.stringify(currentState));
    setGeneratedCode(generateLuaCode(currentState));
  }, [currentState]);

  const pushState = useCallback((newState: EditorState) => {
    setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newState);
        return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  // State modification helpers
  const addComponent = (type: ComponentType) => {
    if (!currentState.rootId && type !== ComponentType.DFrame) {
      alert("You must add a DFrame first.");
      return;
    }
    if (type === ComponentType.DFrame && currentState.rootId) {
      alert("Only one DFrame root allowed.");
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const parentId = currentState.selectedId || currentState.rootId;
    
    // Default sizes for different types
    let w = 100, h = 30;
    if (type === ComponentType.DFrame) { w = 600; h = 400; }
    else if (type === ComponentType.DPanel) { w = 200; h = 200; }
    else if (type === ComponentType.DCheckBox) { w = 100; h = 20; }
    
    const newElement: UIElement = {
      id,
      type,
      parentId: type === ComponentType.DFrame ? null : parentId,
      children: [],
      props: {
        x: type === ComponentType.DFrame ? 100 : 20,
        y: type === ComponentType.DFrame ? 100 : 20,
        w,
        h,
        text: type === ComponentType.DLabel ? 'Label' : type === ComponentType.DButton ? 'Button' : type === ComponentType.DFrame ? 'My Window' : undefined,
        variableName: `${type.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
        color: type === ComponentType.DFrame ? '#333333' : undefined,
        textAlign: 'center'
      }
    };

    const newElements = { ...currentState.elements, [id]: newElement };
    if (newElement.parentId && newElements[newElement.parentId]) {
      newElements[newElement.parentId] = {
        ...newElements[newElement.parentId],
        children: [...newElements[newElement.parentId].children, id]
      };
    }

    pushState({
      ...currentState,
      elements: newElements,
      rootId: type === ComponentType.DFrame ? id : currentState.rootId,
      selectedId: id
    });
  };

  const updateComponent = useCallback((id: string, props: Partial<UIElement['props']>) => {
    if (!currentState.elements[id]) return;
    
    const newState = {
      ...currentState,
      elements: {
        ...currentState.elements,
        [id]: { ...currentState.elements[id], props: { ...currentState.elements[id].props, ...props } }
      }
    };
    
    const newHistory = [...history];
    newHistory[historyIndex] = newState;
    setHistory(newHistory);
  }, [currentState, history, historyIndex]);

  const reparentComponent = useCallback((id: string, newParentId: string | null) => {
    if (!newParentId) return; // Only allowing parenting to existing elements for now
    if (id === newParentId) return; // Cannot parent to self
    
    const el = currentState.elements[id];
    const oldParentId = el.parentId;
    
    if (oldParentId === newParentId) return;

    const newElements = { ...currentState.elements };

    // Remove from old parent
    if (oldParentId && newElements[oldParentId]) {
        newElements[oldParentId] = {
            ...newElements[oldParentId],
            children: newElements[oldParentId].children.filter(cid => cid !== id)
        };
    }

    // Add to new parent
    if (newElements[newParentId]) {
        newElements[newParentId] = {
            ...newElements[newParentId],
            children: [...newElements[newParentId].children, id]
        };
    }

    // Update element parent ref
    newElements[id] = {
        ...newElements[id],
        parentId: newParentId
    };

    pushState({
        ...currentState,
        elements: newElements
    });
  }, [currentState, pushState]);

  const duplicateElement = useCallback(() => {
    if (!currentState.selectedId || !currentState.elements[currentState.selectedId]) return;
    const originalEl = currentState.elements[currentState.selectedId];

    if (originalEl.type === ComponentType.DFrame) {
        alert("Cannot duplicate root frame.");
        return;
    }

    const newElements = { ...currentState.elements };
    
    // Recursive clone
    const clone = (id: string, parentId: string | null): string => {
        const el = currentState.elements[id];
        const newId = Math.random().toString(36).substr(2, 9);
        const newEl = {
            ...el,
            id: newId,
            parentId,
            children: [],
            props: {
                ...el.props,
                x: parentId === el.parentId ? el.props.x + viewState.gridSize : el.props.x,
                y: parentId === el.parentId ? el.props.y + viewState.gridSize : el.props.y,
                variableName: el.props.variableName + '_copy'
            }
        };
        newElements[newId] = newEl;
        if (el.children) {
            newEl.children = el.children.map(cid => clone(cid, newId));
        }
        return newId;
    };

    const newRootId = clone(currentState.selectedId, originalEl.parentId);

    if (originalEl.parentId && newElements[originalEl.parentId]) {
        newElements[originalEl.parentId].children.push(newRootId);
    }

    pushState({
        ...currentState,
        elements: newElements,
        selectedId: newRootId
    });

  }, [currentState, viewState.gridSize, pushState]);

  const selectComponent = useCallback((id: string | null) => {
    const newHistory = [...history];
    newHistory[historyIndex] = { ...currentState, selectedId: id };
    setHistory(newHistory);
  }, [history, historyIndex, currentState]);

  const deleteComponent = (id: string) => {
    const el = currentState.elements[id];
    if (!el) return;
    const toDelete = new Set<string>();
    const collectIds = (currId: string) => {
        toDelete.add(currId);
        currentState.elements[currId].children.forEach(collectIds);
    };
    collectIds(id);

    const newElements = { ...currentState.elements };
    if (el.parentId && newElements[el.parentId]) {
        newElements[el.parentId] = {
            ...newElements[el.parentId],
            children: newElements[el.parentId].children.filter(cid => cid !== id)
        };
    }
    toDelete.forEach(did => delete newElements[did]);

    pushState({
        ...currentState,
        elements: newElements,
        rootId: id === currentState.rootId ? null : currentState.rootId,
        selectedId: null
    });
  };

  const clearCanvas = () => {
    if(confirm("Clear everything?")) pushState(initialState);
  };

  const handleAIGeneration = async (prompt: string) => {
    setIsGeneratingAI(true);
    const layout = await generateLayoutFromPrompt(prompt);
    setIsGeneratingAI(false);
    if (layout && layout.type === ComponentType.DFrame) {
      const elements: Record<string, UIElement> = {};
      let rootId: string | null = null;
      const processNode = (node: any, parentId: string | null) => {
        const id = Math.random().toString(36).substr(2, 9);
        const el: UIElement = {
          id,
          type: node.type as ComponentType,
          parentId,
          children: [],
          props: {
            x: node.x || 0, y: node.y || 0, w: node.w || 100, h: node.h || 30,
            text: node.text, color: node.color,
            variableName: `${node.type.toLowerCase()}_${Math.floor(Math.random() * 1000)}`
          }
        };
        elements[id] = el;
        if (parentId && elements[parentId]) elements[parentId].children.push(id);
        if (!parentId) rootId = id;
        if (node.children) node.children.forEach((child: any) => processNode(child, id));
      };
      processNode(layout, null);
      pushState({ ...initialState, elements, rootId, selectedId: rootId });
    } else {
        alert("Failed to generate UI.");
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            e.shiftKey ? redo() : undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        // Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            duplicateElement();
        }
        // Delete
        if (e.key === 'Delete' && currentState.selectedId) {
            deleteComponent(currentState.selectedId);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, currentState, duplicateElement]);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      <Toolbar onClear={clearCanvas} onGenerateAI={handleAIGeneration} isGenerating={isGeneratingAI} />
      
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between shrink-0">
         <div className="flex items-center space-x-2">
            <button onClick={undo} disabled={historyIndex === 0} className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800" title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-neutral-700 mx-2"></div>
            <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-neutral-500" />
                <span className="text-xs text-neutral-500">Grid Size:</span>
                <input 
                    type="number" 
                    value={viewState.gridSize} 
                    onChange={(e) => setViewState({...viewState, gridSize: Math.max(1, parseInt(e.target.value) || 10)})}
                    className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-xs text-white"
                />
            </div>
         </div>
         <span className="text-xs text-neutral-500">{historyIndex === history.length - 1 ? 'Saved' : 'Unsaved'}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar onAddComponent={addComponent} />
        
        {/* Middle Column: Canvas + Lua Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#151515] relative">
            <Canvas 
                state={currentState} 
                viewState={viewState}
                onSelect={selectComponent}
                onUpdateElement={updateComponent}
                onViewChange={setViewState}
            />
            
            {/* Lua Output Panel */}
            <div className={`border-t border-neutral-800 bg-[#1e1e1e] flex flex-col shrink-0 transition-all duration-300 z-10 ${isOutputCollapsed ? 'h-9' : 'h-64'}`}>
                <div 
                    className="h-9 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-3 cursor-pointer select-none hover:bg-neutral-800/80 transition-colors"
                    onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                >
                    <div className="flex items-center text-neutral-400 gap-2">
                         <div className={`transition-transform duration-300 ${isOutputCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                            <ChevronDown className="w-3.5 h-3.5" />
                         </div>
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">Lua Output</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(generatedCode); }} 
                            className="text-neutral-500 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
                            title="Copy to Clipboard"
                        >
                            <Copy className="w-3.5 h-3.5" /><span className="text-[10px]">Copy</span>
                        </button>
                    </div>
                </div>
                
                <div className={`flex-1 overflow-auto p-3 bg-[#1e1e1e] ${isOutputCollapsed ? 'hidden' : 'block'}`}>
                    <pre className="text-[11px] font-mono text-green-400/90 whitespace-pre-wrap break-all leading-relaxed">{generatedCode}</pre>
                </div>
            </div>
        </div>
        
        {/* Right Column: Properties */}
        <div className="flex flex-col border-l border-neutral-800 w-80 shrink-0 bg-neutral-900">
             <div className="flex-1 flex flex-col min-h-0">
                <PropertiesPanel 
                    selectedElement={currentState.selectedId ? currentState.elements[currentState.selectedId] : null}
                    allElements={currentState.elements}
                    onChange={(id, p) => {
                         if (!currentState.elements[id]) return;
                         pushState({
                           ...currentState,
                           elements: {
                             ...currentState.elements,
                             [id]: { ...currentState.elements[id], props: { ...currentState.elements[id].props, ...p } }
                           }
                         });
                    }}
                    onReparent={reparentComponent}
                    onDelete={deleteComponent}
                />
             </div>
        </div>
      </div>
    </div>
  );
};

export default App;
