import React from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="h-12 border-b border-neutral-700 bg-neutral-800 flex items-center justify-between px-6 sticky top-0">
          <h2 className="font-bold text-lg text-white">About DermaGen AI</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 relative overflow-hidden">
          {/* Background Logo - Semi-transparent */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <img
              src="/logo_dermagen.png"
              alt="Background Logo"
              className="w-96 h-96 object-contain"
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10">
            {/* Title and Logo */}
            <div className="flex items-center gap-6 mb-8">
              <img
                src="/logo_dermagen.png"
                alt="DermaGen Logo"
                className="w-24 h-24 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  DermaGen <span className="text-blue-400">AI</span>
                </h1>
                <p className="text-neutral-400 text-sm">Visual UI Editor for Garry's Mod Derma</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6 text-neutral-300 text-sm leading-relaxed">
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
                <p>
                  DermaGen AI is a comprehensive visual editor designed for creating and managing
                  Garry's Mod Derma UI elements. It combines an intuitive drag-and-drop canvas with
                  AI-powered generation capabilities, allowing developers to rapidly prototype and
                  build complex UI layouts without manually writing Lua code.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span><strong>Visual Canvas Editor:</strong> Drag-and-drop interface for building UI hierarchies</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span><strong>Component Library:</strong> Support for 30+ Derma component types</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span><strong>AI Generation:</strong> Powered by Google Gemini for intelligent UI generation from natural language</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span><strong>Live Code Export:</strong> Real-time Lua code generation as you design</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span><strong>Import/Export:</strong> Load existing Lua code or save projects as JSON</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span><strong>Full Undo/Redo:</strong> Complete history tracking for all canvas operations</span>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Technology Stack</h3>
                <p>
                  Built with React + TypeScript for a responsive, type-safe development experience.
                  Uses Tailwind CSS for styling and Vite for optimal build performance.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Getting Started</h3>
                <p className="mb-3">
                  Create a new DFrame to start building your UI, add components from the sidebar, and
                  customize their properties in the right panel. Use the AI prompt to rapidly generate
                  layouts, or manually craft your designs with precision controls.
                </p>
              </section>

              <section className="pt-4 border-t border-neutral-700">
                <p className="text-neutral-500 text-xs">
                  Version 1.0 • Built for Garry's Mod • Open Source Project
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
