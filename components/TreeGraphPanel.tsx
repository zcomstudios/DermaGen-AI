import React, { useState, useCallback, useMemo } from 'react';
import { UIElement, ComponentType } from '../types';
import {
  ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown,
  Lock as LockIcon, Network, Trash2,
  // Element type icons (covers the most common ones; the rest fall back to Box)
  LayoutTemplate, Square, MousePointer2, Type, SquareAsterisk, CheckSquare,
  List, Table, Image as ImageIcon, Layers, Folder, FormInput, Cuboid, Box,
  BarChart2, SlidersHorizontal, Sliders, ImageDown, BoxSelect,
  FileText, Keyboard, Hash, Rows3, Palette, Pipette, Grid3x3,
  X as XIcon, Globe, Menu as MenuIcon, MenuSquare, LayoutGrid,
} from 'lucide-react';

interface TreeGraphPanelProps {
  elements: Record<string, UIElement>;
  rootId: string | null;
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onToggleSelection: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Map every ComponentType to a lucide icon. Keeps the tree visually consistent
// with the Sidebar palette so users can recognize element types at a glance.
const ICON_FOR_TYPE: Partial<Record<ComponentType, React.ComponentType<{ className?: string }>>> = {
  [ComponentType.DFrame]: LayoutTemplate,
  [ComponentType.DPanel]: Square,
  [ComponentType.DScrollPanel]: Square,
  [ComponentType.DButton]: MousePointer2,
  [ComponentType.DLabel]: Type,
  [ComponentType.DTextEntry]: SquareAsterisk,
  [ComponentType.DCheckBox]: CheckSquare,
  [ComponentType.DComboBox]: ChevronDown,
  [ComponentType.DListView]: List,
  [ComponentType.DGrid]: Table,
  [ComponentType.DImage]: ImageIcon,
  [ComponentType.DPropertySheet]: Layers,
  [ComponentType.DColumnSheet]: Layers,
  [ComponentType.DTab]: Folder,
  [ComponentType.DForm]: FormInput,
  [ComponentType.DModelPanel]: Cuboid,
  [ComponentType.DBevel]: BoxSelect,
  [ComponentType.DProgress]: BarChart2,
  [ComponentType.DSlider]: SlidersHorizontal,
  [ComponentType.DNumSlider]: Sliders,
  [ComponentType.DImageButton]: ImageDown,
  [ComponentType.DCollapsibleCategory]: ChevronsUpDown,
  [ComponentType.DRichText]: FileText,
  [ComponentType.DBinder]: Keyboard,
  [ComponentType.DNumberWang]: Hash,
  [ComponentType.DVerticalDivider]: Rows3,
  [ComponentType.DColorMixer]: Palette,
  [ComponentType.DColorCube]: Pipette,
  [ComponentType.DColorPalette]: Grid3x3,
  [ComponentType.DSysButton]: XIcon,
  [ComponentType.DHTML]: Globe,
  [ComponentType.DTree]: Network,
  [ComponentType.DMenu]: MenuIcon,
  [ComponentType.DMenuBar]: MenuSquare,
  [ComponentType.DIconLayout]: LayoutGrid,
};

const TreeGraphPanel: React.FC<TreeGraphPanelProps> = ({
  elements, rootId, selectedId, selectedIds,
  onSelect, onToggleSelection, onDelete,
}) => {
  // Set of element ids whose children are HIDDEN. Default behavior: nothing in
  // the set means everything is expanded. We track collapsed-ness (rather than
  // expanded-ness) so newly-added nodes default to expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const elementCount = useMemo(() => Object.keys(elements).length, [elements]);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  const collapseAll = useCallback(() => {
    // Collapse every node that has children (so the tree shows just the roots).
    const next = new Set<string>();
    for (const el of Object.values(elements) as UIElement[]) {
      if (el.children.length > 0) next.add(el.id);
    }
    setCollapsed(next);
  }, [elements]);

  const handleNodeClick = useCallback((id: string, e: React.MouseEvent) => {
    // Match the Canvas's selection rules: Ctrl/Cmd toggles, plain click replaces.
    if (e.ctrlKey || e.metaKey) onToggleSelection(id);
    else onSelect(id);
  }, [onSelect, onToggleSelection]);

  // Recursive node renderer. Returns a flat sequence of <div>s (depth controls
  // the left indent). We render children inline below the parent node so the
  // collapsed map controls visibility without unmounting the children.
  const renderNode = (id: string, depth: number): React.ReactNode => {
    const el = elements[id];
    if (!el) return null;

    const isExpanded = !collapsed.has(id);
    const hasChildren = el.children.length > 0;
    const isPrimary = selectedId === id;
    const isMulti = selectedIds.includes(id) && !isPrimary;
    const Icon = ICON_FOR_TYPE[el.type] || Box;

    let bgClass = 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200';
    if (isPrimary)      bgClass = 'bg-blue-600/30 border-blue-500 text-white';
    else if (isMulti)   bgClass = 'bg-blue-600/10 border-blue-400/60 text-white/90';

    return (
      <React.Fragment key={id}>
        <div
          className={`group flex items-center gap-0.5 py-0.5 cursor-pointer border-l-2 select-none ${bgClass}`}
          style={{ paddingLeft: depth * 14 + 4 }}
          onClick={(e) => handleNodeClick(id, e)}
          title={`${el.props.variableName} (${el.type})`}
        >
          {/* Expand/collapse caret — invisible if no children, but takes up the same space */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleCollapsed(id); }}
            className={`p-0.5 rounded hover:bg-white/10 shrink-0 ${!hasChildren ? 'invisible' : ''}`}
            tabIndex={-1}
          >
            {isExpanded
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />}
          </button>

          <Icon className={`w-3.5 h-3.5 shrink-0 ${isPrimary ? 'text-blue-300' : 'opacity-70'}`} />

          <span className="text-[11px] truncate font-mono ml-1 flex-1">
            {el.props.variableName}
          </span>

          {el.props.locked && (
            <LockIcon className="w-3 h-3 text-red-400 shrink-0" />
          )}

          <span className="opacity-30 text-[9px] mr-1 shrink-0 font-mono">{el.type}</span>

          {/* Quick-delete (visible on row hover; root frame can be deleted too via this) */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(id); }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 mr-1 shrink-0"
              title="Delete element"
              tabIndex={-1}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {isExpanded && hasChildren && el.children.map(cid => renderNode(cid, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="w-60 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Network className="w-4 h-4 text-neutral-500 shrink-0" />
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">Tree Graph</h2>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Expand all"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Collapse all"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
        {rootId
          ? renderNode(rootId, 0)
          : (
            <div className="p-4 text-center text-neutral-500 text-[11px] italic">
              No elements yet — add a DFrame from the Components palette to get started.
            </div>
          )}
      </div>

      {/* Footer — element count + multi-selection status */}
      <div className="px-3 py-1.5 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-[10px] text-neutral-500 shrink-0">
        <span>{elementCount} element{elementCount === 1 ? '' : 's'}</span>
        {selectedIds.length > 1 && (
          <span className="text-blue-400 font-medium">{selectedIds.length} selected</span>
        )}
      </div>
    </div>
  );
};

export default TreeGraphPanel;
