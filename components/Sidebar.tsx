import React, { useState, useMemo } from 'react';
import { ComponentType } from '../types';
import { LayoutTemplate, Square, Type, MousePointer2, CheckSquare, SquareAsterisk, Box, Search, List, Table, Image as ImageIcon, Layers, ChevronDown, Folder, FormInput, Cuboid } from 'lucide-react';

interface SidebarProps {
  onAddComponent: (type: ComponentType) => void;
}

// Descriptions for tooltips
const COMPONENT_INFO: Partial<Record<ComponentType, { desc: string, icon: any }>> = {
  [ComponentType.DFrame]: { desc: "The main window container with title bar.", icon: LayoutTemplate },
  [ComponentType.DPanel]: { desc: "A generic container for organizing other elements.", icon: Square },
  [ComponentType.DButton]: { desc: "A clickable button that triggers an action.", icon: MousePointer2 },
  [ComponentType.DLabel]: { desc: "Displays static text.", icon: Type },
  [ComponentType.DTextEntry]: { desc: "A text input field for users.", icon: SquareAsterisk },
  [ComponentType.DCheckBox]: { desc: "A boolean toggle box.", icon: CheckSquare },
  [ComponentType.DComboBox]: { desc: "A dropdown menu for selecting one option.", icon: ChevronDown },
  [ComponentType.DListView]: { desc: "A multi-column list of items.", icon: List },
  [ComponentType.DGrid]: { desc: "Arranges items in a grid layout.", icon: Table },
  [ComponentType.DImage]: { desc: "Displays an image or material.", icon: ImageIcon },
  [ComponentType.DPropertySheet]: { desc: "A tabbed container for switching views.", icon: Layers },
  [ComponentType.DTab]: { desc: "A tab page for a PropertySheet.", icon: Folder },
  [ComponentType.DForm]: { desc: "A container form for inputs.", icon: FormInput },
  [ComponentType.DModelPanel]: { desc: "Displays a 3D model.", icon: Cuboid },
};

const Sidebar: React.FC<SidebarProps> = ({ onAddComponent }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComponents = useMemo(() => {
    return Object.values(ComponentType).filter(type => 
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 overflow-hidden z-10">
      <div className="p-4 border-b border-neutral-800 bg-neutral-900">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Components</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search VGUI..." 
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredComponents.map((type) => {
          const info = COMPONENT_INFO[type];
          const Icon = info?.icon || Box;
          const description = info?.desc || `Insert a ${type} element.`;

          return (
            <button
              key={type}
              onClick={() => onAddComponent(type)}
              className="w-full flex items-center p-2 rounded-md hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition-all group text-left relative"
              title={`${type}: ${description}`}
            >
              <div className="p-1.5 bg-neutral-800 rounded mr-3 group-hover:bg-neutral-700 text-neutral-400 group-hover:text-blue-400 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-neutral-300 group-hover:text-white truncate">
                    {type}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate">
                      {description}
                  </span>
              </div>
            </button>
          );
        })}
        
        {filteredComponents.length === 0 && (
           <div className="p-4 text-center text-neutral-500 text-sm">
             No components found.
           </div>
        )}
      </div>
      
      <div className="p-3 border-t border-neutral-800 bg-neutral-900">
        <div className="px-3 py-2 bg-neutral-800/50 rounded border border-neutral-800 text-[10px] text-neutral-500 text-center">
          Click component to add. <br/>Hover for details.
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
