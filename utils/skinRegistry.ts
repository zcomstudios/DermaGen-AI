// Persisted skin registry — mirrors utils/dynamicPanelRegistry.ts (module store
// + listeners + useSyncExternalStore + localStorage). Skins live OUTSIDE the
// EditorState/history (undo never affects skins), exactly like dynamic panels.

import { useSyncExternalStore } from 'react';
import { SkinDef } from './skinTypes';

const STORAGE_KEY = 'dermaGenSkins';
const ACTIVE_KEY = 'dermaGenActiveSkinId';

let skins: Record<string, SkinDef> = {};
let snapshot: SkinDef[] = [];
let activeSkinId: string | null = null;
const listeners = new Set<() => void>();

const rebuildSnapshot = () => {
  snapshot = Object.values(skins).sort((a, b) => a.name.localeCompare(b.name));
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) skins = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load skin registry', e);
    skins = {};
  }
  try {
    activeSkinId = localStorage.getItem(ACTIVE_KEY) || null;
  } catch {
    activeSkinId = null;
  }
  // Drop a dangling active id (skin deleted out-of-band).
  if (activeSkinId && !skins[activeSkinId]) activeSkinId = null;
  rebuildSnapshot();
};

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skins));
    if (activeSkinId) localStorage.setItem(ACTIVE_KEY, activeSkinId);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch (e) {
    console.error('Failed to persist skin registry', e);
  }
};

const emit = () => listeners.forEach((l) => l());

load();

// --- name sanitization -----------------------------------------------------

/** Sanitize to Lua-safe [%w_]+; never "Default" (that would replace the global skin). */
export const sanitizeSkinName = (raw: string): string => {
  let name = (raw || '').replace(/[^A-Za-z0-9_]/g, '');
  if (!name) name = 'MySkin';
  if (/^\d/.test(name)) name = 'S' + name; // Lua identifier can't start with a digit
  if (name.toLowerCase() === 'default') name = name + '_1';
  return name;
};

/** Ensure a name is unique across the library (case-insensitive), ignoring `exceptId`. */
export const uniqueSkinName = (raw: string, exceptId?: string): string => {
  const base = sanitizeSkinName(raw);
  const taken = new Set(
    Object.values(skins)
      .filter((s) => s.id !== exceptId)
      .map((s) => s.name.toLowerCase()),
  );
  if (!taken.has(base.toLowerCase())) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`.toLowerCase())) i++;
  return `${base}_${i}`;
};

const genId = () => Math.random().toString(36).substr(2, 9);

// --- CRUD ------------------------------------------------------------------

export const registerSkin = (def: SkinDef) => {
  skins[def.id] = def;
  rebuildSnapshot();
  persist();
  emit();
};

/** Create a fresh, empty (all-inherited) skin and register it. Returns the new def. */
export const createSkin = (name = 'MySkin'): SkinDef => {
  const now = new Date().toISOString();
  const finalName = uniqueSkinName(name);
  const def: SkinDef = {
    id: genId(),
    name: finalName,
    printName: finalName,
    author: '',
    dermaVersion: 1,
    scalars: {},
    colours: {},
    createdAt: now,
    updatedAt: now,
  };
  registerSkin(def);
  return def;
};

/** Shallow-patch a skin (caller supplies the already-merged scalars/colours). */
export const updateSkin = (id: string, patch: Partial<SkinDef>) => {
  const cur = skins[id];
  if (!cur) return;
  let next: SkinDef = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  // Keep name sanitized + unique if it changed.
  if (patch.name !== undefined) {
    next.name = uniqueSkinName(patch.name, id);
  }
  skins[id] = next;
  rebuildSnapshot();
  persist();
  emit();
};

/** Deep-clone an existing skin under a new id + unique name. Returns the copy. */
export const duplicateSkin = (id: string): SkinDef | null => {
  const cur = skins[id];
  if (!cur) return null;
  const now = new Date().toISOString();
  const copy: SkinDef = {
    ...JSON.parse(JSON.stringify(cur)),
    id: genId(),
    name: uniqueSkinName(`${cur.name}_copy`),
    createdAt: now,
    updatedAt: now,
  };
  copy.printName = copy.name;
  registerSkin(copy);
  return copy;
};

export const deleteSkin = (id: string) => {
  if (!skins[id]) return;
  delete skins[id];
  if (activeSkinId === id) activeSkinId = null;
  rebuildSnapshot();
  persist();
  emit();
};

export const getSkin = (id: string): SkinDef | undefined => skins[id];

export const listSkins = (): SkinDef[] => snapshot;

// --- active skin -----------------------------------------------------------

export const getActiveSkinId = (): string | null => activeSkinId;

export const setActiveSkinId = (id: string | null) => {
  activeSkinId = id && skins[id] ? id : null;
  persist();
  emit();
};

export const getActiveSkin = (): SkinDef | null =>
  activeSkinId ? skins[activeSkinId] ?? null : null;

// --- subscription / hooks --------------------------------------------------

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** React hook — re-renders when skins are created/edited/deleted. */
export const useSkins = (): SkinDef[] => useSyncExternalStore(subscribe, () => snapshot);

/** React hook — the currently active skin (or null), re-rendering on change. */
export const useActiveSkin = (): SkinDef | null =>
  useSyncExternalStore(subscribe, getActiveSkin);
