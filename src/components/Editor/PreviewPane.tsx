import React, { useState } from 'react';
import { Eye, Undo2, Redo2, CheckCheck, Split, BookOpen, Download } from 'lucide-react';
import { computeWordDiff, computeLineDiff, DiffPart } from '../../engine/diff/index.ts';

interface PreviewPaneProps {
  currentText: string;
  originalText?: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: (format: 'markdown' | 'text') => void;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  currentText,
  originalText = '',
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'diff'>('preview');

  const diffParts: DiffPart[] = originalText && originalText !== currentText
    ? computeWordDiff(originalText, currentText)
    : [];

  return (
    <div className="flex flex-col h-full bg-stone-900">
      {/* Pane Header */}
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-sm text-stone-200">Accepted Result & Diff</span>
        </div>

        {/* View mode toggle & Undo/Redo */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last change"
            className="p-1.5 rounded hover:bg-stone-800 disabled:opacity-30 text-stone-300 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-1.5 rounded hover:bg-stone-800 disabled:opacity-30 text-stone-300 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-stone-800 mx-1" />

          <div className="flex bg-stone-950 p-0.5 rounded border border-stone-800">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-0.5 text-xs rounded transition ${
                viewMode === 'preview'
                  ? 'bg-stone-800 text-stone-100 font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Clean
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-2 py-0.5 text-xs rounded transition flex items-center gap-1 ${
                viewMode === 'diff'
                  ? 'bg-amber-900/60 text-amber-200 font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Split className="w-3 h-3" /> Diff
            </button>
          </div>

          <div className="h-4 w-px bg-stone-800 mx-1" />

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExport('markdown')}
              title="Export as Markdown (.md)"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .md
            </button>
            <button
              onClick={() => onExport('text')}
              title="Export as Plain Text (.txt)"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .txt
            </button>
          </div>
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 p-6 overflow-y-auto font-serif text-base text-stone-200 leading-relaxed">
        {viewMode === 'preview' ? (
          <div className="whitespace-pre-wrap select-text">
            {currentText}
          </div>
        ) : (
          <div className="whitespace-pre-wrap select-text leading-relaxed">
            {diffParts.length === 0 ? (
              <span className="text-stone-500 italic font-sans text-sm">
                No diffs active. The current text matches the baseline state.
              </span>
            ) : (
              diffParts.map((part, idx) => {
                if (part.added) {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-950/80 text-emerald-300 px-1 py-0.5 rounded border-b border-emerald-500/60 font-medium"
                    >
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) {
                  return (
                    <span
                      key={idx}
                      className="bg-rose-950/80 text-rose-400 px-1 py-0.5 line-through opacity-70 border-b border-rose-500/60"
                    >
                      {part.value}
                    </span>
                  );
                }
                return <span key={idx}>{part.value}</span>;
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 border-t border-stone-800/60 px-4 flex items-center justify-between text-xs text-stone-500 bg-stone-950/20">
        <span>Accepts apply directly to local draft</span>
        <span>Local diff tracking enabled</span>
      </div>
    </div>
  );
};
