import React, { useEffect, useRef, useState } from 'react';
import { X, Check, AlertTriangle, XCircle, Loader2, MinusCircle, Circle, Github, BookOpen, PackageCheck, RotateCcw } from 'lucide-react';
import { VguiPanelInfo } from '../utils/vguiPanelRegistry';
import { importVguiPanel, ImportProgress, ImportStageState } from '../utils/vguiImporter';

interface ImportProgressModalProps {
  panel: VguiPanelInfo;
  onClose: () => void;
}

const STAGE_ICONS: Record<string, React.FC<any>> = {
  'github-fetch': Github,
  'github-parse': Github,
  'wiki-fetch': BookOpen,
  'wiki-parse': BookOpen,
  register: PackageCheck,
};

const StatusIcon: React.FC<{ stage: ImportStageState }> = ({ stage }) => {
  switch (stage.status) {
    case 'done':
      return <Check className="w-3.5 h-3.5 text-green-400" />;
    case 'warning':
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    case 'active':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    case 'skipped':
      return <MinusCircle className="w-3.5 h-3.5 text-neutral-600" />;
    default:
      return <Circle className="w-3.5 h-3.5 text-neutral-700" />;
  }
};

const StageRow: React.FC<{ stage: ImportStageState }> = ({ stage }) => {
  const Icon = STAGE_ICONS[stage.id] || Circle;
  const dimmed = stage.status === 'pending' || stage.status === 'skipped';
  const barColor =
    stage.status === 'error'
      ? 'bg-red-500'
      : stage.status === 'warning'
      ? 'bg-amber-500'
      : stage.status === 'done'
      ? 'bg-green-500'
      : 'bg-blue-500';
  const frac = stage.status === 'done' || stage.status === 'warning' || stage.status === 'error' ? 1 : stage.progress;

  return (
    <div className={`px-4 py-2 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <StatusIcon stage={stage} />
        <Icon className="w-3 h-3 text-neutral-500 shrink-0" />
        <span className="text-xs text-neutral-200 flex-1 truncate">{stage.label}</span>
        <span className="text-[10px] text-neutral-500 tabular-nums">
          {stage.status === 'skipped' ? 'skipped' : `${Math.round(frac * 100)}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1 bg-neutral-800 rounded overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-200 ease-out`}
          style={{ width: `${(stage.status === 'skipped' ? 0 : frac) * 100}%` }}
        />
      </div>
      {stage.detail && (
        <div className="mt-1 text-[10px] text-neutral-500 truncate" title={stage.detail}>
          {stage.detail}
        </div>
      )}
    </div>
  );
};

const ImportProgressModal: React.FC<ImportProgressModalProps> = ({ panel, onClose }) => {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [runId, setRunId] = useState(0);
  const runningRef = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke of effects
    if (runningRef.current) return;
    runningRef.current = true;
    importVguiPanel(panel, setProgress).finally(() => {
      runningRef.current = false;
    });
  }, [panel, runId]);

  const overallPct = Math.round((progress?.overall || 0) * 100);
  const finished = !!progress?.done;
  const failed = !!progress?.error;
  const result = progress?.result;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
      onMouseDown={finished ? onClose : undefined}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-11 border-b border-neutral-700 bg-neutral-800 flex items-center justify-between px-4 shrink-0 rounded-t-lg">
          <h2 className="font-bold text-sm text-white">
            Importing <span className="text-blue-400">{panel.name}</span>
          </h2>
          <button
            onClick={onClose}
            disabled={!finished}
            className="text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
            title={finished ? 'Close' : 'Import in progress…'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall bar */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
              {failed ? 'Import failed' : finished ? 'Import complete' : 'Overall progress'}
            </span>
            <span className="text-xs text-neutral-300 font-mono tabular-nums">{overallPct}%</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                failed ? 'bg-red-500' : finished ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="overflow-y-auto divide-y divide-neutral-800/60 border-t border-neutral-800">
          {(progress?.stages || []).map((s) => (
            <StageRow key={s.id} stage={s} />
          ))}
        </div>

        {/* Result summary */}
        {result && (
          <div className="border-t border-neutral-800 px-4 py-3 text-xs text-neutral-300 overflow-y-auto max-h-40">
            <div className="font-semibold text-white mb-1">
              {result.name}
              {result.parent && <span className="text-neutral-500 font-normal"> : {result.parent}</span>}
              {result.realm && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {result.realm}
                </span>
              )}
            </div>
            {result.description && (
              <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">{result.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {result.properties.map((p) => (
                <span
                  key={p.name}
                  className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px]"
                  title={`${p.setter}/${p.getter} (${p.luaType})`}
                >
                  {p.name}
                </span>
              ))}
              {result.methods.map((m) => (
                <span
                  key={m.name}
                  className="px-1.5 py-0.5 rounded bg-neutral-700/40 text-neutral-300 border border-neutral-600/40 text-[10px]"
                  title={`${m.name}(${m.args.join(', ')}) — from ${m.source}`}
                >
                  {m.name}()
                </span>
              ))}
            </div>
            {result.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400/90">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-neutral-800 shrink-0 rounded-b-lg flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">
            {failed
              ? progress?.error
              : finished
              ? 'Panel added to the Components list.'
              : 'Analyzing GitHub source + GMod wiki…'}
          </span>
          <div className="flex items-center gap-2">
            {failed && (
              <button
                onClick={() => setRunId((n) => n + 1)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            )}
            <button
              onClick={onClose}
              disabled={!finished}
              className="px-3 py-1 rounded text-[11px] bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {finished ? 'Done' : 'Working…'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportProgressModal;
