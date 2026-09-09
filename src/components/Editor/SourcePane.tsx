import React, { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react';
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
  Loader2,
  Menu,
  UserPlus,
  Unlink,
  ExternalLink,
  Lightbulb,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Suggestion, LLMSettings, NovelCustomPrompts } from '../../types/index.ts';
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
import { DocumentCategory } from '../../utils/documentType.ts';

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
  diffPaneEnabled?: boolean;
  isSuggestionsCollapsed?: boolean;
  onToggleSuggestionsCollapse?: () => void;
  suggestionsCount?: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onToggleMobileSidebar?: () => void;
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
  customPrompts?: NovelCustomPrompts;
  currentSceneSummary?: string;
  currentSceneSummaryWordCount?: number;
  priorSceneSummaries?: Array<{ title: string; summary: string }>;
  allSceneSummaries?: Array<{ title: string; summary: string }>;
  onOpenSceneSummary?: () => void;
  isCharacterOrWorld?: boolean;
  documentCategory?: DocumentCategory;
  isLoadingCurrentScene?: boolean;
  flashRange?: { start: number; end: number; key: number } | null;
  onTriggerFlash?: (start: number, end: number) => void;
  onAIRewrite?: (instruction: string) => void;
  isGeneratingAI?: boolean;
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
  diffPaneEnabled = true,
  isSuggestionsCollapsed,
  onToggleSuggestionsCollapse,
  suggestionsCount,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onToggleMobileSidebar,
  loreEntries = [],
  loreCharacters = [],
  loreWorld = [],
  onReferenceLore,
  onUnlinkLore,
  onCreateLoreEntry,
  onOpenFile,
  llmSettings,
  customPrompts,
  currentSceneSummary,
  currentSceneSummaryWordCount,
  priorSceneSummaries = [],
  allSceneSummaries = [],
  onOpenSceneSummary,
  isCharacterOrWorld = false,
  documentCategory = 'scene',
  isLoadingCurrentScene = false,
  flashRange,
  onTriggerFlash,
  onAIRewrite,
  isGeneratingAI = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isHoveringTooltipRef = useRef<boolean>(false);

  // Local flash range state for 2-second subtle animation when text is changed/added
  const [localFlashRange, setLocalFlashRange] = useState<{
    start: number;
    end: number;
    key: number;
  } | null>(null);
  const flashTimerRef = useRef<any>(null);

  const triggerFlash = useCallback((start: number, end: number) => {
    if (start >= end) return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    const newFlash = { start, end, key: Date.now() };
    setLocalFlashRange(newFlash);
    onTriggerFlash?.(start, end);
    flashTimerRef.current = setTimeout(() => {
      setLocalFlashRange(null);
    }, 2000);
  }, [onTriggerFlash]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Clear flash state if active file/scene changes
  useEffect(() => {
    setLocalFlashRange(null);
  }, [title]);

  const activeFlash = flashRange || localFlashRange;

  const safeFlash = useMemo(() => {
    if (!activeFlash) return null;
    const start = Math.max(0, Math.min(content.length, activeFlash.start));
    const end = Math.max(0, Math.min(content.length, activeFlash.end));
    if (start >= end) return null;
    return { start, end, key: activeFlash.key };
  }, [activeFlash, content.length]);

  const scrollToTextRange = useCallback((start: number, _end: number) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const textBefore = content.substring(0, start);
    const lines = textBefore.split('\n').length;
    const targetTop = lines * 26;
    const containerHeight = textarea.clientHeight || 400;
    const currentScroll = textarea.scrollTop;

    if (targetTop < currentScroll || targetTop > currentScroll + containerHeight - 60) {
      const targetScrollTop = Math.max(0, targetTop - containerHeight / 3);
      textarea.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }, [content]);

  // Toggle highlight visibility (defaults to true)
  const [showHighlights, setShowHighlights] = useState<boolean>(true);

  // Active reference under cursor
  const [activeCursorRef, setActiveCursorRef] = useState<LoreReferenceMatch | null>(null);

  // Active selected text range
  const [selectedRange, setSelectedRange] = useState<{
    text: string;
    start: number;
    end: number;
    existingRef?: LoreReferenceMatch | null;
  } | null>(null);

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
    startIndex?: number;
    endIndex?: number;
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
      const appendStart = trimmed ? trimmed.length + 2 : 0;
      const newContent = trimmed ? `${trimmed}\n\n${generatedText}` : generatedText;
      const appendEnd = appendStart + generatedText.length;
      onChange(newContent);
      triggerFlash(appendStart, appendEnd);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(appendEnd, appendEnd);
          scrollToTextRange(appendStart, appendEnd);
        }
      }, 50);
    } else {
      const start = generateModal.startIndex;
      const end = generateModal.endIndex;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const newContent = before + generatedText + after;
      const insertEnd = start + generatedText.length;
      onChange(newContent);
      triggerFlash(start, insertEnd);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(insertEnd, insertEnd);
          scrollToTextRange(start, insertEnd);
        }
      }, 50);
    }
  };

  // Keep backdrop scroll in sync with textarea
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Ensure lockstep scroll synchronization on every layout pass
  useLayoutEffect(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  });

  // Direct unlink helper for quick actions
  const handleUnlinkLoreDirect = (start?: number, end?: number) => {
    if (onUnlinkLore && start !== undefined && end !== undefined) {
      onUnlinkLore(start, end);
      setActiveCursorRef(null);
      setHoverTooltip(null);
      setSelectedRange(null);
    }
  };

  // Locate and scroll to reference in editor
  const handleLocateReference = (ref: LoreReferenceMatch) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(ref.startIndex, ref.endIndex);
    onSelectionChange(ref.anchorText, ref.startIndex, ref.endIndex);
    setActiveCursorRef(ref);

    const textBefore = content.substring(0, ref.startIndex);
    const lines = textBefore.split('\n').length;
    const targetTop = lines * 26;
    const containerHeight = textarea.clientHeight || 400;
    const targetScrollTop = Math.max(0, targetTop - containerHeight / 2);

    textarea.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
  };

  const handleSelect = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.slice(start, end);
    onSelectionChange(selected, start, end);

    // Detect if cursor is on or inside an existing reference
    const existingRef = findReferenceAtCursor(content, start, loreEntries) ||
                        (start !== end ? findReferenceAtCursor(content, end, loreEntries) : null);
    setActiveCursorRef(existingRef);

    if (start !== end && selected.trim()) {
      setSelectedRange({ text: selected, start, end, existingRef });
    } else {
      setSelectedRange(null);
    }
  };

  // Hover detection over highlighted spans in the editor
  const handleTextareaMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!backdropRef.current || sceneReferences.length === 0 || !showHighlights) {
      if (hoverTooltip && !isHoveringTooltipRef.current) setHoverTooltip(null);
      return;
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    let foundRef: LoreReferenceMatch | null = null;
    let foundRect: DOMRect | null = null;

    for (let i = 0; i < sceneReferences.length; i++) {
      const el = document.getElementById(`lore-highlight-${sceneReferences[i].startIndex}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left - 2 &&
          clientX <= rect.right + 2 &&
          clientY >= rect.top - 2 &&
          clientY <= rect.bottom + 2
        ) {
          foundRef = sceneReferences[i];
          foundRect = rect;
          break;
        }
      }
    }

    if (foundRef && foundRect) {
      setHoverTooltip({
        entry: foundRef.entry || null,
        anchorText: foundRef.anchorText,
        targetPath: foundRef.targetPath,
        startIndex: foundRef.startIndex,
        endIndex: foundRef.endIndex,
        position: { x: foundRect.left, y: foundRect.bottom },
      });
    } else if (!isHoveringTooltipRef.current) {
      setHoverTooltip(null);
    }
  };

  const handleTextareaMouseLeave = () => {
    setTimeout(() => {
      if (!isHoveringTooltipRef.current) {
        setHoverTooltip(null);
      }
    }, 200);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && hoverTooltip) {
      if (onOpenFile) {
        onOpenFile(hoverTooltip.entry?.path || hoverTooltip.targetPath);
        setHoverTooltip(null);
      }
      return;
    }
    handleSelect();
  };

  // Right-click context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    let start = 0;
    let end = 0;
    let selected = '';

    if (textareaRef.current) {
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
    const hasHighlights = showHighlights && sceneReferences.length > 0;
    const hasSelection = Boolean(selectedRange && selectedRange.start < selectedRange.end);
    if (!hasHighlights && !focusedSuggestion && !safeFlash && !hasSelection) return null;

    // Collect all boundary points to split content into non-overlapping segments
    const pointsSet = new Set<number>([0, content.length]);

    if (safeFlash) {
      pointsSet.add(Math.max(0, Math.min(content.length, safeFlash.start)));
      pointsSet.add(Math.max(0, Math.min(content.length, safeFlash.end)));
    }

    if (focusedSuggestion) {
      pointsSet.add(Math.max(0, Math.min(content.length, focusedSuggestion.startIndex)));
      pointsSet.add(Math.max(0, Math.min(content.length, focusedSuggestion.endIndex)));
    }

    if (hasSelection && selectedRange) {
      pointsSet.add(Math.max(0, Math.min(content.length, selectedRange.start)));
      pointsSet.add(Math.max(0, Math.min(content.length, selectedRange.end)));
    }

    if (hasHighlights) {
      for (const ref of sceneReferences) {
        pointsSet.add(Math.max(0, Math.min(content.length, ref.startIndex)));
        pointsSet.add(Math.max(0, Math.min(content.length, ref.endIndex)));
      }
    }

    const sortedPoints = Array.from(pointsSet).sort((a, b) => a - b);
    const nodes: React.ReactNode[] = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i];
      const end = sortedPoints[i + 1];
      if (start >= end) continue;

      const segText = content.substring(start, end);
      const isFlash = safeFlash ? start >= safeFlash.start && end <= safeFlash.end : false;
      const isFocused = focusedSuggestion ? start >= focusedSuggestion.startIndex && end <= focusedSuggestion.endIndex : false;
      const isSelected = selectedRange ? start >= selectedRange.start && end <= selectedRange.end : false;
      const matchingRef = hasHighlights ? sceneReferences.find(r => start >= r.startIndex && end <= r.endIndex) : undefined;
      const isCursorActive = matchingRef && activeCursorRef && activeCursorRef.startIndex === matchingRef.startIndex;

      if (!isFlash && !isFocused && !matchingRef && !isSelected) {
        nodes.push(
          <span key={`b-plain-${start}-${end}`} className="storyspark-plain-text opacity-0 select-none">
            {segText}
          </span>
        );
        continue;
      }

      // Build classes for highlighted segment - positioned directly behind the text with background fill
      let classes = 'storyspark-highlight select-none text-transparent rounded-xs ';
      if (isFlash) {
        classes += 'ai-changed-flash ';
      }

      if (matchingRef) {
        const isChar = matchingRef.entry ? matchingRef.entry.category === 'character' : matchingRef.targetPath.includes('characters');
        const isIdea = matchingRef.entry ? matchingRef.entry.category === 'idea' : (matchingRef.targetPath.includes('scratchpad') || matchingRef.targetPath.includes('ideas'));
        classes += 'transition-colors ';
        if (isFocused) {
          classes += 'bg-amber-400/40 animate-pulse ring-1 ring-amber-400/60 ';
        } else if (isCursorActive) {
          classes += isChar
            ? 'bg-amber-500/40 ring-1 ring-amber-400/60 '
            : 'bg-cyan-500/40 ring-1 ring-cyan-400/60 ';
        } else {
          classes += isChar
            ? 'bg-amber-500/25 hover:bg-amber-500/35 '
            : isIdea
            ? 'bg-purple-500/25 hover:bg-purple-500/35 '
            : 'bg-cyan-500/25 hover:bg-cyan-500/35 ';
        }
      } else if (isFocused) {
        classes += 'bg-amber-400/40 animate-pulse ring-1 ring-amber-400/60 ';
      } else if (isFlash) {
        // Flash animation styles in index.css handle the glowing background directly behind the text
      } else if (isSelected) {
        classes += 'bg-amber-500/30 ring-1 ring-amber-400/40 ';
      }

      nodes.push(
        <span
          key={`b-seg-${start}-${end}${isFlash ? `-${safeFlash?.key}` : ''}`}
          id={isFlash ? 'ai-flash-changed-text' : (matchingRef ? `lore-highlight-${matchingRef.startIndex}` : undefined)}
          data-start={start}
          data-end={end}
          data-testid={isFlash ? 'ai-changed-flash' : undefined}
          className={classes.trim()}
        >
          {segText}
        </span>
      );
    }

    if (content.endsWith('\n')) {
      nodes.push(
        <span key="b-trailing-newline" className="storyspark-plain-text opacity-0 select-none" aria-hidden="true">
          {' '}
        </span>
      );
    }

    return nodes;
  }, [content, sceneReferences, focusedSuggestion, showHighlights, activeCursorRef, safeFlash, selectedRange]);

  return (
    <div
      className={`flex flex-col h-full w-full flex-1 min-w-0 bg-stone-900 ${
        diffPaneEnabled ? 'border-r border-stone-800' : ''
      } relative`}
      onContextMenu={handleContextMenu}
    >
      {/* Pane Header */}
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40 flex-shrink-0">
        <div className="flex items-center space-x-2 truncate">
          {onToggleMobileSidebar && (
            <button
              id="source-pane-mobile-drawer-btn"
              type="button"
              onClick={onToggleMobileSidebar}
              title="Open Navigation Menu"
              className="flex md:hidden items-center justify-center text-xs text-stone-300 hover:text-amber-300 bg-stone-800 hover:bg-stone-700 p-1.5 rounded transition border border-stone-700/60 mr-1 flex-shrink-0"
            >
              <Menu className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

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

          {isSuggestionsCollapsed && onToggleSuggestionsCollapse && !isCharacterOrWorld && (
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

          {isLoadingCurrentScene && (
            <span
              id="source-pane-loading-indicator"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium ml-1 animate-pulse flex-shrink-0"
            >
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>Loading scene...</span>
            </span>
          )}

          {documentCategory === 'character' && (
            <span className="text-[10px] bg-blue-950/70 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 flex-shrink-0">
              <User className="w-2.5 h-2.5" /> Character
            </span>
          )}
          {documentCategory === 'world' && (
            <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 flex-shrink-0">
              <Compass className="w-2.5 h-2.5" /> World
            </span>
          )}

          {/* Highlight Visibility Toggle */}
          <button
            type="button"
            onClick={() => setShowHighlights((prev) => !prev)}
            className={`ml-2 p-1 rounded text-xs transition border ${
              showHighlights
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700/60'
                : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-400'
            }`}
            title={showHighlights ? 'Lore highlights are visible (click to hide)' : 'Lore highlights hidden (click to show)'}
          >
            {showHighlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {isSaving ? (
            <span className="text-xs text-amber-500 animate-pulse flex items-center gap-1 ml-1">
              <Clock className="w-3 h-3" /> Saving...
            </span>
          ) : (
            <span className="text-[10px] text-stone-500 uppercase tracking-wider ml-1">Synced</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isCharacterOrWorld && onOpenSceneSummary && (
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
          {diffPaneEnabled && isDiffCollapsed && onToggleDiffCollapse && (
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

      {/* Active Cursor Lore Inspector Banner */}
      {activeCursorRef && (
        <div className="bg-stone-900 border-b border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs text-stone-200 flex-shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 truncate">
            {activeCursorRef.entry?.category === 'character' ? (
              <User className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            ) : (
              <Compass className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            )}
            <span className="font-semibold text-amber-300">
              {activeCursorRef.entry?.name || activeCursorRef.anchorText}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60">
              {activeCursorRef.entry?.category || 'lore'}
            </span>
            {activeCursorRef.entry?.summary && (
              <span className="text-stone-400 text-[11px] truncate hidden md:inline max-w-sm">
                — {activeCursorRef.entry.summary}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onOpenFile) {
                  onOpenFile(activeCursorRef.entry?.path || activeCursorRef.targetPath);
                }
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] flex items-center gap-1 transition border border-stone-700/60"
              title="Open profile in Story Bible"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span>View in Bible</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({
                  isOpen: true,
                  x: rect.left,
                  y: rect.bottom + 4,
                  selectedText: activeCursorRef.anchorText,
                  startIndex: activeCursorRef.startIndex,
                  endIndex: activeCursorRef.endIndex,
                  existingReference: activeCursorRef,
                });
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] flex items-center gap-1 transition border border-stone-700/60"
              title="Change or reassign reference"
            >
              <Edit3 className="w-3 h-3 text-cyan-400" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={() => handleUnlinkLoreDirect(activeCursorRef.startIndex, activeCursorRef.endIndex)}
              className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 rounded text-[11px] flex items-center gap-1 transition border border-rose-800/60"
              title="Remove lore assignment from this text"
            >
              <Unlink className="w-3 h-3" />
              <span>Unlink</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCursorRef(null)}
              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200 transition"
              title="Dismiss inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Text Assignment Bar (when text is highlighted and not already on an active reference) */}
      {selectedRange && !activeCursorRef && (
        <div className="bg-stone-950/90 border-b border-amber-900/60 px-4 py-1.5 flex items-center justify-between text-xs text-stone-300 flex-shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 truncate">
            <Tag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-stone-400">Selected:</span>
            <span className="bg-stone-900 px-1.5 py-0.5 rounded font-serif italic text-amber-200 border border-stone-800 truncate max-w-xs">
              "{selectedRange.text.length > 50 ? selectedRange.text.slice(0, 50) + '...' : selectedRange.text}"
            </span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({
                  isOpen: true,
                  x: rect.left,
                  y: rect.bottom + 4,
                  selectedText: selectedRange.text,
                  startIndex: selectedRange.start,
                  endIndex: selectedRange.end,
                  existingReference: selectedRange.existingRef || null,
                });
              }}
              className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-800/60 rounded text-[11px] font-medium flex items-center gap-1 transition"
            >
              <UserPlus className="w-3 h-3 text-amber-400" />
              <span>Assign Character / Lore</span>
            </button>
            {!isCharacterOrWorld && (
              <button
                type="button"
                onClick={() => handleOpenGenerateContent(selectedRange.text, selectedRange.start, selectedRange.end)}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] flex items-center gap-1 transition border border-stone-700/60"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>AI Draft</span>
              </button>
            )}
            {!isCharacterOrWorld && onAIRewrite && (
              <button
                type="button"
                onClick={() => onAIRewrite('Polish and tighten prose while maintaining voice')}
                disabled={isGeneratingAI}
                className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 rounded text-[11px] flex items-center gap-1 transition border border-amber-800/50 disabled:opacity-50"
                title="Rewrite selection with AI"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{isGeneratingAI ? 'Rewriting...' : 'AI Rewrite'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedRange(null)}
              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200 transition"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
                <div
                  key={ref.targetPath}
                  className={`inline-flex items-center rounded text-[11px] border transition flex-shrink-0 ${
                    isChar
                      ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                      : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60'
                  }`}
                >
                  <button
                    type="button"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverTooltip({
                        entry: entry || null,
                        anchorText: ref.anchorText,
                        targetPath: ref.targetPath,
                        startIndex: ref.startIndex,
                        endIndex: ref.endIndex,
                        position: { x: rect.left, y: rect.bottom },
                      });
                    }}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        if (!isHoveringTooltipRef.current) setHoverTooltip(null);
                      }, 150);
                    }}
                    onClick={() => handleLocateReference(ref)}
                    className="px-2 py-0.5 flex items-center gap-1"
                    title="Click to jump to reference in text, hover for summary"
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlinkLoreDirect(ref.startIndex, ref.endIndex);
                    }}
                    className="px-1 py-0.5 hover:bg-rose-900/60 text-stone-400 hover:text-rose-200 border-l border-stone-800/60 rounded-r transition"
                    title={`Unlink ${entry?.name || ref.anchorText}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Body with Integrated Live Highlights and Textarea */}
      <div className="flex-1 relative flex flex-col p-4 overflow-hidden">
        {isLoadingCurrentScene && (
          <div
            id="current-scene-loading-overlay"
            className="absolute inset-0 z-30 bg-stone-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-stone-200">Loading Scene Content</p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs truncate font-mono">
              {title ? title.replace(/\.md$/, '').replace(/^\d+-/, '') : 'Opening scene...'}
            </p>
          </div>
        )}

        <div className="relative w-full h-full">
          {/* Synchronized highlight backdrop */}
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="storyspark-editor-surface storyspark-backdrop absolute inset-0 w-full h-full pointer-events-none select-none block z-0 border-0 m-0 p-0 box-border text-transparent"
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
            onKeyDown={handleScroll}
            onClick={handleTextareaClick}
            onMouseMove={handleTextareaMouseMove}
            onMouseLeave={handleTextareaMouseLeave}
            onScroll={handleScroll}
            placeholder="Start writing your scene in Markdown... Select any text and right-click to reference characters or lore."
            spellCheck={false}
            className="storyspark-editor-surface storyspark-editor-textarea absolute inset-0 w-full h-full bg-transparent resize-none border-none outline-none text-stone-200 placeholder-stone-600 focus:ring-0 z-10 block m-0 p-0 box-border"
          />

          {/* Subtle floating badge when AI changes or adds text */}
          {safeFlash && (
            <div
              id="ai-text-changed-badge"
              data-testid="ai-text-changed-badge"
              className="absolute bottom-3 right-5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none animate-in fade-in duration-150"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>AI text updated</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-8 border-t border-stone-800/60 px-4 flex items-center justify-between text-xs text-stone-500 bg-stone-950/20 flex-shrink-0">
        <span>
          {isCharacterOrWorld
            ? `${documentCategory === 'character' ? 'Character Story Bible profile' : 'World & Lore Story Bible entry'} • Live Lore active`
            : sceneReferences.length > 0
            ? `${sceneReferences.length} lore reference${sceneReferences.length === 1 ? '' : 's'} linked • Hover highlights or select text to manage`
            : 'Select text or right-click to reference characters & lore'}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-amber-500/80 flex items-center gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400" /> Live Editor
          </span>
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
          onUnlink={() => handleUnlinkLoreDirect(hoverTooltip.startIndex, hoverTooltip.endIndex)}
          onMouseEnter={() => {
            isHoveringTooltipRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringTooltipRef.current = false;
            setHoverTooltip(null);
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
        onOpenGenerateContent={isCharacterOrWorld ? undefined : handleOpenGenerateContent}
        onAIRewrite={isCharacterOrWorld ? undefined : onAIRewrite}
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
        isOpen={!isCharacterOrWorld && generateModal.isOpen}
        onClose={() => setGenerateModal((prev) => ({ ...prev, isOpen: false }))}
        selectedText={generateModal.selectedText}
        startIndex={generateModal.startIndex}
        endIndex={generateModal.endIndex}
        surroundingContext={content}
        activeFileName={title}
        llmSettings={llmSettings}
        customPrompts={customPrompts}
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
