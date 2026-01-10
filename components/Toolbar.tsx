import React, { useState } from 'react';
import { Wand2, Code, Trash2, Download } from 'lucide-react';

interface ToolbarProps {
  onClear: () => void;
  onGenerateAI: (prompt: string) => void;
  isGenerating: boolean;
  progress: number;
}

const Toolbar: React.FC<ToolbarProps> = ({ onClear, onGenerateAI, isGenerating, progress }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerateAI(prompt);
    }
  };

  return (
    <div className="h-16 border-b border-neutral-800 bg-neutral-900 flex items-center px-4 justify-between shrink-0 z-20 relative">
      <div className="flex items-center space-x-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Code className="text-white w-5 h-5" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-white">DermaGen <span className="text-blue-400">AI</span></h1>
      </div>

      <div className="flex items-center space-x-4 flex-1 max-w-2xl mx-8">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'text-blue-400 animate-pulse' : 'text-neutral-500'}`} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-neutral-700 rounded-lg leading-5 bg-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:bg-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
            placeholder="Describe a UI (e.g., 'A dark login panel with username, password and a red login button')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={isGenerating}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Dreaming...' : 'Generate'}
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onClear}
          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
          title="Clear Canvas"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {isGenerating && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toolbar;