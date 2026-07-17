import { useSyncExternalStore } from 'react';

/** A property discovered on an imported panel (from AccessorFunc / wiki). */
export interface DynamicPanelProperty {
  /** Public name, e.g. "Value" (Get/Set pair is derived from it) */
  name: string;
  luaType: 'bool' | 'number' | 'string' | 'color' | 'unknown';
  getter: string;
  setter: string;
  /** Internal Lua member, e.g. "m_barValue" */
  internalVar?: string;
  source: 'github' | 'wiki';
}

export interface DynamicPanelMethod {
  name: string;
  args: string[];
  description?: string;
  source: 'github' | 'wiki';
}

/** A VGUI panel imported at runtime from the GitHub source + GMod wiki. */
export interface DynamicPanelDef {
  name: string;
  category: string;
  description: string;
  /** Base class, e.g. "DButton" (from derma.DefineControl / wiki <parent>) */
  parent: string | null;
  realm?: string;
  wikiUrl: string;
  githubUrl: string | null;
  properties: DynamicPanelProperty[];
  methods: DynamicPanelMethod[];
  /** Derma_Hook names wired by the panel source */
  hooks: string[];
  defaultSize: { w: number; h: number };
  importedAt: string;
  warnings: string[];
}

const STORAGE_KEY = 'dermaGenDynamicPanels';

let panels: Record<string, DynamicPanelDef> = {};
let snapshot: DynamicPanelDef[] = [];
const listeners = new Set<() => void>();

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) panels = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load dynamic panel registry', e);
    panels = {};
  }
  rebuildSnapshot();
};

const rebuildSnapshot = () => {
  snapshot = Object.values(panels).sort((a, b) => a.name.localeCompare(b.name));
};

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  } catch (e) {
    console.error('Failed to persist dynamic panel registry', e);
  }
};

const emit = () => listeners.forEach((l) => l());

load();

export const registerDynamicPanel = (def: DynamicPanelDef) => {
  panels[def.name] = def;
  rebuildSnapshot();
  persist();
  emit();
};

export const unregisterDynamicPanel = (name: string) => {
  if (!panels[name]) return;
  delete panels[name];
  rebuildSnapshot();
  persist();
  emit();
};

export const getDynamicPanel = (name: string): DynamicPanelDef | undefined => panels[name];

export const isDynamicPanel = (name: string): boolean => !!panels[name];

export const listDynamicPanels = (): DynamicPanelDef[] => snapshot;

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** React hook — re-renders when panels are imported/removed. */
export const useDynamicPanels = (): DynamicPanelDef[] =>
  useSyncExternalStore(subscribe, () => snapshot);
