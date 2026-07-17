import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Copy, Trash2, Check, Palette, Type as TypeIcon, MousePointer,
  TextCursorInput, LayoutTemplate, Sliders, List, FolderTree, Menu as MenuIcon,
  Info, Square, RotateCcw, Eye, EyeOff, Download, FileCode, Upload, AlertTriangle,
} from 'lucide-react';
import { generateSkinLua, sanitizeLuaSkinName } from '../utils/skinLuaGenerator';
import { parseSkinLua } from '../utils/skinLuaParser';
import { SkinColor, SkinScalarColorKey, SkinDef } from '../utils/skinTypes';
import {
  DEFAULT_SKIN_SCALARS, DEFAULT_SKIN_COLOURS,
} from '../utils/skinConstants';
import {
  useSkins, createSkin, updateSkin, deleteSkin, duplicateSkin,
  getActiveSkinId, setActiveSkinId, useActiveSkin,
} from '../utils/skinRegistry';
import { DERMA_FONT_NAMES } from '../utils/dermaFonts';
import SkinColorInput from './SkinColorInput';

// --- field descriptors -----------------------------------------------------

type ScalarField = { kind: 'scalar'; key: SkinScalarColorKey; label: string; live?: boolean };
type ColourField = { kind: 'colour'; path: string[]; label: string; live?: boolean };
type Field = ScalarField | ColourField;
type Group = { title: string; icon: any; fields: Field[] };

const s = (key: SkinScalarColorKey, label: string, live?: boolean): ScalarField => ({ kind: 'scalar', key, label, live });
const cl = (path: string[], label: string, live?: boolean): ColourField => ({ kind: 'colour', path, label, live });

const GROUPS: Group[] = [
  {
    title: 'Backgrounds', icon: Palette, fields: [
      s('bg_color', 'Frame body (bg_color)', true),
      s('bg_color_bright', 'Panel / form body (bg_color_bright)', true),
      s('bg_color_dark', 'Bevel / dark (bg_color_dark)', true),
      s('bg_color_sleep', 'Sleep bg (bg_color_sleep)'),
      s('frame_border', 'Frame border'),
      s('bg_alt1', 'Alt background 1'),
      s('bg_alt2', 'Alt background 2'),
      s('panel_transback', 'Transparent back (a=50)'),
      s('tooltip', 'Tooltip bg'),
    ],
  },
  {
    title: 'Text', icon: TypeIcon, fields: [
      s('text_bright', 'Text bright'),
      s('text_normal', 'Label text (text_normal)', true),
      s('text_dark', 'Text dark'),
      s('text_highlight', 'Text highlight'),
    ],
  },
  {
    title: 'Buttons', icon: MousePointer, fields: [
      cl(['Button', 'Normal'], 'Button normal', true),
      cl(['Button', 'Hover'], 'Button hover', true),
      cl(['Button', 'Down'], 'Button pressed'),
      cl(['Button', 'Disabled'], 'Button disabled', true),
      s('colButtonText', 'Button text', true),
      s('colButtonTextDisabled', 'Button text disabled'),
      s('colButtonBorder', 'Button border'),
      s('colButtonBorderHighlight', 'Button border highlight'),
      s('colButtonBorderShadow', 'Button border shadow'),
    ],
  },
  {
    title: 'Text Entries', icon: TextCursorInput, fields: [
      s('colTextEntryBG', 'Entry background', true),
      s('colTextEntryText', 'Entry text', true),
      s('colTextEntryTextPlaceholder', 'Entry placeholder', true),
      s('colTextEntryBorder', 'Entry border'),
      s('colTextEntryTextHighlight', 'Entry text highlight'),
      s('colTextEntryTextCursor', 'Entry text cursor'),
    ],
  },
  {
    title: 'Windows / Frame', icon: LayoutTemplate, fields: [
      cl(['Window', 'TitleActive'], 'Frame title (active)', true),
      cl(['Window', 'TitleInactive'], 'Frame title (inactive)'),
    ],
  },
  {
    title: 'Controls', icon: Sliders, fields: [
      s('control_color', 'Control color'),
      s('control_color_highlight', 'Control highlight'),
      s('control_color_active', 'Control active'),
      s('control_color_bright', 'Control bright'),
      s('control_color_dark', 'Control dark'),
    ],
  },
  {
    title: 'ListView / ComboBox', icon: List, fields: [
      s('listview_hover', 'ListView hover', true),
      s('listview_selected', 'ListView selected', true),
      s('combobox_selected', 'ComboBox selected'),
    ],
  },
  {
    title: 'Tabs / Property Sheet', icon: LayoutTemplate, fields: [
      s('colTab', 'Tab'),
      s('colTabInactive', 'Tab inactive'),
      s('colTabText', 'Tab text'),
      s('colTabTextInactive', 'Tab text inactive'),
      s('colTabShadow', 'Tab shadow (a=170)'),
      s('colPropertySheet', 'Property sheet'),
      cl(['Tab', 'Active', 'Normal'], 'Active tab normal'),
      cl(['Tab', 'Active', 'Hover'], 'Active tab hover'),
      cl(['Tab', 'Active', 'Down'], 'Active tab down'),
      cl(['Tab', 'Active', 'Disabled'], 'Active tab disabled'),
      cl(['Tab', 'Inactive', 'Normal'], 'Inactive tab normal'),
      cl(['Tab', 'Inactive', 'Hover'], 'Inactive tab hover'),
      cl(['Tab', 'Inactive', 'Down'], 'Inactive tab down'),
      cl(['Tab', 'Inactive', 'Disabled'], 'Inactive tab disabled'),
    ],
  },
  {
    title: 'Menus', icon: MenuIcon, fields: [
      s('colMenuBG', 'Menu background (a=200)'),
      s('colMenuBorder', 'Menu border (a=200)'),
    ],
  },
  {
    title: 'Category', icon: FolderTree, fields: [
      s('colCollapsibleCategory', 'Collapsible category (a=20)'),
      s('colCategoryText', 'Category text'),
      s('colCategoryTextInactive', 'Category text inactive'),
      cl(['Category', 'Header'], 'Category header'),
      cl(['Category', 'Header_Closed'], 'Category header (closed)'),
    ],
  },
  {
    title: 'Tree', icon: FolderTree, fields: [
      cl(['Tree', 'Lines'], 'Tree lines'),
      cl(['Tree', 'Normal'], 'Tree normal'),
      cl(['Tree', 'Hover'], 'Tree hover'),
      cl(['Tree', 'Selected'], 'Tree selected'),
    ],
  },
  {
    title: 'Labels (Colours)', icon: TypeIcon, fields: [
      cl(['Label', 'Default'], 'Label default'),
      cl(['Label', 'Bright'], 'Label bright'),
      cl(['Label', 'Dark'], 'Label dark'),
      cl(['Label', 'Highlight'], 'Label highlight'),
    ],
  },
  {
    title: 'Numbers / Misc', icon: Sliders, fields: [
      s('colNumberWangBG', 'NumberWang background'),
      s('colNumSliderNotch', 'NumSlider notch (a=100)'),
    ],
  },
  {
    title: 'Tooltip', icon: Info, fields: [
      cl(['TooltipText'], 'Tooltip text'),
    ],
  },
];

// --- nested path helpers ---------------------------------------------------

const getAtPath = (obj: any, path: string[]): any =>
  path.reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Count SkinColor leaves in a nested colours tree (for import summaries). */
const countColourLeaves = (node: any): number => {
  if (!node || typeof node !== 'object') return 0;
  if ('r' in node && 'g' in node && 'b' in node) return 1;
  return Object.keys(node).reduce((n, k) => n + countColourLeaves(node[k]), 0);
};

/** Immutably set (value) or delete (null) a leaf on a nested plain-object tree. */
const setAtPath = (root: any, path: string[], value: SkinColor | null): any => {
  const copy = root ? JSON.parse(JSON.stringify(root)) : {};
  let node = copy;
  for (let i = 0; i < path.length - 1; i++) {
    node[path[i]] = node[path[i]] ? { ...node[path[i]] } : {};
    node = node[path[i]];
  }
  const last = path[path.length - 1];
  if (value === null) delete node[last];
  else node[last] = value;
  return copy;
};

const fieldValue = (def: SkinDef, f: Field): { value: SkinColor; overridden: boolean } => {
  if (f.kind === 'scalar') {
    const ov = def.scalars[f.key];
    return { value: ov ?? DEFAULT_SKIN_SCALARS[f.key], overridden: !!ov };
  }
  const ov = getAtPath(def.colours, f.path) as SkinColor | undefined;
  return { value: ov ?? (getAtPath(DEFAULT_SKIN_COLOURS, f.path) as SkinColor), overridden: !!ov };
};

// --- small UI bits ---------------------------------------------------------

const Section: React.FC<{ title: string; icon: any; onResetSection?: () => void; children?: React.ReactNode }> = ({ title, icon: Icon, onResetSection, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-neutral-800">
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800/30">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-neutral-400 hover:text-white">
          <Icon className="w-3.5 h-3.5" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider">{title}</h3>
          <span className="text-[9px] text-neutral-600">{open ? '▾' : '▸'}</span>
        </button>
        {onResetSection && (
          <button onClick={onResetSection} title="Reset this section" className="text-neutral-600 hover:text-white p-0.5">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

const TextRow: React.FC<{ label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string; mono?: boolean }> = ({ label, value, onChange, onBlur, placeholder, mono }) => (
  <div>
    <label className="block text-[10px] text-neutral-400 mb-1">{label}</label>
    <input
      type="text" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
      className={`w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none ${mono ? 'font-mono' : ''}`}
    />
  </div>
);

const FontRow: React.FC<{ label: string; value: string; placeholder: string; onChange: (v: string) => void }> = ({ label, value, placeholder, onChange }) => (
  <div>
    <label className="block text-[10px] text-neutral-400 mb-1">{label}</label>
    <input
      list="derma-font-list"
      value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
    />
  </div>
);

// --- drawer ----------------------------------------------------------------

interface SkinEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Compact result of an "Import .lua" action, shown inline in the drawer. */
type ImportSummary =
  | { ok: true; skinName: string; sourceName: string; scalarCount: number; colourCount: number; fontCount: number; warnings: string[] }
  | { ok: false; error: string };

const SkinEditorDrawer: React.FC<SkinEditorDrawerProps> = ({ isOpen, onClose }) => {
  const skins = useSkins();
  const activeSkin = useActiveSkin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  // On open (or when the current editing skin disappears), pick a sensible skin.
  useEffect(() => {
    if (!isOpen) return;
    if (editingId && skins.some((k) => k.id === editingId)) return;
    const next = getActiveSkinId() ?? (skins[0]?.id ?? null);
    setEditingId(next);
  }, [isOpen, skins, editingId]);

  const def = editingId ? skins.find((k) => k.id === editingId) ?? null : null;

  // Keep the name draft synced to the selected skin.
  useEffect(() => { setDraftName(def?.name ?? ''); }, [def?.id]);

  // Esc closes.
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isActive = !!def && activeSkin?.id === def.id;

  const setField = (f: Field, color: SkinColor | null) => {
    if (!def) return;
    if (f.kind === 'scalar') {
      const next = { ...def.scalars };
      if (color === null) delete next[f.key];
      else next[f.key] = color;
      updateSkin(def.id, { scalars: next });
    } else {
      updateSkin(def.id, { colours: setAtPath(def.colours, f.path, color) });
    }
  };

  const resetSection = (g: Group) => {
    if (!def) return;
    const scalars = { ...def.scalars };
    let colours = def.colours;
    for (const f of g.fields) {
      if (f.kind === 'scalar') delete scalars[f.key];
      else colours = setAtPath(colours, f.path, null);
    }
    updateSkin(def.id, { scalars, colours });
  };

  const handleNew = () => {
    const created = createSkin('MySkin');
    setEditingId(created.id);
  };
  const handleDuplicate = () => {
    if (!def) return;
    const copy = duplicateSkin(def.id);
    if (copy) setEditingId(copy.id);
  };
  const handleDelete = () => {
    if (!def) return;
    if (!confirm(`Delete skin "${def.name}"? This cannot be undone.`)) return;
    const remaining = skins.filter((k) => k.id !== def.id);
    deleteSkin(def.id);
    setEditingId(remaining[0]?.id ?? null);
  };
  const toggleActive = () => {
    if (!def) return;
    setActiveSkinId(isActive ? null : def.id);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseSkinLua(text);
      if (!parsed) {
        setImportResult({ ok: false, error: `Could not parse "${file.name}" as a Derma skin (no SKIN table / derma.DefineSkin found).` });
        return;
      }
      // Register through the registry: name is sanitized, kept unique, never "Default".
      const created = createSkin(parsed.name);
      const patch: Partial<SkinDef> = {
        printName: parsed.def.printName ?? created.printName,
        author: parsed.def.author ?? '',
        dermaVersion: parsed.def.dermaVersion ?? 1,
        scalars: parsed.def.scalars ?? {},
        colours: parsed.def.colours ?? {},
      };
      if (parsed.def.fontFrame) patch.fontFrame = parsed.def.fontFrame;
      if (parsed.def.fontTab) patch.fontTab = parsed.def.fontTab;
      if (parsed.def.fontCategoryHeader) patch.fontCategoryHeader = parsed.def.fontCategoryHeader;
      if (parsed.def.gwenTexture) patch.gwenTexture = parsed.def.gwenTexture;
      updateSkin(created.id, patch);
      setEditingId(created.id);
      const fontCount = ['fontFrame', 'fontTab', 'fontCategoryHeader'].filter((k) => (patch as any)[k]).length;
      setImportResult({
        ok: true,
        skinName: created.name,
        sourceName: parsed.name,
        scalarCount: Object.keys(patch.scalars ?? {}).length,
        colourCount: countColourLeaves(patch.colours),
        fontCount,
        warnings: parsed.warnings,
      });
    } catch (err: any) {
      setImportResult({ ok: false, error: `Failed to read "${file.name}": ${err?.message || err}` });
    }
  };

  const lua = def ? generateSkinLua(def) : '';
  const copyLua = () => { if (lua) navigator.clipboard.writeText(lua); };
  const downloadLua = () => {
    if (!def) return;
    const blob = new Blob([lua], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeLuaSkinName(def.name)}.lua`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] max-w-[95vw] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
      <datalist id="derma-font-list">
        {DERMA_FONT_NAMES.map((n) => <option key={n} value={n} />)}
      </datalist>

      {/* Header */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-800/50 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-neutral-200">
          <Palette className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-bold">Skin Editor</span>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-700"><X className="w-4 h-4" /></button>
      </div>

      {/* Skin selector + CRUD */}
      <div className="shrink-0 border-b border-neutral-800 p-3 space-y-2 bg-neutral-900">
        <div className="flex items-center gap-1.5">
          <select
            value={editingId ?? ''}
            onChange={(e) => setEditingId(e.target.value || null)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            {skins.length === 0 && <option value="">No skins yet</option>}
            {skins.map((k) => (
              <option key={k.id} value={k.id}>{k.name}{activeSkin?.id === k.id ? '  (active)' : ''}</option>
            ))}
          </select>
          <button onClick={handleNew} title="New skin" className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={handleDuplicate} disabled={!def} title="Duplicate" className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white disabled:opacity-30"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={handleDelete} disabled={!def} title="Delete" className="p-1.5 rounded bg-neutral-800 hover:bg-red-700 text-neutral-300 hover:text-white disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".lua,.txt,text/plain"
          className="hidden"
          onChange={handleImportFile}
        />
        <button
          onClick={handleImportClick}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium"
        >
          <Upload className="w-3.5 h-3.5" /> Import .lua
        </button>

        {importResult && (
          <div className={`rounded border p-2 text-[10px] ${importResult.ok ? 'border-emerald-700/50 bg-emerald-900/20' : 'border-red-700/50 bg-red-900/20'}`}>
            <div className="flex items-start justify-between gap-2">
              {importResult.ok ? (
                <div className="flex items-start gap-1.5 text-emerald-300">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <div>
                    <div className="font-semibold text-emerald-200">
                      Imported "{importResult.sourceName}" as <span className="font-mono">{importResult.skinName}</span>
                    </div>
                    <div className="text-emerald-400/80 mt-0.5">
                      {importResult.scalarCount} scalar{importResult.scalarCount === 1 ? '' : 's'} ·{' '}
                      {importResult.colourCount} colour leaf{importResult.colourCount === 1 ? '' : 'es'} ·{' '}
                      {importResult.fontCount} font{importResult.fontCount === 1 ? '' : 's'} overridden
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <span>{importResult.error}</span>
                </div>
              )}
              <button onClick={() => setImportResult(null)} className="text-neutral-500 hover:text-white shrink-0"><X className="w-3 h-3" /></button>
            </div>
            {importResult.ok && importResult.warnings.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-emerald-800/40 space-y-1">
                {importResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-amber-400/90">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {def && (
          <button
            onClick={toggleActive}
            className={`w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${isActive ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
          >
            {isActive ? <><Eye className="w-3.5 h-3.5" /> Active — canvas is previewing this skin</> : <><EyeOff className="w-3.5 h-3.5" /> Set active (preview on canvas)</>}
          </button>
        )}
      </div>

      {!def ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 p-6">
          <Palette className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No skin selected</p>
          <p className="text-xs mt-1 opacity-70">Create a skin to start theming.</p>
          <button onClick={handleNew} className="mt-4 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Skin</button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Export */}
          <Section title="Export (lua/skins)" icon={FileCode}>
            <div className="flex gap-2">
              <button onClick={copyLua} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button onClick={downloadLua} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> Download .lua
              </button>
            </div>
            <p className="text-[9px] text-neutral-600">
              Saves <span className="font-mono text-neutral-400">{sanitizeLuaSkinName(def.name)}.lua</span> — drop it in <span className="font-mono">garrysmod/lua/skins/</span>. When this skin is active, the main GLua export adds <span className="font-mono">:SetSkin("{sanitizeLuaSkinName(def.name)}")</span> to the root.
            </p>
            <pre className="max-h-52 overflow-auto bg-[#1e1e1e] border border-neutral-800 rounded p-2 text-[10px] font-mono text-green-400/90 whitespace-pre leading-relaxed">{lua}</pre>
          </Section>

          {/* Identity */}
          <Section title="Identity" icon={Info}>
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Name (Lua reg + filename)</label>
              <input
                type="text" value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => { if (draftName.trim()) updateSkin(def.id, { name: draftName }); else setDraftName(def.name); }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[9px] text-neutral-600 mt-1">Sanitized to [A-Za-z0-9_]; kept unique; never "Default".</p>
            </div>
            <TextRow label="PrintName" value={def.printName} onChange={(v) => updateSkin(def.id, { printName: v })} placeholder="Display name" />
            <TextRow label="Author" value={def.author} onChange={(v) => updateSkin(def.id, { author: v })} placeholder="Your name" />
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">DermaVersion</label>
              <input
                type="number" value={def.dermaVersion}
                onChange={(e) => updateSkin(def.id, { dermaVersion: parseInt(e.target.value) || 1 })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </Section>

          {/* Fonts */}
          <Section title="Fonts" icon={TypeIcon}>
            <FontRow label="fontFrame" value={def.fontFrame ?? ''} placeholder="DermaDefault" onChange={(v) => updateSkin(def.id, { fontFrame: v || undefined })} />
            <FontRow label="fontTab" value={def.fontTab ?? ''} placeholder="DermaDefault" onChange={(v) => updateSkin(def.id, { fontTab: v || undefined })} />
            <FontRow label="fontCategoryHeader" value={def.fontCategoryHeader ?? ''} placeholder="TabLarge" onChange={(v) => updateSkin(def.id, { fontCategoryHeader: v || undefined })} />
            <p className="text-[9px] text-neutral-600">Export-only in v1 (not previewed). Type a name or pick a known Derma font.</p>
          </Section>

          {/* Color groups */}
          {GROUPS.map((g) => (
            <Section key={g.title} title={g.title} icon={g.icon} onResetSection={() => resetSection(g)}>
              {g.fields.map((f) => {
                const { value, overridden } = fieldValue(def, f);
                const key = f.kind === 'scalar' ? f.key : f.path.join('.');
                return (
                  <SkinColorInput
                    key={key}
                    label={f.label}
                    value={value}
                    isOverridden={overridden}
                    live={f.live}
                    onChange={(c) => setField(f, c)}
                    onReset={() => setField(f, null)}
                  />
                );
              })}
            </Section>
          ))}

          {/* Advanced */}
          <Section title="Advanced" icon={Square}>
            <TextRow label="GwenTexture (atlas path — export-only)" value={def.gwenTexture ?? ''} onChange={(v) => updateSkin(def.id, { gwenTexture: v || undefined })} placeholder="gwenskin/GModDefault.png" mono />
            <p className="text-[9px] text-neutral-600">v1 never emits a partial tex table; the export inherits Default's atlas.</p>
          </Section>

          <div className="p-3">
            <p className="text-[9px] text-neutral-600 leading-relaxed">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> live</span> markers re-theme the canvas immediately.
              Other fields export to the .lua but are not previewed in v1 (texture/atlas &amp; Paint hooks are inherited from Default).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinEditorDrawer;
