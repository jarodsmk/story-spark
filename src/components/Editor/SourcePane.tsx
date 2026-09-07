import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  Crosshair,
  Check,
  X,
  PanelRightOpen,
  PanelLeftOpen,
  Edit3,
  Sparkles,
  User,
  Compass,
  Tag,
} from 'lucide-react';
import { Suggestion, LLMSettings } from '../../types/index.ts';
import {
  LoreEntry,
  findLoreReferences,
  LoreReferenceMatch,
  findWordBoundariesAtCursor,
  findReferenceAtCursor,
} from '../../engine/lore/loreReference.ts';
import { LoreContextMenu } from './LoreContextMenu.tsx';
import { LoreHoverTooltip } from './LoreHoverTooltip.tsx';
import { NewLoreModal } from './NewLoreModal.tsx';
import { LoreTextRenderer } from './LoreTextRenderer.tsx';
import { GenerateContentModal } from './GenerateContentModal.tsx';

interface SourcePaneProps {
  content: string;
  onChange: (value: string) => void;
  onSelectionChange: (selectedText: string, start: number, end: number) => void;
  title: string;
  isSaving: boolean;
  wordCount: number;
  focusedSuggestion?: Suggestion | null;
  onClearFocus?: () => void;
  onAcceptSuggestion?: (suggestion: Suggestion) => void;
  onDismissSuggestion?: (suggestion: Suggestion) => void;
  isDiffCollapsed?: boolean;
  onToggleDiffCollapse?: () => void;
  isSuggestionsCollapsed?: boolean;
  onToggleSuggestionsCollapse?: () => void;
  suggestionsCount?: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  loreEntries?: LoreEntry[];
  loreCharacters?: LoreEntry[];
  loreWorld?: LoreEntry[];
  onReferenceLore?: (targetPath: string, start: number, end: number) => void;
  onUnlinkLore?: (start: number, end: number) => void;
  onCreateLoreEntry?: (
    name: string,
    category: 'character' | 'world',
    details: { roleOrAtmosphere: string; summary: string }
  ) => Promise<LoreEntry>;
  onOpenFile?: (path: string) => void;
  llmSettings?: LLMSettings;
  currentSceneSummary?: string;
  currentSceneSummaryWordCount?: number;
  priorSceneSummaries?: Array<{ title: string; summary: string }>;
  allSceneSummaries?: Array<{ title: string; summary: string }>;
  onOpenSceneSummary?: () => void;
}

export const SourcePane: React.FC<SourcePaneProps> = ({
  content,
  onChange,
  onSelectionChange,
  title,
  isSaving,
  wordCount,
  focusedSuggestion,
  onClearFocus,
  onAcceptSuggestion,
  onDismissSuggestion,
  isDiffCollapsed,
  onToggleDiffCollapse,
  isSuggestionsCollapsed,
  onToggleSuggestionsCollapse,
  suggestionsCount,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  loreEntries = [],
  loreCharacters = [],
  loreWorld = [],
  onReferenceLore,
  onUnlinkLore,
  onCreateLoreEntry,
  onOpenFile,
  llmSettings,
  currentSceneSummary,
  currentSceneSummaryWordCount,
  priorSceneSummaries = [],
  allSceneSummaries = [],
  onOpenSceneSummary,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'edit' | 'live'>('edit');

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    selectedText: string;
    startIndex: number;
    endIndex: number;
    existingReference?: LoreReferenceMatch | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    selectedText: '',
    startIndex: 0,
    endIndex: 0,
    existingReference: null,
  });

  // Hover Tooltip state
  const [hoverTooltip, setHoverTooltip] = useState<{
    entry?: LoreEntry | null;
    anchorText: string;
    targetPath: string;
    position: { x: number; y: number };
  } | null>(null);

  // New Lore Modal state
  const [newLoreModal, setNewLoreModal] = useState<{
    isOpen: boolean;
    category: 'character' | 'world';
    defaultName: string;
    startIndex: number;
    endIndex: number;
  }>({
    isOpen: false,
    category: 'character',
    defaultName: '',
    startIndex: 0,
    endIndex: 0,
  });

  // Generate Content Modal state
  const [generateModal, setGenerateModal] = useState<{
    isOpen: boolean;
    selectedText: string;
    startIndex: number;
    endIndex: number;
  }>({
    isOpen: false,
    selectedText: '',
    startIndex: 0,
    endIndex: 0,
  });

  const handleOpenGenerateContent = (
    selectedText: string,
    startIndex: number,
    endIndex: number
  ) => {
    setGenerateModal({
      isOpen: true,
      selectedText,
      startIndex,
      endIndex,
    });
  };

  const handleInsertGeneratedContent = (
    generatedText: string,
    mode: 'replace-or-cursor' | 'append'
  ) => {
    if (mode === 'append') {
      const trimmed = content.trimEnd();
      const newContent = trimmed ? `${trimmed}\n\n${generatedText}` : generatedText;
      onChange(newContent);
    } else {
      const start = generateModal.startIndex;
      const end = generateModal.endIndex;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const newContent = before + generatedText + after;
      onChange(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + generatedText.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 50);
    }
  };

  // Keep backdrop scroll in sync with textarea
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleSelect = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.slice(start, end);
    onSelectionChange(selected, start, end);
  };

  // Right-click context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    let start = 0;
    let end = 0;
    let selected = '';

    if (viewMode === 'edit' && textareaRef.current) {
      start = textareaRef.current.selectionStart;
      end = textareaRef.current.selectionEnd;
      selected = content.slice(start, end);

      // If no text selected, select word under cursor
      if (start === end) {
        const bounds = findWordBoundariesAtCursor(content, start);
        if (bounds.word) {
          start = bounds.start;
          end = bounds.end;
          selected = bounds.word;
          textareaRef.current.setSelectionRange(start, end);
          onSelectionChange(selected, start, end);
        }
      }
    } else {
      // In live view mode, read window selection
      const winSelection = window.getSelection();
      selected = winSelection ? winSelection.toString().trim() : '';
      if (selected) {
        const idx = content.indexOf(selected);
        if (idx !== -1) {
          start = idx;
          end = idx + selected.length;
        }
      }
    }

    if (!selected) {
      selected = 'Selected Passage';
    }

    const existingRef = findReferenceAtCursor(content, start, loreEntries);

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      selectedText: selected,
      startIndex: start,
      endIndex: end,
      existingReference: existingRef,
    });
  };

  // Select reference from context menu
  const handleSelectReference = (targetPath: string) => {
    if (onReferenceLore) {
      onReferenceLore(targetPath, contextMenu.startIndex, contextMenu.endIndex);
    }
  };

  // Unlink reference
  const handleUnlink = () => {
    if (onUnlinkLore) {
      onUnlinkLore(contextMenu.startIndex, contextMenu.endIndex);
    }
  };

  // Open modal to add new character or lore entry
  const handleOpenNewModal = (category: 'character' | 'world') => {
    setNewLoreModal({
      isOpen: true,
      category,
      defaultName: contextMenu.selectedText || '',
      startIndex: contextMenu.startIndex,
      endIndex: contextMenu.endIndex,
    });
  };

  // Submit new entry creation
  const handleCreateEntrySubmit = async (
    name: string,
    category: 'character' | 'world',
    details: { roleOrAtmosphere: string; summary: string }
  ) => {
    if (onCreateLoreEntry) {
      const created = await onCreateLoreEntry(name, category, details);
      if (created && onReferenceLore) {
        onReferenceLore(created.path, newLoreModal.startIndex, newLoreModal.endIndex);
      }
    }
  };

  // When focusedSuggestion changes, navigate the central text viewing pane to that area
  useEffect(() => {
    if (!focusedSuggestion || !textareaRef.current) return;
    const { startIndex, endIndex } = focusedSuggestion;
    if (startIndex < 0 || endIndex > content.length || startIndex > endIndex) return;

    const textarea = textareaRef.current;

    try {
      textarea.focus();
      textarea.setSelectionRange(startIndex, endIndex);
      const selected = content.slice(startIndex, endIndex);
      onSelectionChange(selected, startIndex, endIndex);
    } catch {
      // Ignore focus errors
    }

    const textBefore = content.substring(0, startIndex);
    let targetTop = 0;
    let targetHeight = 24;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && textarea.clientWidth > 0) {
      try {
        const computed = window.getComputedStyle(textarea);
        const mirror = document.createElement('div');
        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.pointerEvents = 'none';
        mirror.style.top = '-99999px';
        mirror.style.left = '-99999px';
        mirror.style.width = `${textarea.clientWidth}px`;
        mirror.style.fontFamily = computed.fontFamily;
        mirror.style.fontSize = computed.fontSize;
        mirror.style.fontWeight = computed.fontWeight;
        mirror.style.lineHeight = computed.lineHeight;
        mirror.style.letterSpacing = computed.letterSpacing;
        mirror.style.padding = computed.padding;
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordBreak = 'break-word';
        mirror.style.overflowWrap = 'break-word';
        mirror.style.boxSizing = computed.boxSizing;

        const beforeSpan = document.createElement('span');
        beforeSpan.textContent = textBefore;

        const targetSpan = document.createElement('span');
        targetSpan.id = 'mirror-target';
        targetSpan.textContent = content.substring(startIndex, endIndex);

        mirror.appendChild(beforeSpan);
        mirror.appendChild(targetSpan);
        document.body.appendChild(mirror);

        targetTop = targetSpan.offsetTop;
        targetHeight = targetSpan.offsetHeight || 24;

        document.body.removeChild(mirror);
      } catch {
        const lines = textBefore.split('\n').length;
        targetTop = lines * 26;
      }
    } else {
      const lines = textBefore.split('\n').length;
      targetTop = lines * 26;
    }

    const containerHeight = textarea.clientHeight || 400;
    const targetScrollTop = Math.max(0, targetTop - containerHeight / 2 + targetHeight / 2);

    textarea.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
  }, [focusedSuggestion, content, onSelectionChange]);

  // Find all active lore references in this scene
  const sceneReferences = useMemo(
    () => findLoreReferences(content, loreEntries),
    [content, loreEntries]
  );

  // Group unique referenced entries for scene pill bar
  const uniqueReferencedEntries = useMemo(() => {
    const map = new Map<string, { entry?: LoreEntry; ref: LoreReferenceMatch; count: number }>();
    for (const ref of sceneReferences) {
      const key = ref.targetPath;
      if (!map.has(key)) {
        map.set(key, { entry: ref.entry, ref, count: 1 });
      } else {
        map.get(key)!.count++;
      }
    }
    return Array.from(map.values());
  }, [sceneReferences]);

  // Render backdrop segments with subtle highlights for raw editor view
  const backdropElements = useMemo(() => {
    if (sceneReferences.length === 0) return null;

    const nodes: React.ReactNode[] = [];
    let lastIdx = 0;

    for (let i = 0; i < sceneReferences.length; i++) {
      const ref = sceneReferences[i];
      if (ref.startIndex > lastIdx) {
        nodes.push(
          <span key={`b-text-${lastIdx}`} className="opacity-0">
            {content.substring(lastIdx, ref.startIndex)}
          </span>
        );
      }

      const isChar = ref.entry ? ref.entry.category === 'character' : ref.targetPath.includes('characters');
      nodes.push(
        <span
          key={`b-ref-${ref.startIndex}`}
          className={`rounded border-b px-0.5 select-none ${
            isChar
              ? 'bg-amber-500/20 border-amber-400/70 text-transparent'
              : 'bg-cyan-500/20 border-cyan-400/70 text-transparent'
          }`}
        >
          {ref.raw}
        </span>
      );

      lastIdx = ref.endIndex;
    }

    if (lastIdx < content.length) {
      nodes.push(
        <span key={`b-tail`} className="opacity-0">
          {content.substring(lastIdx)}
        </span>
      );
    }

    return nodes;
  }, [content, sceneReferences]);

  return (
    <div
      className="flex flex-col h-full bg-stone-900 border-r border-stone-800 relative"
      onContextMenu={handleContextMenu}
    >
      {/* Pane Header */}
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40 flex-shrink-0">
        <div className="flex items-center space-x-2 truncate">
          {isSidebarCollapsed && onToggleSidebarCollapse && (
            <button
              id="source-pane-show-sidebar-btn"
              type="button"
              onClick={onToggleSidebarCollapse}
              title="Expand Left Menu (Ctrl+B)"
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-300 bg-stone-800/80 hover:bg-stone-800 px-2 py-0.5 rounded transition border border-stone-700/50 mr-1 flex-shrink-0"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}

          {isSuggestionsCollapsed && onToggleSuggestionsCollapse && (
            <button
              id="source-pane-show-suggestions-btn"
              type="button"
              onClick={onToggleSuggestionsCollapse}
              title="Expand Suggestions & Passes pane (Ctrl+[)"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 bg-stone-800/80 hover:bg-stone-800 px-2 py-0.5 rounded transition border border-stone-700/50 mr-1 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Suggestions</span>
              {suggestionsCount !== undefined && suggestionsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 px-1 rounded-full border border-amber-800/60">
                  {suggestionsCount}
                </span>
              )}
            </button>
          )}

          <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="font-medium text-sm text-stone-200 truncate">{title}</span>

          {/* Mode Switcher: Edit vs Live & Lore */}
          <div className="flex bg-stone-950 p-0.5 rounded border border-stone-800 ml-2">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2 py-0.5 text-xs rounded transition flex items-center gap-1 ${
                viewMode === 'edit'
                  ? 'bg-stone-800 text-stone-100 font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Markdown text editing mode"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('live')}
              className={`px-2 py-0.5 text-xs rounded transition flex items-center gap-1 ${
                viewMode === 'live'
                  ? 'bg-amber-950/70 text-amber-200 font-medium border border-amber-800/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Interactive Lore & character view with tooltips"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Live & Lore</span>
              {sceneReferences.length > 0 && (
                <span className="ml-0.5 px-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                  {sceneReferences.length}
                </span>
              )}
            </button>
          </div>

          {isSaving ? (
            <span className="text-xs text-amber-500 animate-pulse flex items-center gap-1 ml-1">
              <Clock className="w-3 h-3" /> Saving...
            </span>
          ) : (
            <span className="text-[10px] text-stone-500 uppercase tracking-wider ml-1">Synced</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onOpenSceneSummary && (
            <button
              id="source-pane-summarize-scene-btn"
              type="button"
              onClick={onOpenSceneSummary}
              title={
                currentSceneSummary
                  ? `Scene Summary (${currentSceneSummaryWordCount || 'active'} words) - Click to view/edit`
                  : 'Generate Scene Summary for LLM Context'
              }
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition border ${
                currentSceneSummary
                  ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-800/80 hover:bg-stone-800 border-stone-700/50'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">
                {currentSceneSummary ? 'Summary' : 'Summarize'}
              </span>
            </button>
          )}
          <div className="text-xs text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded font-mono">
            {wordCount} words
          </div>
          {isDiffCollapsed && onToggleDiffCollapse && (
            <button
              type="button"
              onClick={onToggleDiffCollapse}
              title="Expand Accepted Result & Diff pane"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 bg-stone-800/80 hover:bg-stone-800 px-2 py-0.5 rounded transition border border-stone-700/50"
            >
              <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Show Diff</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Focus Indicator Banner */}
      {focusedSuggestion && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200 flex-shrink-0">
          <div className="flex items-center space-x-2 truncate">
            <Crosshair className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="font-semibold text-amber-300">Focusing:</span>
            <span className="bg-stone-900/90 text-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px] truncate border border-stone-800 max-w-[180px]">
              "{focusedSuggestion.originalText}"
            </span>
            <span className="text-amber-400/80 text-[11px] truncate hidden sm:inline">
              ({focusedSuggestion.title})
            </span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {onAcceptSuggestion && (
              <button
                type="button"
                onClick={() => onAcceptSuggestion(focusedSuggestion)}
                className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded font-medium flex items-center gap-1 text-[11px] shadow-sm transition"
              >
                <Check className="w-3 h-3" /> Apply Fix
              </button>
            )}
            {onDismissSuggestion && (
              <button
                type="button"
                onClick={() => onDismissSuggestion(focusedSuggestion)}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] transition"
              >
                Dismiss
              </button>
            )}
            {onClearFocus && (
              <button
                type="button"
                onClick={onClearFocus}
                title="Clear navigation focus"
                className="p-1 hover:bg-amber-900/60 rounded text-amber-300/80 hover:text-amber-200 transition ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scene Lore & Characters Bar (Interactive Pills) */}
      {uniqueReferencedEntries.length > 0 && (
        <div className="bg-stone-950/50 border-b border-stone-800/80 px-4 py-1.5 flex items-center space-x-2 text-xs overflow-x-auto flex-shrink-0">
          <span className="text-[11px] text-stone-500 flex items-center gap-1 flex-shrink-0">
            <Tag className="w-3 h-3 text-amber-400" /> Lore in Scene:
          </span>
          <div className="flex items-center space-x-1.5 flex-nowrap">
            {uniqueReferencedEntries.map(({ entry, ref, count }) => {
              const isChar = entry ? entry.category === 'character' : ref.targetPath.includes('characters');
              return (
                <button
                  key={ref.targetPath}
                  type="button"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoverTooltip({
                      entry: entry || null,
                      anchorText: ref.anchorText,
                      targetPath: ref.targetPath,
                      position: { x: rect.left, y: rect.bottom },
                    });
                  }}
                  onMouseLeave={() => setHoverTooltip(null)}
                  onClick={() => {
                    if (onOpenFile) {
                      onOpenFile(entry?.path || ref.targetPath);
                    }
                  }}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 text-[11px] border transition flex-shrink-0 ${
                    isChar
                      ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                      : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60'
                  }`}
                  title="Hover for summary, click to view in Story Bible"
                >
                  {isChar ? (
                    <User className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Compass className="w-3 h-3 text-cyan-400" />
                  )}
                  <span>{entry?.name || ref.anchorText}</span>
                  {count > 1 && (
                    <span className="text-[9px] opacity-70 font-mono">×{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 relative flex flex-col p-4 overflow-hidden">
        {viewMode === 'edit' ? (
          <div className="relative w-full h-full">
            {/* Synchronized highlight backdrop */}
            <div
              ref={backdropRef}
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none overflow-hidden font-serif text-base leading-relaxed tracking-wide select-none whitespace-pre-wrap break-words"
            >
              {backdropElements}
            </div>

            {/* Editable Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onSelect={handleSelect}
              onKeyUp={handleSelect}
              onScroll={handleScroll}
              placeholder="Start writing your scene in Markdown... Select any text and right-click to reference characters or lore."
              spellCheck={false}
              className="w-full h-full bg-transparent resize-none border-none outline-none font-serif text-stone-200 text-base leading-relaxed tracking-wide placeholder-stone-600 focus:ring-0 overflow-y-auto relative z-10"
            />
          </div>
        ) : (
          /* Live & Lore Interactive Mode */
          <div className="w-full h-full overflow-y-auto pr-2 text-stone-200 text-base font-serif leading-relaxed">
            <LoreTextRenderer
              text={content}
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
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 border-t border-stone-800/60 px-4 flex items-center justify-between text-xs text-stone-500 bg-stone-950/20 flex-shrink-0">
        <span>
          {sceneReferences.length > 0
            ? `${sceneReferences.length} lore reference${sceneReferences.length === 1 ? '' : 's'} linked • Right-click text to link`
            : 'Select text and right-click to reference characters & lore'}
        </span>
        <span>
          {viewMode === 'live' ? 'Interactive view active' : 'Markdown editor active'}
        </span>
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

      {/* Context Menu for Lore Referencing & AI Content Generation */}
      <LoreContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        selectedText={contextMenu.selectedText}
        startIndex={contextMenu.startIndex}
        endIndex={contextMenu.endIndex}
        existingReference={contextMenu.existingReference}
        characters={loreCharacters}
        loreItems={loreWorld}
        onSelectReference={handleSelectReference}
        onOpenNewModal={handleOpenNewModal}
        onOpenGenerateContent={handleOpenGenerateContent}
        onUnlinkReference={handleUnlink}
        onOpenBibleFile={(path) => {
          if (onOpenFile) onOpenFile(path);
        }}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* New Character or Lore Entry Modal */}
      <NewLoreModal
        isOpen={newLoreModal.isOpen}
        initialCategory={newLoreModal.category}
        defaultName={newLoreModal.defaultName}
        onSubmit={handleCreateEntrySubmit}
        onClose={() => setNewLoreModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* AI Generate Content Modal */}
      <GenerateContentModal
        isOpen={generateModal.isOpen}
        onClose={() => setGenerateModal((prev) => ({ ...prev, isOpen: false }))}
        selectedText={generateModal.selectedText}
        startIndex={generateModal.startIndex}
        endIndex={generateModal.endIndex}
        surroundingContext={content}
        activeFileName={title}
        llmSettings={llmSettings}
        priorSceneSummaries={priorSceneSummaries}
        currentSceneSummary={currentSceneSummary}
        allSceneSummaries={allSceneSummaries}
        loreCharacters={loreCharacters}
        loreWorld={loreWorld}
        loreEntries={loreEntries}
        onInsertContent={handleInsertGeneratedContent}
      />
    </div>
  );
};
