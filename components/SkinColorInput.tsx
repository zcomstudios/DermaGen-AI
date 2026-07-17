import React from 'react';
import { RotateCcw, Circle } from 'lucide-react';
import { SkinColor } from '../utils/skinTypes';
import { skinColorToHex, hexToSkinColor, skinColorToRgba } from '../utils/skinConstants';

interface SkinColorInputProps {
  label: string;
  /** Current effective value (override if present, else Default baseline). */
  value: SkinColor;
  /** True when the skin overrides this field (enables reset, bolds the label). */
  isOverridden: boolean;
  /** Marks a field that re-themes the canvas live (preview-driving). */
  live?: boolean;
  onChange: (c: SkinColor) => void;
  /** Remove the override (reset to Default baseline). */
  onReset: () => void;
}

const chan =
  'w-full bg-neutral-800 rounded border border-neutral-700 text-center text-[10px] py-0.5';

/**
 * ColorInput extended with an ALPHA channel (0–255), a per-field reset button,
 * and an "overridden vs default" indicator. Mirrors PropertiesPanel's ColorInput
 * idiom but works on SkinColor (RGBA) instead of hex strings.
 */
const SkinColorInput: React.FC<SkinColorInputProps> = ({
  label, value, isOverridden, live, onChange, onReset,
}) => {
  const hex = skinColorToHex(value);

  const setChannel = (c: 'r' | 'g' | 'b' | 'a', raw: number) => {
    const n = Math.min(255, Math.max(0, isNaN(raw) ? 0 : raw));
    onChange({ ...value, [c]: n });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={`text-[10px] flex items-center gap-1 ${isOverridden ? 'text-white font-semibold' : 'text-neutral-400'}`}>
          {live && (
            <span title="Live preview — re-themes the canvas">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
            </span>
          )}
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-neutral-500">
            {value.r},{value.g},{value.b}{value.a !== 255 ? `,${value.a}` : ''}
          </span>
          <button
            onClick={onReset}
            disabled={!isOverridden}
            title={isOverridden ? 'Reset to default' : 'Default value'}
            className={`p-0.5 rounded ${isOverridden ? 'text-neutral-400 hover:text-white hover:bg-neutral-700' : 'text-neutral-700 cursor-default'}`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <div
          className="w-8 h-8 rounded border border-neutral-700 overflow-hidden relative cursor-pointer shrink-0"
          style={{
            // Alpha-aware swatch: checkerboard behind the rgba fill.
            backgroundImage:
              'linear-gradient(45deg,#555 25%,transparent 25%,transparent 75%,#555 75%),linear-gradient(45deg,#555 25%,transparent 25%,transparent 75%,#555 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0,4px 4px',
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: skinColorToRgba(value) }} />
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              const c = hexToSkinColor(e.target.value, value.a);
              onChange(c);
            }}
            className="absolute inset-[-4px] w-[150%] h-[150%] p-0 border-0 cursor-pointer opacity-0"
          />
        </div>
        <div className="grid grid-cols-4 gap-1 flex-1">
          <input type="number" value={value.r} onChange={(e) => setChannel('r', parseInt(e.target.value))} className={`${chan} text-red-300`} title="Red" />
          <input type="number" value={value.g} onChange={(e) => setChannel('g', parseInt(e.target.value))} className={`${chan} text-green-300`} title="Green" />
          <input type="number" value={value.b} onChange={(e) => setChannel('b', parseInt(e.target.value))} className={`${chan} text-blue-300`} title="Blue" />
          <input type="number" value={value.a} onChange={(e) => setChannel('a', parseInt(e.target.value))} className={`${chan} text-neutral-300`} title="Alpha" />
        </div>
      </div>
    </div>
  );
};

export default SkinColorInput;
