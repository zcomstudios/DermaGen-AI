import React from 'react';
import { UIElement } from '../types';
import { DynamicPanelDef, getDynamicPanel } from '../utils/dynamicPanelRegistry';
import { SkinPreview } from '../utils/skinTypes';
import { resolveEffectiveSkin } from '../utils/skinResolver';

// Module-level active-skin preview, kept fresh by `renderDynamicPanel` (Canvas
// passes the active skin in). This is a plain-function module (renderers can't
// use hooks), so the helper components + inline replicas read this shared value.
// Initialized to the Default baseline so it's correct before the first call
// (zero-regression when no custom skin is active).
let skin: SkinPreview = resolveEffectiveSkin(null).preview;

/**
 * Visual replicas for runtime-imported VGUI panels, styled after the default
 * Derma skin (garrysmod/lua/skins/default.lua) and each panel's example
 * screenshot on its GMod wiki page. Falls back through the panel's parent
 * chain (from the imported definition) so anything without a bespoke replica
 * still renders like its base class.
 */

type Renderer = (el: UIElement, def: DynamicPanelDef) => React.ReactNode;

// --- shared bits -----------------------------------------------------------

/** Source-style checkerboard used behind alpha/color previews */
const checkerBg: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #cfcfcf 25%, transparent 25%, transparent 75%, #cfcfcf 75%), linear-gradient(45deg, #cfcfcf 25%, transparent 25%, transparent 75%, #cfcfcf 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0, 5px 5px',
  backgroundColor: '#ffffff',
};

const label9 = 'text-[9px] leading-none';
const label10 = 'text-[10px] leading-none';

/** Light Derma body with the standard 1px dark border */
const LightBody: React.FC<{ children?: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
  <div
    className={`w-full h-full overflow-hidden ${className}`}
    style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)', ...style }}
  >
    {children}
  </div>
);

/** Standard Derma raised button face */
const ButtonFace: React.FC<{ children?: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
  <div
    className={`flex items-center justify-center border border-black/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${className}`}
    style={{ backgroundColor: skin.buttonNormal, color: '#000', ...style }}
  >
    {children}
  </div>
);

/** Tiny silkicon stand-in (16px colored glyph square) */
const SilkIcon: React.FC<{ color?: string; size?: number }> = ({ color = '#7aa837', size = 12 }) => (
  <span
    className="inline-block rounded-[2px] border border-black/30 shrink-0"
    style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
  />
);

/** Vertical scrollbar replica (track + grip + end buttons) */
const VScrollBar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-[15px] h-full flex flex-col border-l border-black/20 ${className}`} style={{ backgroundColor: '#e6e6e6' }}>
    <div className="h-[15px] border-b border-black/25 flex items-center justify-center" style={{ backgroundColor: skin.buttonNormal }}>
      <span className="text-[7px] text-black/60 leading-none">▲</span>
    </div>
    <div className="flex-1 relative">
      <div className="absolute left-[2px] right-[2px] top-[3px] h-[35%] rounded-[2px] border border-black/30" style={{ backgroundColor: '#c8c8c8' }} />
    </div>
    <div className="h-[15px] border-t border-black/25 flex items-center justify-center" style={{ backgroundColor: skin.buttonNormal }}>
      <span className="text-[7px] text-black/60 leading-none">▼</span>
    </div>
  </div>
);

/** Menu option row (white bg, black text, silkicon column) */
const MenuRow: React.FC<{ text: string; icon?: boolean; hovered?: boolean; check?: boolean }> = ({ text, icon = true, hovered = false, check = false }) => (
  <div
    className="flex items-center gap-1.5 px-1.5 h-[22px] w-full"
    style={{ backgroundColor: hovered ? '#0066cc' : '#f5f5f5', color: hovered ? '#fff' : '#000' }}
  >
    {check ? (
      <span className="text-[10px] leading-none">✓</span>
    ) : icon ? (
      <SilkIcon color="#6a8caf" />
    ) : null}
    <span className={`${label10} truncate`}>{text}</span>
  </div>
);

const modelSilhouette = (
  <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 opacity-40" fill="none" stroke="#556" strokeWidth="1.5">
    <path d="M12 2 L20 6.5 L20 17.5 L12 22 L4 17.5 L4 6.5 Z" />
    <path d="M4 6.5 L12 11 L20 6.5 M12 11 L12 22" />
  </svg>
);

// --- bespoke replicas ------------------------------------------------------

const RENDERERS: Record<string, Renderer> = {
  // ===== Base / engine bases =====
  DPanel: () => <LightBody />,
  Panel: (el) => (
    <div className="w-full h-full" style={{ backgroundColor: el.props.color || 'transparent', border: el.props.color ? 'none' : '1px dashed rgba(255,255,255,0.12)' }} />
  ),
  EditablePanel: (el, def) => RENDERERS.Panel(el, def),
  ContextBase: () => <LightBody />,
  DDragBase: () => <div className="w-full h-full border border-dashed border-white/15" />,
  DSizeToContents: () => <div className="w-full h-full border border-dashed border-white/15" />,

  DButton: (el) => (
    <ButtonFace className="w-full h-full px-2">
      <span className={`${label10} truncate`}>{el.props.text || 'Button'}</span>
    </ButtonFace>
  ),
  Button: (el, def) => RENDERERS.DButton(el, def),

  DLabel: (el) => (
    <div className="w-full h-full flex items-center">
      <span className={`${label10} truncate`} style={{ color: el.props.color || '#eee' }}>{el.props.text || 'Label'}</span>
    </div>
  ),
  Label: (el, def) => RENDERERS.DLabel(el, def),

  DTextEntry: (el) => (
    <div className="w-full h-full bg-white border border-neutral-400 shadow-inner flex items-center px-1.5">
      <span className={`${label10} text-black truncate`}>{el.props.text || ''}</span>
      <div className="w-[1px] h-3 bg-black animate-pulse ml-px" />
    </div>
  ),
  TextEntry: (el, def) => RENDERERS.DTextEntry(el, def),

  RichText: (el) => (
    <div className="w-full h-full bg-black/40 border border-black/40 p-1 overflow-hidden">
      <span className={`${label9} text-white/90 whitespace-pre-wrap`}>{el.props.text || 'Rich text content…'}</span>
    </div>
  ),

  Frame: (el) => (
    <div className="w-full h-full flex flex-col bg-[#323232] border border-black/60 shadow-xl overflow-hidden">
      <div className="h-5 flex items-center px-2 bg-[#2a2a2a] border-b border-black/40">
        <span className={`${label9} text-white/90 font-bold truncate`}>{el.props.text || 'Frame'}</span>
      </div>
      <div className="flex-1" />
    </div>
  ),

  // ===== Labels =====
  DLabelEditable: (el) => (
    <div className="w-full h-full flex items-center gap-1">
      <span className={`${label10} truncate border-b border-dotted border-white/40`} style={{ color: '#eee' }}>
        {el.props.text || 'Editable Label'}
      </span>
      <span className="text-[8px] text-white/40">✎</span>
    </div>
  ),
  DLabelURL: (el) => (
    <div className="w-full h-full flex items-center">
      {/* Default DLabelURL text color per default skin: dull blue-gray */}
      <span className={`${label10} truncate underline cursor-pointer`} style={{ color: '#5878a7' }}>
        {el.props.text || 'https://wiki.facepunch.com'}
      </span>
    </div>
  ),

  // ===== Buttons / checks =====
  DExpandButton: () => (
    <ButtonFace className="w-full h-full">
      <span className="text-[10px] font-bold leading-none text-black/70">+</span>
    </ButtonFace>
  ),
  DCheckBoxLabel: (el) => (
    <div className="w-full h-full flex items-center gap-1.5">
      <div className="w-[15px] h-[15px] bg-white border border-neutral-400 flex items-center justify-center shadow-sm shrink-0">
        {el.props.checked !== false && <div className="w-[9px] h-[9px] bg-[#3399FF]" />}
      </div>
      <span className={`${label10} truncate`} style={{ color: '#eee' }}>{el.props.text || 'Checkbox Label'}</span>
    </div>
  ),
  ImageCheckBox: (el) => (
    <div className="w-full h-full relative flex items-center justify-center border border-black/40" style={{ backgroundColor: skin.buttonNormal }}>
      <SilkIcon color="#6a8caf" size={16} />
      {el.props.checked !== false && (
        <span className="absolute text-[10px] text-green-600 font-bold translate-x-[5px] translate-y-[4px]">✓</span>
      )}
    </div>
  ),
  CheckButton: (el) => (
    <div className="w-full h-full flex items-center gap-1.5">
      <div className="w-[13px] h-[13px] bg-white border border-neutral-500 flex items-center justify-center shrink-0">
        {el.props.checked !== false && <span className="text-[9px] text-black leading-none">✓</span>}
      </div>
      <span className={`${label10} truncate`} style={{ color: '#eee' }}>{el.props.text || 'Check'}</span>
    </div>
  ),
  RadioButton: (el) => (
    <div className="w-full h-full flex items-center gap-1.5">
      <div className="w-[13px] h-[13px] bg-white border border-neutral-500 rounded-full flex items-center justify-center shrink-0">
        {el.props.checked !== false && <div className="w-[7px] h-[7px] bg-black rounded-full" />}
      </div>
      <span className={`${label10} truncate`} style={{ color: '#eee' }}>{el.props.text || 'Radio'}</span>
    </div>
  ),

  // ===== Model / image panels =====
  DAdjustableModelPanel: (el) => (
    <div className="w-full h-full bg-[#1a1a1a] border border-neutral-700 flex items-center justify-center relative overflow-hidden">
      {modelSilhouette}
      <span className="absolute bottom-1 left-1 text-[8px] text-neutral-500 font-mono truncate max-w-full px-1">
        {el.props.modelPath || 'WASD + mouse camera'}
      </span>
      <div className="absolute top-1 right-1 text-[8px] text-neutral-600">3D ✥</div>
    </div>
  ),
  SpawnIcon: () => (
    <div
      className="w-full h-full border border-black/60 flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 40%, #4a5568 0%, #23272e 75%)' }}
    >
      {modelSilhouette}
    </div>
  ),
  ModelImage: (el, def) => RENDERERS.SpawnIcon(el, def),
  ContentIcon: (el) => (
    <div className="w-full h-full rounded-[3px] border border-black/60 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(180deg, #3d4351 0%, #23262d 100%)' }}>
      <div className="flex-1 flex items-center justify-center">{modelSilhouette}</div>
      <div className="h-[16px] bg-black/50 flex items-center justify-center px-1">
        <span className="text-[8px] text-white/85 truncate">{el.props.text || 'content'}</span>
      </div>
    </div>
  ),
  AvatarImage: () => (
    <div className="w-full h-full bg-[#37424d] border border-black/50 flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 opacity-60" fill="#8fa3b3">
        <circle cx="12" cy="8.5" r="4.5" />
        <path d="M2.5 22 C2.5 16 7 13.5 12 13.5 C17 13.5 21.5 16 21.5 22 Z" />
      </svg>
    </div>
  ),
  TGAImage: () => (
    <div className="w-full h-full border border-neutral-600" style={checkerBg} />
  ),
  AchievementIcon: () => (
    <div className="w-full h-full border border-black/60 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #d9b23a 0%, #8a6d14 100%)' }}>
      <span className="text-[12px]">🏆</span>
    </div>
  ),
  DKillIcon: () => (
    <div className="w-full h-full flex items-center justify-center">
      {/* HL2 kill icons draw in the orange death-notice color */}
      <svg viewBox="0 0 48 16" className="w-full h-full" fill="none" stroke="#ff9900" strokeWidth="1.6">
        <path d="M4 8 L28 8 M28 5.5 L40 5.5 L44 8 L40 10.5 L28 10.5 Z M8 8 L8 12 M13 8 L13 11" />
      </svg>
    </div>
  ),
  DSprite: () => (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-3/4 h-3/4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(120,180,255,0.5) 35%, transparent 70%)' }} />
    </div>
  ),
  DShape: (el) => (
    <div className="w-full h-full" style={{ backgroundColor: el.props.color || '#ff0000', border: '1px solid rgba(0,0,0,0.4)' }} />
  ),
  Material: (el) => (
    <div className="w-full h-full border border-neutral-600 overflow-hidden" style={checkerBg}>
      {el.props.imageUrl && <img src={el.props.imageUrl} className="w-full h-full object-cover" alt="" />}
    </div>
  ),

  // ===== Scroll machinery =====
  DVScrollBar: () => <VScrollBar className="!w-full border-l-0" />,
  DScrollBarGrip: () => (
    <div className="w-full h-full rounded-[2px] border border-black/30" style={{ backgroundColor: '#c8c8c8' }} />
  ),
  DHorizontalScroller: () => (
    <div className="w-full h-full relative flex items-stretch gap-[2px] overflow-hidden bg-black/20 border border-black/30 p-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-full shrink-0" style={{ width: '26%', backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }} />
      ))}
      <div className="absolute left-0 top-0 bottom-0 w-[14px] flex items-center justify-center" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.55), transparent)' }}>
        <span className="text-[8px] text-white/80">◀</span>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[14px] flex items-center justify-center" style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.55), transparent)' }}>
        <span className="text-[8px] text-white/80">▶</span>
      </div>
    </div>
  ),

  // ===== Category / list containers =====
  DCategoryList: () => (
    <div className="w-full h-full flex overflow-hidden" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      <div className="flex-1 flex flex-col">
        {['Category 1', 'Category 2'].map((c, i) => (
          <React.Fragment key={c}>
            <div className="h-[20px] flex items-center px-1.5 border-b border-black/20 shrink-0" style={{ background: 'linear-gradient(180deg, #e8e8e8, #d0d0d0)' }}>
              <span className={`${label9} text-black/80 font-bold`}>{c}</span>
              <span className="ml-auto text-[8px] text-black/50">{i === 0 ? '▾' : '▸'}</span>
            </div>
            {i === 0 && (
              <div className="flex flex-col">
                {['Item A', 'Item B'].map((it) => (
                  <div key={it} className="h-[17px] flex items-center px-2 border-b border-black/10 bg-white">
                    <span className={`${label9} text-black/70`}>{it}</span>
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="flex-1 bg-white/40" />
      </div>
      <VScrollBar />
    </div>
  ),
  DListLayout: () => (
    <div className="w-full h-full flex flex-col gap-[2px] p-[2px] border border-dashed border-white/15 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[22px] shrink-0" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }} />
      ))}
    </div>
  ),
  DTileLayout: () => (
    <div className="w-full h-full flex flex-wrap content-start gap-[3px] p-[3px] border border-dashed border-white/15 overflow-hidden">
      {[28, 28, 44, 28, 60, 28, 28, 44].map((w, i) => (
        <div key={i} className="h-[26px]" style={{ width: w, backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }} />
      ))}
    </div>
  ),
  DDrawer: () => (
    <div className="w-full h-full flex flex-col overflow-hidden border border-black/30">
      <div className="h-[14px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(180deg, #d8d8d8, #bcbcbc)' }}>
        <div className="w-8 h-[3px] rounded bg-black/30" />
      </div>
      <div className="flex-1" style={{ backgroundColor: skin.panel }} />
    </div>
  ),
  DBubbleContainer: () => (
    <div className="w-full h-full relative pt-0 pb-[10px]">
      <div className="w-full h-full rounded-[6px] border border-black/40 shadow-md" style={{ backgroundColor: '#f5f5f5' }} />
      <div
        className="absolute left-[14px] bottom-[1px] w-0 h-0"
        style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '10px solid #f5f5f5', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.4))' }}
      />
    </div>
  ),
  DPanelOverlay: (el) => (
    <div className="w-full h-full pointer-events-none" style={{ border: `3px solid ${el.props.color || '#3399FF'}`, borderRadius: 4, boxShadow: `inset 0 0 6px ${el.props.color || '#3399FF'}55` }} />
  ),

  // ===== Number widgets =====
  DNumberScratch: (el) => (
    <div className="w-full h-full bg-white border border-neutral-400 shadow-inner flex items-center justify-between px-1.5 cursor-ew-resize">
      <span className={`${label10} text-black tabular-nums`}>{el.props.sliderValue ?? 0}</span>
      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 opacity-50" fill="#000">
        <path d="M0 5 L3 2 L3 8 Z M10 5 L7 2 L7 8 Z" />
      </svg>
    </div>
  ),

  // ===== Menus =====
  DMenuOption: (el) => <MenuRow text={el.props.text || 'Menu Option'} />,
  DMenuOptionCVar: (el) => <MenuRow text={el.props.text || 'CVar Option'} check />,

  // ===== Icon / material browsers =====
  DIconBrowser: () => (
    <div className="w-full h-full flex overflow-hidden bg-white border border-neutral-400">
      <div className="flex-1 flex flex-wrap content-start gap-[3px] p-[3px] overflow-hidden">
        {['#7aa837', '#c94f4f', '#4f7bc9', '#c9a44f', '#8e5fc9', '#4fc9b2', '#c95f9c', '#6d6d6d', '#3d8c40', '#b8722c', '#2c8cb8', '#b82c5a', '#5a5ab8', '#8cb82c', '#b82c2c', '#2cb87e'].map((c, i) => (
          <SilkIcon key={i} color={c} size={16} />
        ))}
      </div>
      <VScrollBar />
    </div>
  ),
  MatSelect: () => (
    <div className="w-full h-full flex flex-wrap content-start gap-[3px] p-[3px] overflow-hidden" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      {['#7f8c8d', '#95a5a6', '#6c7a89', '#b3a78c', '#8c9e6e', '#5d6d7e', '#a08b73', '#7d6b91'].map((c, i) => (
        <div key={i} className={`w-[30px] h-[30px] border ${i === 2 ? 'border-[2px] border-[#3399FF]' : 'border-black/40'}`} style={{ background: `linear-gradient(135deg, ${c}, ${c}99)` }} />
      ))}
    </div>
  ),
  PropSelect: () => (
    <div className="w-full h-full flex flex-wrap content-start gap-[3px] p-[3px] overflow-hidden" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-[34px] h-[34px] border border-black/60 flex items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 40%, #4a5568 0%, #23272e 75%)' }}>
          {modelSilhouette}
        </div>
      ))}
    </div>
  ),
  DModelSelect: (el, def) => RENDERERS.PropSelect(el, def),
  DModelSelectMulti: (el, def) => RENDERERS.PropSelect(el, def),

  // ===== File browser =====
  DFileBrowser: () => (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white border border-neutral-400">
      <div className="h-[18px] flex items-center gap-1 px-1 border-b border-black/20 shrink-0" style={{ backgroundColor: skin.panel }}>
        <SilkIcon color="#c9a44f" size={11} />
        <span className={`${label9} text-black/70 font-mono truncate`}>garrysmod/data</span>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[38%] border-r border-black/15 p-1 flex flex-col gap-[3px]">
          {['data', 'lua', 'materials'].map((d, i) => (
            <div key={d} className="flex items-center gap-1">
              <span className="text-[7px] text-black/40">{i === 0 ? '▾' : '▸'}</span>
              <SilkIcon color="#c9a44f" size={10} />
              <span className={`${label9} text-black/75 truncate`}>{d}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 p-1 flex flex-col gap-[3px]">
          {['config.txt', 'save_01.json', 'notes.txt'].map((f) => (
            <div key={f} className="flex items-center gap-1">
              <SilkIcon color="#8fa3b3" size={10} />
              <span className={`${label9} text-black/75 truncate`}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  // ===== HTML =====
  DHTMLControls: () => (
    <div className="w-full h-full flex items-center gap-1 px-1 overflow-hidden" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      {['◀', '▶', '⟳', '⌂'].map((g) => (
        <ButtonFace key={g} className="w-[18px] h-[18px] shrink-0 rounded-[2px]">
          <span className="text-[9px] leading-none">{g}</span>
        </ButtonFace>
      ))}
      <div className="flex-1 h-[18px] bg-white border border-neutral-400 shadow-inner flex items-center px-1.5 min-w-0">
        <span className={`${label9} text-black/70 truncate`}>https://wiki.facepunch.com/gmod/</span>
      </div>
    </div>
  ),
  HTML: () => (
    <div className="w-full h-full bg-white border border-neutral-400 flex items-center justify-center">
      <span className={`${label9} text-neutral-400 font-mono`}>&lt;html&gt;</span>
    </div>
  ),
  Awesomium: (el, def) => RENDERERS.HTML(el, def),

  // ===== Color panels =====
  DColorButton: (el) => (
    <div className="w-full h-full border border-black/50 cursor-pointer" style={{ backgroundColor: el.props.color || '#ff8000' }} />
  ),
  DRGBPicker: () => (
    <div
      className="w-full h-full border border-black/50 relative"
      style={{ background: 'linear-gradient(180deg, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
    >
      <div className="absolute left-0 right-0 top-[30%] h-[2px] bg-white mix-blend-difference" />
    </div>
  ),
  DAlphaBar: (el) => (
    <div className="w-full h-full border border-black/50 relative overflow-hidden" style={checkerBg}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${el.props.color || '#ff8000'} 0%, transparent 100%)` }} />
      <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-white mix-blend-difference" />
    </div>
  ),
  DColorCombo: (el) => (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      <div className="h-[18px] flex items-end gap-[2px] px-1 pt-[2px] shrink-0 bg-black/10">
        {['Mixer', 'Palette'].map((t, i) => (
          <div
            key={t}
            className="px-2 h-[15px] flex items-center rounded-t-[3px] border border-b-0 border-black/30"
            style={{ backgroundColor: i === 0 ? skin.panel : '#d0d0d0' }}
          >
            <span className={`${label9} text-black/75`}>{t}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 flex gap-1 p-1 min-h-0">
        <div className="flex-1 border border-black/30" style={{ background: `linear-gradient(to right, #fff, ${el.props.color || '#ff8000'}), linear-gradient(to top, #000, transparent)`, backgroundBlendMode: 'multiply' }} />
        <div className="w-[12px] border border-black/30" style={{ background: 'linear-gradient(180deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
      </div>
    </div>
  ),

  // ===== DProperties family =====
  DProperties: () => (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white border border-neutral-400">
      <div className="h-[18px] flex items-center px-1.5 shrink-0" style={{ background: 'linear-gradient(180deg, #e8e8e8, #d0d0d0)', borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
        <span className={`${label9} text-black/80 font-bold`}>Category</span>
      </div>
      {[
        ['Name', 'Generic value'],
        ['Enabled', '✓'],
        ['Scale', '1.5'],
      ].map(([k, v]) => (
        <div key={k} className="h-[19px] flex border-b border-black/10 shrink-0">
          <div className="w-[45%] flex items-center px-1.5 border-r border-black/10 bg-[#f7f7f7]">
            <span className={`${label9} text-black/75 truncate`}>{k}</span>
          </div>
          <div className="flex-1 flex items-center px-1.5">
            <span className={`${label9} text-black/60 truncate`}>{v}</span>
          </div>
        </div>
      ))}
      <div className="flex-1" />
    </div>
  ),
  DEntityProperties: (el, def) => RENDERERS.DProperties(el, def),
  DProperty_Generic: () => (
    <div className="w-full h-full flex bg-white border border-neutral-300">
      <div className="w-[45%] flex items-center px-1.5 border-r border-black/10 bg-[#f7f7f7]">
        <span className={`${label9} text-black/75`}>Property</span>
      </div>
      <div className="flex-1 flex items-center px-1.5">
        <span className={`${label9} text-black/60`}>value</span>
      </div>
    </div>
  ),
  DProperty_Boolean: () => (
    <div className="w-full h-full flex bg-white border border-neutral-300 items-center px-1.5 gap-1.5">
      <div className="w-[12px] h-[12px] bg-white border border-neutral-400 flex items-center justify-center">
        <div className="w-[7px] h-[7px] bg-[#3399FF]" />
      </div>
      <span className={`${label9} text-black/75`}>Boolean</span>
    </div>
  ),
  DProperty_Float: () => (
    <div className="w-full h-full flex bg-white border border-neutral-300 items-center px-1.5 gap-1.5">
      <div className="flex-1 h-[3px] bg-neutral-300 relative rounded">
        <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-[7px] h-[11px] bg-[#dcdcdc] border border-black/40 rounded-[2px]" />
      </div>
      <span className={`${label9} text-black/60 tabular-nums`}>0.4</span>
    </div>
  ),
  DProperty_Int: (el, def) => RENDERERS.DProperty_Float(el, def),
  DProperty_Combo: () => (
    <div className="w-full h-full flex bg-white border border-neutral-300 items-center">
      <span className={`${label9} text-black/70 px-1.5 flex-1 truncate`}>Choice A</span>
      <div className="w-[16px] h-full flex items-center justify-center border-l border-black/15" style={{ backgroundColor: skin.buttonNormal }}>
        <span className="text-[7px] text-black/60">▼</span>
      </div>
    </div>
  ),
  DProperty_VectorColor: () => (
    <div className="w-full h-full flex bg-white border border-neutral-300 items-center px-1.5 gap-1.5">
      <div className="w-[14px] h-[10px] border border-black/40" style={{ backgroundColor: '#ff8000' }} />
      <span className={`${label9} text-black/60 tabular-nums`}>255 128 0</span>
    </div>
  ),

  // ===== Tree =====
  DTree_Node: (el) => (
    <div className="w-full h-full flex items-center gap-1 px-1 bg-white">
      <span className="text-[7px] text-black/50 w-[8px]">▸</span>
      <SilkIcon color="#c9a44f" size={11} />
      <span className={`${label9} text-black/80 truncate`}>{el.props.text || 'Node'}</span>
    </div>
  ),
  DTree_Node_Button: (el) => (
    <div className="w-full h-full flex items-center gap-1 px-1 bg-white">
      <SilkIcon color="#c9a44f" size={11} />
      <span className={`${label9} text-black/80 truncate`}>{el.props.text || 'Node'}</span>
    </div>
  ),

  // ===== ListView pieces =====
  DListView_Column: (el) => (
    <div className="w-full h-full flex items-center px-1.5 border border-black/25" style={{ background: 'linear-gradient(180deg, #e8e8e8, #d0d0d0)' }}>
      <span className={`${label9} text-black/80 font-bold truncate`}>{el.props.text || 'Column'}</span>
      <span className="ml-auto text-[7px] text-black/40">▲</span>
    </div>
  ),
  DListView_ColumnPlain: (el) => (
    <div className="w-full h-full flex items-center px-1.5 border border-black/25" style={{ background: 'linear-gradient(180deg, #e8e8e8, #d0d0d0)' }}>
      <span className={`${label9} text-black/80 font-bold truncate`}>{el.props.text || 'Column'}</span>
    </div>
  ),
  DListViewHeaderLabel: (el, def) => RENDERERS.DListView_ColumnPlain(el, def),
  DListView_DraggerBar: () => <div className="w-full h-full cursor-col-resize" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} />,
  DListViewLine: (el) => (
    <div className="w-full h-full flex items-center px-1.5" style={{ backgroundColor: '#f7f7f7', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <span className={`${label9} text-black/75 truncate`}>{el.props.text || 'List line'}</span>
    </div>
  ),
  DListViewLabel: (el) => (
    <div className="w-full h-full flex items-center px-1.5 bg-transparent">
      <span className={`${label9} text-black/75 truncate`}>{el.props.text || 'Cell'}</span>
    </div>
  ),

  // ===== Sandbox controls =====
  ControlPresets: () => (
    <div className="w-full h-full flex items-center gap-1 p-1 overflow-hidden" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      <div className="flex-1 h-[18px] bg-white border border-neutral-400 flex items-center min-w-0">
        <span className={`${label9} text-black/70 px-1.5 flex-1 truncate`}>Default</span>
        <div className="w-[15px] h-full flex items-center justify-center border-l border-black/15" style={{ backgroundColor: skin.buttonNormal }}>
          <span className="text-[7px] text-black/60">▼</span>
        </div>
      </div>
      {['+', '−', '✎'].map((g) => (
        <ButtonFace key={g} className="w-[18px] h-[18px] shrink-0 rounded-[2px]">
          <span className="text-[9px] leading-none">{g}</span>
        </ButtonFace>
      ))}
    </div>
  ),
  CtrlListBox: () => (
    <div className="w-full h-full bg-white border border-neutral-400 flex items-center">
      <span className={`${label9} text-black/70 px-1.5 flex-1 truncate`}>Option A</span>
      <div className="w-[16px] h-full flex items-center justify-center border-l border-black/15" style={{ backgroundColor: skin.buttonNormal }}>
        <span className="text-[7px] text-black/60">▼</span>
      </div>
    </div>
  ),
  fingerposer: () => (
    <div className="w-full h-full bg-white border border-neutral-400 flex items-end justify-center gap-[3px] p-1 overflow-hidden">
      {[30, 55, 65, 60, 45].map((h, i) => (
        <div key={i} className="w-[10%] rounded-t-full border border-black/30" style={{ height: `${h}%`, backgroundColor: '#e8d3b8' }} />
      ))}
    </div>
  ),
  FingerVar: () => (
    <div className="w-full h-full flex items-center px-1">
      <div className="flex-1 h-[3px] bg-neutral-500/50 relative rounded">
        <div className="absolute left-[55%] top-1/2 -translate-y-1/2 w-[8px] h-[12px] bg-[#dcdcdc] border border-black/40 rounded-[2px]" />
      </div>
    </div>
  ),

  // ===== Deprecated panels =====
  Slider: () => (
    <div className="w-full h-full flex items-center px-1">
      <div className="flex-1 h-[3px] bg-neutral-500/60 relative rounded">
        <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-[8px] h-[13px] bg-[#dcdcdc] border border-black/40 rounded-[2px]" />
      </div>
    </div>
  ),
  SlideBar: (el, def) => RENDERERS.Slider(el, def),
  PanelList: () => (
    <div className="w-full h-full flex overflow-hidden bg-white border border-neutral-400">
      <div className="flex-1 flex flex-col gap-[2px] p-[2px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[20px] shrink-0" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.25)' }} />
        ))}
      </div>
      <VScrollBar />
    </div>
  ),
  DPanelList: (el, def) => RENDERERS.PanelList(el, def),
  DPanelSelect: () => (
    <div className="w-full h-full flex flex-wrap content-start gap-[3px] p-[3px] overflow-hidden bg-white border border-neutral-400">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`w-[30px] h-[30px] border ${i === 1 ? 'border-[2px] border-[#3399FF]' : 'border-black/30'}`} style={{ backgroundColor: skin.panel }} />
      ))}
    </div>
  ),
  DNumPad: () => (
    <div className="w-full h-full grid grid-cols-3 gap-[2px] p-[2px]" style={{ backgroundColor: skin.panel, border: '1px solid rgba(0,0,0,0.3)' }}>
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((n) => (
        <ButtonFace key={n} className="rounded-[2px]">
          <span className="text-[9px] leading-none">{n}</span>
        </ButtonFace>
      ))}
    </div>
  ),
  DListBox: () => (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white border border-neutral-400">
      {['Item 1', 'Item 2', 'Item 3'].map((t, i) => (
        <div key={t} className="h-[18px] flex items-center px-1.5 shrink-0" style={{ backgroundColor: i === 1 ? '#0066cc' : 'transparent', color: i === 1 ? '#fff' : '#000' }}>
          <span className={label9}>{t}</span>
        </div>
      ))}
    </div>
  ),
  DListBoxItem: (el) => (
    <div className="w-full h-full flex items-center px-1.5 bg-white">
      <span className={`${label9} text-black/80 truncate`}>{el.props.text || 'Item'}</span>
    </div>
  ),
};

// Bases the parent-chain can resolve to that map onto an existing replica.
const PARENT_ALIASES: Record<string, string> = {
  DScrollPanel: 'DCategoryList', // scroll body + bar is close enough visually
  DModelPanel: 'DAdjustableModelPanel',
  DImage: 'TGAImage',
  DImageButton: 'ImageCheckBox',
  DMenuButton: 'DButton',
  DCheckBox: 'DCheckBoxLabel',
  DProgress: 'DPanel',
  DCollapsibleCategory: 'DCategoryList',
};

/**
 * Render a runtime-imported panel as a faithful default-skin replica.
 * Resolution order: bespoke replica for the class → replica for anything in
 * its parent chain (imported defs know their base class) → null (caller
 * falls back to the generic placeholder).
 */
export const renderDynamicPanel = (
  el: UIElement,
  def: DynamicPanelDef,
  commonStyle: React.CSSProperties,
  activeSkin?: SkinPreview,
): React.ReactNode | null => {
  // Keep the module-level preview fresh so the (hook-less) replica components
  // below re-theme with the active skin. Defaults to the Default baseline.
  if (activeSkin) skin = activeSkin;

  const visited = new Set<string>();
  let name: string | undefined = def.name;
  let cur: DynamicPanelDef | undefined = def;

  while (name && !visited.has(name) && visited.size < 8) {
    visited.add(name);
    const renderer = RENDERERS[name] ?? (PARENT_ALIASES[name] ? RENDERERS[PARENT_ALIASES[name]] : undefined);
    if (renderer) {
      return (
        <div className="w-full h-full relative" style={{ opacity: commonStyle.opacity }}>
          {renderer(el, def)}
        </div>
      );
    }
    // Walk up the base-class chain. If the parent is itself an imported panel
    // its own parent keeps the walk going; otherwise the literal parent name
    // gets one lookup above and the walk ends.
    name = cur?.parent || undefined;
    cur = name ? getDynamicPanel(name) : undefined;
  }
  return null;
};
