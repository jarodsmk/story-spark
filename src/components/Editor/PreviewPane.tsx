import React, { useState } from 'react';
import { Eye, Undo2, Redo2, Split, Download, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { computeWordDiff, DiffPart } from '../../engine/diff/index.ts';
import { Suggestion } from '../../types/index.ts';
import { LoreEntry } from '../../engine/lore/loreReference.ts';
import { LoreTextRenderer } from './LoreTextRenderer.tsx';
import { LoreHoverTooltip } from './LoreHoverTooltip.tsx';
import { DocumentCategory } from '../../utils/documentType.ts';

interface PreviewPaneProps {
  currentText: string;
  originalText?: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: (format: 'markdown' | 'text') => void;
  focusedSuggestion?: Suggestion | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  loreEntries?: LoreEntry[];
  onOpenFile?: (path: string) => void;
  isCharacterOrWorld?: boolean;
  documentCategory?: DocumentCategory;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  currentText,
  originalText = '',
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  focusedSuggestion,
  isCollapsed = false,
  onToggleCollapse,
  loreEntries = [],
  onOpenFile,
  isCharacterOrWorld = false,
  documentCategory = 'scene',
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'diff'>('preview');

  // Hover Tooltip state
  const [hoverTooltip, setHoverTooltip] = useState<{
    entry?: LoreEntry | null;
    anchorText: string;
    targetPath: string;
    position: { x: number; y: number };
  } | null>(null);

  const diffParts: DiffPart[] = originalText && originalText !== currentText
    ? computeWordDiff(originalText, currentText)
    : [];

  const activeChangesCount = diffParts.filter(d => d.added || d.removed).length;

  if (isCollapsed) {
    return (
      <aside
        aria-label="Accepted Result & Diff (Collapsed)"
        className="h-full bg-stone-900 border-l border-stone-800 flex flex-col items-center justify-between py-3 w-11 flex-shrink-0 select-none transition-all"
      >
        <div className="flex flex-col items-center space-y-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Accepted Result & Diff pane"
            className="p-2 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last change"
            className="p-1.5 rounded hover:bg-stone-800 disabled:opacity-20 text-stone-400 hover:text-stone-200 transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-1.5 rounded hover:bg-stone-800 disabled:opacity-20 text-stone-400 hover:text-stone-200 transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-4 h-px bg-stone-800 my-1" />

          {/* Vertical rotated label */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="group py-4 px-1 flex items-center justify-center cursor-pointer transition hover:bg-stone-800/40 rounded"
            title="Click to expand Accepted Result & Diff pane"
          >
            <span
              className="text-[11px] font-medium tracking-wider uppercase whitespace-nowrap text-stone-400 group-hover:text-amber-300 transition"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Result & Diff
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          {activeChangesCount > 0 && (
            <span
              title={`${activeChangesCount} active changes from baseline`}
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            />
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand pane"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-emerald-400 transition"
          >
            <Eye className="w-4 h-4 text-emerald-500/80" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Accepted Result & Diff"
      className="flex flex-col h-full bg-stone-900 border-l border-stone-800 relative"
    >
      {/* Pane Header */}
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40 flex-shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <Eye className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="font-medium text-sm text-stone-200 truncate">Accepted Result & Diff</span>
          {activeChangesCount > 0 && (
            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono hidden xl:inline">
              {activeChangesCount} {activeChangesCount === 1 ? 'diff' : 'diffs'}
            </span>
          )}
        </div>

        {/* View mode toggle & Undo/Redo */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last change"
            className="p-1.5 rounded hover:bg-stone-800 disabled:opacity-30 text-stone-300 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
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
              type="button"
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
              type="button"
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
              type="button"
              onClick={() => onExport('markdown')}
              title="Export as Markdown (.md)"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .md
            </button>
            <button
              type="button"
              onClick={() => onExport('text')}
              title="Export as Plain Text (.txt)"
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .txt
            </button>
          </div>

          {/* Collapse Button */}
          {onToggleCollapse && (
            <>
              <div className="h-4 w-px bg-stone-800 mx-1" />
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse Accepted Result & Diff pane"
                className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 p-6 overflow-y-auto font-serif text-base text-stone-200 leading-relaxed">
        {viewMode === 'preview' ? (
          <div className="select-text">
            {focusedSuggestion &&
            focusedSuggestion.startIndex >= 0 &&
            focusedSuggestion.endIndex <= currentText.length &&
            focusedSuggestion.startIndex < focusedSuggestion.endIndex ? (
              <div className="whitespace-pre-wrap select-text">
                <span>{currentText.substring(0, focusedSuggestion.startIndex)}</span>
                <mark className="bg-amber-500/25 text-amber-200 border-b-2 border-amber-400/80 px-0.5 rounded animate-pulse">
                  {currentText.substring(focusedSuggestion.startIndex, focusedSuggestion.endIndex)}
                </mark>
                <span>{currentText.substring(focusedSuggestion.endIndex)}</span>
              </div>
            ) : (
              <LoreTextRenderer
                text={currentText}
                entries={loreEntries}
                onHoverReference={(ref, pos) => {
                  setHoverTooltip({
                    entry: ref.entry || null,
                    anchorText: ref.anchorText,
                    targetPath: ref.targetPath,
                    position: pos,
                  });
                }}
                onLeaveReference={() => setHoverTooltip(null)}
                onClickReference={(ref) => {
                  if (onOpenFile) {
                    onOpenFile(ref.entry?.path || ref.targetPath);
                  }
                }}
                focusedSuggestion={focusedSuggestion}
              />
            )}
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

      {/* Floating Hover Tooltip */}
      {hoverTooltip && (
        <LoreHoverTooltip
          entry={hoverTooltip.entry}
          anchorText={hoverTooltip.anchorText}
          targetPath={hoverTooltip.targetPath}
          position={hoverTooltip.position}
          onOpenEntry={(path) => {
            setHoverTooltip(null);
            if (onOpenFile) onOpenFile(path);
          }}
        />
      )}

      {/* Footer Info */}
      <div className="h-8 border-t border-stone-800/60 px-4 flex items-center justify-between text-xs text-stone-500 bg-stone-950/20 flex-shrink-0">
        <span>Clean manuscript view with Lore highlights</span>
        <span>Hover references for summaries</span>
      </div>
    </aside>
  );
};
