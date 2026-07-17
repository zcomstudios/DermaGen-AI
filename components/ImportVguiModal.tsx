import React, { useMemo, useState } from 'react';
import { X, ExternalLink, Github, Search } from 'lucide-react';
import { ComponentType } from '../types';
import { VGUI_PANELS, VguiPanelInfo } from '../utils/vguiPanelRegistry';
import { useDynamicPanels } from '../utils/dynamicPanelRegistry';
import ImportProgressModal from './ImportProgressModal';

interface ImportVguiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PanelRow extends VguiPanelInfo {
  listed: boolean;
  /** In DermaGen's ComponentType enum but absent from the GMod wiki (removed upstream) */
  legacy: boolean;
}

const LISTED_TYPES = new Set<string>(Object.values(ComponentType));

/** Registry rows + any DermaGen ComponentType the wiki no longer lists (drift stays visible). */
const buildRows = (): PanelRow[] => {
  const rows: PanelRow[] = VGUI_PANELS.map((p) => ({
    ...p,
    listed: LISTED_TYPES.has(p.name),
    legacy: false,
  }));
  const wikiNames = new Set(VGUI_PANELS.map((p) => p.name));
  for (const type of Object.values(ComponentType)) {
    if (!wikiNames.has(type)) {
      rows.push({
        name: type,
        category: 'Not on GMod Wiki',
        deprecated: false,
        wikiUrl: '',
        githubUrl: null,
        imported: false,
        listed: true,
        legacy: true,
      });
    }
  }
  return rows;
};

const ALL_ROWS = buildRows();

/** Compact display label for a URL, keeping the informative tail. */
const urlLabel = (url: string, keepSegments: number): string =>
  url.replace(/^https?:\/\/[^/]+\//, '').split('/').slice(-keepSegments).join('/');

const ReadonlyCheck: React.FC<{ checked: boolean; title: string }> = ({ checked, title }) => (
  <input
    type="checkbox"
    checked={checked}
    readOnly
    title={title}
    className="w-3.5 h-3.5 accent-blue-500 cursor-default pointer-events-none"
  />
);

const ImportVguiModal: React.FC<ImportVguiModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [importTarget, setImportTarget] = useState<VguiPanelInfo | null>(null);
  const dynamicPanels = useDynamicPanels();

  // Overlay runtime-imported panels onto the static curated flags.
  const allRows = useMemo(() => {
    const dynamicNames = new Set(dynamicPanels.map((p) => p.name));
    return ALL_ROWS.map((r) => ({
      ...r,
      dynamic: !r.imported && dynamicNames.has(r.name),
      imported: r.imported || dynamicNames.has(r.name),
    }));
  }, [dynamicPanels]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [search, allRows]);

  if (!isOpen) return null;

  const listedCount = allRows.filter((r) => r.listed).length;
  const importedCount = allRows.filter((r) => r.imported).length;

  const handleImportedClick = (row: PanelRow & { dynamic: boolean }) => {
    // Curated (statically implemented) panels stay readonly.
    if (row.imported && !row.dynamic) return;
    if (row.legacy) return; // no wiki/GitHub sources exist to analyze
    if (row.dynamic && !confirm(`${row.name} is already imported. Re-run the import and overwrite it?`)) return;
    setImportTarget(row);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onMouseDown={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-12 border-b border-neutral-700 bg-neutral-800 flex items-center justify-between px-6 shrink-0 rounded-t-lg">
          <h2 className="font-bold text-lg text-white">Import VGUI Panel</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-neutral-800 shrink-0 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or category..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-8 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-[11px] text-neutral-500">
            {rows.length} of {allRows.length} panels
          </span>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-neutral-800 z-10">
              <tr className="text-neutral-400 text-left">
                <th className="px-4 py-2 font-semibold w-10 text-right">#</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Gmod Wiki</th>
                <th className="px-4 py-2 font-semibold">GitHub</th>
                <th className="px-4 py-2 font-semibold text-center w-16">Listed</th>
                <th className="px-4 py-2 font-semibold text-center w-20">Imported</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.name}
                  className="border-t border-neutral-800 hover:bg-neutral-800/50 text-neutral-300"
                >
                  <td className="px-4 py-1.5 text-right text-neutral-500 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <span className="font-medium text-white">{r.name}</span>
                    {r.deprecated && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        deprecated
                      </span>
                    )}
                    {r.legacy && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/30"
                        title="Exists in DermaGen but has been removed from the GMod wiki and the garrysmod repo"
                      >
                        removed from wiki
                      </span>
                    )}
                    {r.dynamic && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 border border-green-500/30"
                        title="Imported at runtime from the GitHub source + GMod wiki"
                      >
                        imported
                      </span>
                    )}
                    <div className="text-[10px] text-neutral-500">{r.category}</div>
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    {r.wikiUrl ? (
                      <a
                        href={r.wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                        title={r.wikiUrl}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {urlLabel(r.wikiUrl, 2)}
                      </a>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    {r.githubUrl ? (
                      <a
                        href={r.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                        title={r.githubUrl}
                      >
                        <Github className="w-3 h-3 shrink-0" />
                        {urlLabel(r.githubUrl, 2)}
                      </a>
                    ) : (
                      <span className="text-neutral-600" title="Engine-level (C++) panel — no Lua source file">
                        engine
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <ReadonlyCheck
                      checked={r.listed}
                      title={r.listed ? 'Exists in the DermaGen component list' : 'Not in the DermaGen component list'}
                    />
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    {r.imported && !r.dynamic ? (
                      <ReadonlyCheck
                        checked
                        title="Compared against the GMod wiki page + GitHub source and implemented fully"
                      />
                    ) : r.legacy ? (
                      <ReadonlyCheck
                        checked={false}
                        title="Removed from the wiki and repo — no sources left to import from"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={r.imported}
                        onChange={() => handleImportedClick(r)}
                        title={
                          r.dynamic
                            ? 'Imported at runtime from GitHub + wiki — click to re-import'
                            : 'Click to analyze the GitHub source + wiki page and import this panel'
                        }
                        className="w-3.5 h-3.5 accent-green-500 cursor-pointer"
                      />
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No panels match "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-neutral-800 bg-neutral-900 shrink-0 rounded-b-lg flex items-center justify-between text-[11px] text-neutral-500">
          <span>
            {allRows.length} panels · <span className="text-neutral-300">{listedCount}</span> listed in DermaGen ·{' '}
            <span className="text-neutral-300">{importedCount}</span> imported
          </span>
          <span>
            Source: GMod Wiki VGUI Element List + Facepunch/garrysmod · refresh via{' '}
            <code className="text-neutral-400">node scripts/generateVguiRegistry.mjs</code>
          </span>
        </div>
      </div>

      {importTarget && (
        <ImportProgressModal panel={importTarget} onClose={() => setImportTarget(null)} />
      )}
    </div>
  );
};

export default ImportVguiModal;
