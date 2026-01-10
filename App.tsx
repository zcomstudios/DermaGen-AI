import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComponentType, EditorState, UIElement, ViewState } from './types';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import MenuBar from './components/MenuBar';
import MethodsMenu from './components/MethodsMenu';
import LayoutPanel from './components/LayoutPanel';
import { generateLuaCode } from './utils/luaGenerator';
import { parseLuaToState } from './utils/luaParser';
import { generateLayoutFromPrompt } from './services/gemini';
import { Copy, Terminal, Undo2, Redo2, Grid, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';

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
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [isMethodsMenuOpen, setIsMethodsMenuOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>("project.json");
  
  // Layout State for Resizing
  const [layout, setLayout] = useState({
      sidebarWidth: 260,
      propertiesWidth: 320,
      outputHeight: 200
  });

  const draggingRef = useRef<{
      type: 'sidebar' | 'properties' | 'output';
      startVal: number;
      startMouse: number;
  } | null>(null);

  // Hidden inputs for file operations
  const openFileRef = useRef<HTMLInputElement>(null);
  const importLuaRef = useRef<HTMLInputElement>(null);

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

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!draggingRef.current) return;
        e.preventDefault();
        const { type, startVal, startMouse } = draggingRef.current;

        if (type === 'sidebar') {
            const delta = e.clientX - startMouse;
            const newWidth = Math.max(200, Math.min(600, startVal + delta));
            setLayout(prev => ({ ...prev, sidebarWidth: newWidth }));
        } else if (type === 'properties') {
            const delta = startMouse - e.clientX; // Inverted for right panel
            const newWidth = Math.max(250, Math.min(600, startVal + delta));
            setLayout(prev => ({ ...prev, propertiesWidth: newWidth }));
        } else if (type === 'output') {
            const delta = startMouse - e.clientY; // Inverted for bottom panel
            const newHeight = Math.max(100, Math.min(800, startVal + delta));
            setLayout(prev => ({ ...prev, outputHeight: newHeight }));
        }
    };

    const handleMouseUp = () => {
        if (draggingRef.current) {
            draggingRef.current = null;
            document.body.style.cursor = '';
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (type: 'sidebar' | 'properties' | 'output', e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = {
          type,
          startVal: type === 'sidebar' ? layout.sidebarWidth : type === 'properties' ? layout.propertiesWidth : layout.outputHeight,
          startMouse: type === 'output' ? e.clientY : e.clientX
      };
      document.body.style.cursor = type === 'output' ? 'row-resize' : 'col-resize';
  };

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

  // --- FILE OPERATIONS ---

  const handleNew = () => {
    if (confirm("Create new project? Unsaved changes will be lost.")) {
      pushState(initialState);
      setCurrentFileName("project.json");
    }
  };

  const handleOpenClick = () => {
    if (openFileRef.current) openFileRef.current.click();
  };

  const handleFileOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation
        if (json.elements && typeof json.elements === 'object') {
           pushState(json);
           setCurrentFileName(file.name);
        } else {
           alert("Invalid project file format.");
        }
      } catch (err) {
        alert("Failed to parse project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    downloadFile(JSON.stringify(currentState, null, 2), currentFileName, 'application/json');
  };

  const handleSaveAs = () => {
    const name = prompt("Enter filename:", currentFileName);
    if (name) {
      const finalName = name.endsWith('.json') ? name : `${name}.json`;
      setCurrentFileName(finalName);
      downloadFile(JSON.stringify(currentState, null, 2), finalName, 'application/json');
    }
  };

  const handleExport = () => {
    const name = currentFileName.replace('.json', '.lua');
    downloadFile(generatedCode, name, 'text/plain');
  };

  const handleImportClick = () => {
     if (importLuaRef.current) importLuaRef.current.click();
  };

  const handleLuaImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target?.result as string;
      const newState = parseLuaToState(code);
      if (newState) {
          if (confirm("Import successful. This will overwrite current canvas. Proceed?")) {
              pushState(newState);
          }
      } else {
          alert("Could not parse Lua code. Ensure it follows standard vgui.Create patterns.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- STATE MODIFIERS ---

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
    else if (type === ComponentType.DListView) { w = 200; h = 150; }
    
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

  const updateMethods = (id: string, methods: Record<string, string>) => {
      updateComponent(id, { methods });
  };

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
    setGenerationProgress(0);

    // Simulate progress
    const duration = 6000; // estimated duration
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
        currentStep++;
        // Logarithmic-ish progress that slows down as it approaches 95%
        const progress = Math.min(95, Math.round((1 - Math.pow(0.5, currentStep / (steps * 0.4))) * 100));
        setGenerationProgress(progress);
    }, intervalTime);

    try {
        const layout = await generateLayoutFromPrompt(prompt);
        
        clearInterval(timer);
        setGenerationProgress(100);

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
            
            // Small delay to let user see 100% bar
            setTimeout(() => {
                pushState({ ...initialState, elements, rootId, selectedId: rootId });
                setIsGeneratingAI(false);
                setGenerationProgress(0);
            }, 600);
        } else {
            alert("Failed to generate valid UI structure.");
            setIsGeneratingAI(false);
            setGenerationProgress(0);
        }
    } catch (e) {
        clearInterval(timer);
        alert("Failed to generate UI.");
        setIsGeneratingAI(false);
        setGenerationProgress(0);
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
        // Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
        // Open
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            handleOpenClick();
        }
        // Delete
        if (e.key === 'Delete' && currentState.selectedId) {
            deleteComponent(currentState.selectedId);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, currentState, duplicateElement, handleSave, handleOpenClick]);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      <MenuBar 
        onNew={handleNew}
        onOpen={handleOpenClick}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onImport={handleImportClick}
        onExport={handleExport}
        onUndo={undo}
        onRedo={redo}
        onDelete={() => currentState.selectedId && deleteComponent(currentState.selectedId)}
        onDuplicate={duplicateElement}
        onToggleLayout={() => setIsLayoutOpen(!isLayoutOpen)}
        isLayoutOpen={isLayoutOpen}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasSelection={!!currentState.selectedId}
      />

      <input 
        type="file" 
        accept=".json" 
        ref={openFileRef} 
        onChange={handleFileOpen} 
        className="hidden" 
      />
      <input 
        type="file" 
        accept=".lua,.txt" 
        ref={importLuaRef} 
        onChange={handleLuaImport} 
        className="hidden" 
      />

      <Toolbar 
        onClear={clearCanvas} 
        onGenerateAI={handleAIGeneration} 
        isGenerating={isGeneratingAI} 
        progress={generationProgress}
      />
      
      {/* Secondary Toolbar (History, Grid, Methods) */}
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
            
            <div className="w-px h-4 bg-neutral-700 mx-2"></div>
            
            <button 
                onClick={() => setIsMethodsMenuOpen(true)}
                disabled={!currentState.selectedId}
                className="flex items-center gap-2 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ScrollText className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Methods</span>
            </button>
         </div>
         <span className="text-xs text-neutral-500">{currentFileName} {historyIndex === history.length - 1 ? '(Saved)' : '(Modified)'}</span>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: layout.sidebarWidth }} className="shrink-0 flex flex-col border-r border-neutral-800">
             <Sidebar onAddComponent={addComponent} />
        </div>

        {/* Sidebar Resizer */}
        <div 
            className="w-1 bg-neutral-900 hover:bg-blue-600 cursor-col-resize transition-colors z-20 flex-shrink-0"
            onMouseDown={(e) => startResizing('sidebar', e)}
        />
        
        {/* Middle Column: Canvas + Lua Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#151515] relative">
            <Canvas 
                state={currentState} 
                viewState={viewState}
                onSelect={selectComponent}
                onUpdateElement={updateComponent}
                onViewChange={setViewState}
                onDeleteElement={deleteComponent}
            />
            
            {/* Output Panel Resizer */}
            {!isOutputCollapsed && (
                <div 
                    className="h-1 bg-neutral-900 hover:bg-blue-600 cursor-row-resize transition-colors z-20 shrink-0"
                    onMouseDown={(e) => startResizing('output', e)}
                />
            )}

            {/* Lua Output Panel */}
            <div 
                className={`border-t border-neutral-800 bg-[#1e1e1e] flex flex-col shrink-0 transition-all duration-300 z-10`}
                style={{ height: isOutputCollapsed ? '36px' : layout.outputHeight }}
            >
                <div 
                    className="h-9 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-3 cursor-pointer select-none hover:bg-neutral-800/80 transition-colors shrink-0"
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

            {/* Floating Layout Panel */}
            <LayoutPanel 
                elements={currentState.elements} 
                rootId={currentState.rootId} 
                selectedId={currentState.selectedId} 
                onSelect={selectComponent}
                isOpen={isLayoutOpen}
                onClose={() => setIsLayoutOpen(false)}
            />
        </div>
        
        {/* Properties Resizer */}
        <div 
            className="w-1 bg-neutral-900 hover:bg-blue-600 cursor-col-resize transition-colors z-20 flex-shrink-0"
            onMouseDown={(e) => startResizing('properties', e)}
        />

        {/* Right Column: Properties */}
        <div style={{ width: layout.propertiesWidth }} className="flex flex-col border-l border-neutral-800 shrink-0 bg-neutral-900 overflow-hidden">
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

      {currentState.selectedId && currentState.elements[currentState.selectedId] && (
          <MethodsMenu 
            element={currentState.elements[currentState.selectedId]}
            isOpen={isMethodsMenuOpen}
            onClose={() => setIsMethodsMenuOpen(false)}
            onSave={updateMethods}
          />
      )}
    </div>
  );
};

export default App;