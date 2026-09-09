import React, { useState, useEffect, useRef } from 'react';
import { Menu, FileText, Sparkles, Columns } from 'lucide-react';
import { SourcePane } from './SourcePane.tsx';
import { SuggestionsPane } from './SuggestionsPane.tsx';
import { PreviewPane } from './PreviewPane.tsx';
import { PanelResizer } from '../Common/PanelResizer.tsx';
import { Suggestion, LLMSettings, NovelCustomPrompts } from '../../types/index.ts';
import { LoreEntry } from '../../engine/lore/loreReference.ts';
import { DocumentCategory } from '../../utils/documentType.ts';

interface EditorContainerProps {
  content: string;
  onContentChange: (v: string) => void;
  activeFileName: string;
  isSaving: boolean;
  wordCount: number;
  suggestions: Suggestion[];
  onAcceptSuggestion: (s: Suggestion) => void;
  onDismissSuggestion: (s: Suggestion) => void;
  onIgnoreTerm: (term: string) => void;
  selectedText: string;
  onSelectionChange: (t: string, s: number, e: number) => void;
  onAIRewrite: (inst: string) => void;
  isGeneratingAI: boolean;
  aiError: string | null;
  baselineContent: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: (f: 'markdown' | 'text') => void;
  onRunAIPass?: (passType: string, instruction?: string, scope?: 'scene' | 'selection') => Promise<void>;
  onAcceptAllAI?: () => void;
  onClearAI?: () => void;
  isAnalyzingAI?: boolean;
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
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onToggleMobileSidebar?: () => void;
  isCharacterOrWorld?: boolean;
  documentCategory?: DocumentCategory;
  isLoadingCurrentScene?: boolean;
  sidebarWidth?: number;
  diffPaneEnabled?: boolean;
  flashRange?: { start: number; end: number; key: number } | null;
  onTriggerFlash?: (start: number, end: number) => void;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
  content,
  onContentChange,
  activeFileName,
  isSaving,
  wordCount,
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onIgnoreTerm,
  selectedText,
  onSelectionChange,
  onAIRewrite,
  isGeneratingAI,
  aiError,
  baselineContent,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onRunAIPass,
  onAcceptAllAI,
  onClearAI,
  isAnalyzingAI,
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
  priorSceneSummaries,
  allSceneSummaries,
  onOpenSceneSummary,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onToggleMobileSidebar,
  isCharacterOrWorld = false,
  documentCategory = 'scene',
  isLoadingCurrentScene = false,
  sidebarWidth = 240,
  diffPaneEnabled = true,
  flashRange,
  onTriggerFlash,
}) => {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'suggestions' | 'preview'>('editor');

  // Fallback away from diff tab if disabled while selected
  useEffect(() => {
    if (!diffPaneEnabled && activeMobileTab === 'preview') {
      setActiveMobileTab('editor');
    }
  }, [diffPaneEnabled, activeMobileTab]);

  // Dispatch a window resize event when diffPaneEnabled changes so layout and observers recalculate
  useEffect(() => {
    try {
      window.dispatchEvent(new Event('resize'));
    } catch {}
  }, [diffPaneEnabled]);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  const [isDiffCollapsed, setIsDiffCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('story_spark_diff_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('story_spark_suggestions_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const DEFAULT_SUGGESTIONS_WIDTH = 320;
  const [suggestionsWidth, setSuggestionsWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('story_spark_suggestions_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 550) return parsed;
      }
    } catch {}
    return DEFAULT_SUGGESTIONS_WIDTH;
  });

  const DEFAULT_PREVIEW_WIDTH = 380;
  const [previewWidth, setPreviewWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('story_spark_diff_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 240 && parsed <= 650) return parsed;
      }
    } catch {}
    return DEFAULT_PREVIEW_WIDTH;
  });

  const [isSuggestionsDragging, setIsSuggestionsDragging] = useState<boolean>(false);
  const [isDiffDragging, setIsDiffDragging] = useState<boolean>(false);

  const initialSuggestionsWidthRef = useRef<number>(suggestionsWidth);
  const initialPreviewWidthRef = useRef<number>(previewWidth);

  const handleSuggestionsResizeStart = () => {
    setIsSuggestionsDragging(true);
    initialSuggestionsWidthRef.current = suggestionsWidth;
  };

  const handleSuggestionsResize = (deltaX: number) => {
    const min = 220;
    const effectiveSidebar = isSidebarCollapsed ? 48 : sidebarWidth;
    const effectivePreview = !diffPaneEnabled ? 0 : isDiffCollapsed ? 44 : previewWidth;
    const maxAvailable = Math.max(min, window.innerWidth - effectiveSidebar - effectivePreview - 320);
    const max = Math.min(550, maxAvailable);
    const newWidth = Math.max(min, Math.min(max, Math.round(initialSuggestionsWidthRef.current + deltaX)));
    setSuggestionsWidth(newWidth);
  };

  const handleSuggestionsResizeEnd = () => {
    setIsSuggestionsDragging(false);
    try {
      localStorage.setItem('story_spark_suggestions_width', String(suggestionsWidth));
    } catch {}
  };

  const handleSuggestionsReset = () => {
    setSuggestionsWidth(DEFAULT_SUGGESTIONS_WIDTH);
    try {
      localStorage.setItem('story_spark_suggestions_width', String(DEFAULT_SUGGESTIONS_WIDTH));
    } catch {}
  };

  const handleSuggestionsStep = (step: number) => {
    setSuggestionsWidth((prev) => {
      const min = 220;
      const effectiveSidebar = isSidebarCollapsed ? 48 : sidebarWidth;
      const effectivePreview = !diffPaneEnabled ? 0 : isDiffCollapsed ? 44 : previewWidth;
      const maxAvailable = Math.max(min, window.innerWidth - effectiveSidebar - effectivePreview - 320);
      const max = Math.min(550, maxAvailable);
      const next = Math.max(min, Math.min(max, prev + step));
      try {
        localStorage.setItem('story_spark_suggestions_width', String(next));
      } catch {}
      return next;
    });
  };

  const handlePreviewResizeStart = () => {
    setIsDiffDragging(true);
    initialPreviewWidthRef.current = previewWidth;
  };

  const handlePreviewResize = (deltaX: number) => {
    const min = 240;
    const effectiveSidebar = isSidebarCollapsed ? 48 : sidebarWidth;
    const effectiveSuggestions = isSuggestionsCollapsed ? 44 : suggestionsWidth;
    const maxAvailable = Math.max(min, window.innerWidth - effectiveSidebar - effectiveSuggestions - 320);
    const max = Math.min(650, maxAvailable);
    // Dragging left (negative deltaX) should expand preview width
    const newWidth = Math.max(min, Math.min(max, Math.round(initialPreviewWidthRef.current - deltaX)));
    setPreviewWidth(newWidth);
  };

  const handlePreviewResizeEnd = () => {
    setIsDiffDragging(false);
    try {
      localStorage.setItem('story_spark_diff_width', String(previewWidth));
    } catch {}
  };

  const handlePreviewReset = () => {
    setPreviewWidth(DEFAULT_PREVIEW_WIDTH);
    try {
      localStorage.setItem('story_spark_diff_width', String(DEFAULT_PREVIEW_WIDTH));
    } catch {}
  };

  const handlePreviewStep = (step: number) => {
    setPreviewWidth((prev) => {
      const min = 240;
      const effectiveSidebar = isSidebarCollapsed ? 48 : sidebarWidth;
      const effectiveSuggestions = isSuggestionsCollapsed ? 44 : suggestionsWidth;
      const maxAvailable = Math.max(min, window.innerWidth - effectiveSidebar - effectiveSuggestions - 320);
      const max = Math.min(650, maxAvailable);
      // ArrowRight shrinks preview, ArrowLeft expands preview
      const next = Math.max(min, Math.min(max, prev + step));
      try {
        localStorage.setItem('story_spark_diff_width', String(next));
      } catch {}
      return next;
    });
  };

  // Track window size for mobile breakpoint responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleDiffCollapse = () => {
    setIsDiffCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('story_spark_diff_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleToggleSuggestionsCollapse = () => {
    setIsSuggestionsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('story_spark_suggestions_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+\ or Cmd+\ to quickly toggle Diff pane, Ctrl+[ or Cmd+[ for Suggestions pane
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        handleToggleDiffCollapse();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === ']')) {
        e.preventDefault();
        handleToggleSuggestionsCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset focus when scene/file changes
  useEffect(() => {
    setSelectedSuggestionId(null);
  }, [activeFileName]);

  // Keep focusedSuggestion up to date with the latest suggestions list
  const focusedSuggestion = selectedSuggestionId
    ? suggestions.find((s) => s.id === selectedSuggestionId) || null
    : null;

  const handleAccept = (s: Suggestion) => {
    if (selectedSuggestionId === s.id) {
      setSelectedSuggestionId(null);
    }
    onAcceptSuggestion(s);
  };

  const handleDismiss = (s: Suggestion) => {
    if (selectedSuggestionId === s.id) {
      setSelectedSuggestionId(null);
    }
    onDismissSuggestion(s);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full w-full min-w-0">
      {/* Mobile Navigation & View Switcher Bar (Visible strictly below md breakpoint) */}
      <div
        id="mobile-editor-navbar"
        className="flex md:hidden items-center justify-between px-2.5 py-1.5 bg-stone-950 border-b border-stone-800 flex-shrink-0 text-xs gap-2 z-10"
      >
        {onToggleMobileSidebar && (
          <button
            id="mobile-drawer-toggle-btn"
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 text-stone-300 hover:text-amber-400 hover:bg-stone-900 rounded-md border border-stone-800 flex items-center gap-1.5 flex-shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-semibold text-stone-200">Menu</span>
          </button>
        )}

        {/* Segmented Tab Control */}
        <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800 flex-1 justify-center max-w-xs">
          <button
            id="mobile-tab-editor"
            type="button"
            onClick={() => setActiveMobileTab('editor')}
            className={`flex-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
              activeMobileTab === 'editor'
                ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span>Editor</span>
          </button>

          <button
            id="mobile-tab-suggestions"
            type="button"
            onClick={() => setActiveMobileTab('suggestions')}
            className={`flex-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
              activeMobileTab === 'suggestions'
                ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Picks</span>
            {suggestions.length > 0 && (
              <span className="text-[9px] font-mono px-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {suggestions.length}
              </span>
            )}
          </button>

          {diffPaneEnabled && (
            <button
              id="mobile-tab-preview"
              type="button"
              onClick={() => setActiveMobileTab('preview')}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                activeMobileTab === 'preview'
                  ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Columns className="w-3 h-3 text-amber-400" />
              <span>Diff</span>
            </button>
          )}
        </div>

        {/* Word Count Badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="text-[10px] text-stone-400 font-mono bg-stone-900 px-2 py-1 rounded border border-stone-800">
            {wordCount}w
          </div>
        </div>
      </div>

      {/* Main Responsive Panes View */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full min-w-0">
        {/* 1. Left Pane: Suggestions & Passes (Collapsible on desktop, full pane on mobile tab) */}
        <div
          style={
            !isMobileScreen && !isSuggestionsCollapsed
              ? { width: `${suggestionsWidth}px` }
              : undefined
          }
          className={`
            ${activeMobileTab === 'suggestions' ? 'flex flex-1 w-full h-full' : 'hidden'}
            md:flex
            ${isSuggestionsCollapsed ? 'md:w-11' : ''}
            h-full flex-shrink-0 ${isSuggestionsDragging ? 'transition-none' : 'transition-all duration-150'}
          `}
        >
          <SuggestionsPane
            suggestions={suggestions}
            selectedSuggestionId={selectedSuggestionId}
            onSelectSuggestion={setSelectedSuggestionId}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
            onIgnoreTerm={onIgnoreTerm}
            selectedText={selectedText}
            onTriggerAIRewrite={onAIRewrite}
            isGeneratingAI={isGeneratingAI}
            aiError={aiError}
            onRunAIPass={onRunAIPass}
            onAcceptAllAI={onAcceptAllAI}
            onClearAI={onClearAI}
            isAnalyzingAI={isAnalyzingAI}
            activeFileName={activeFileName}
            isCollapsed={isMobileScreen ? false : isSuggestionsCollapsed}
            onToggleCollapse={handleToggleSuggestionsCollapse}
            isCharacterOrWorld={isCharacterOrWorld}
            documentCategory={documentCategory}
          />
        </div>

        {/* Resizer between Suggestions and Source Pane */}
        {!isSuggestionsCollapsed && (
          <PanelResizer
            id="suggestions-pane-resizer"
            label="Suggestions & Passes Pane"
            onResize={handleSuggestionsResize}
            onResizeStart={handleSuggestionsResizeStart}
            onResizeEnd={handleSuggestionsResizeEnd}
            onReset={handleSuggestionsReset}
            onStepChange={handleSuggestionsStep}
          />
        )}

        {/* 2. Central Pane: Manuscript Source Pane */}
        <div
          className={`
            ${activeMobileTab === 'editor' ? 'flex flex-1 w-full h-full' : 'hidden'}
            md:flex flex-1 flex-col min-w-0 h-full w-full
          `}
        >
          <SourcePane
            content={content}
            onChange={onContentChange}
            onSelectionChange={onSelectionChange}
            title={activeFileName}
            isSaving={isSaving}
            wordCount={wordCount}
            focusedSuggestion={focusedSuggestion}
            onClearFocus={() => setSelectedSuggestionId(null)}
            onAcceptSuggestion={handleAccept}
            onDismissSuggestion={handleDismiss}
            isDiffCollapsed={isDiffCollapsed}
            onToggleDiffCollapse={handleToggleDiffCollapse}
            isSuggestionsCollapsed={isSuggestionsCollapsed}
            onToggleSuggestionsCollapse={handleToggleSuggestionsCollapse}
            suggestionsCount={suggestions.length}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebarCollapse={onToggleSidebarCollapse}
            onToggleMobileSidebar={onToggleMobileSidebar}
            loreEntries={loreEntries}
            loreCharacters={loreCharacters}
            loreWorld={loreWorld}
            onReferenceLore={onReferenceLore}
            onUnlinkLore={onUnlinkLore}
            onCreateLoreEntry={onCreateLoreEntry}
            onOpenFile={onOpenFile}
            llmSettings={llmSettings}
            customPrompts={customPrompts}
            currentSceneSummary={currentSceneSummary}
            currentSceneSummaryWordCount={currentSceneSummaryWordCount}
            priorSceneSummaries={priorSceneSummaries}
            allSceneSummaries={allSceneSummaries}
            onOpenSceneSummary={onOpenSceneSummary}
            isCharacterOrWorld={isCharacterOrWorld}
            documentCategory={documentCategory}
            isLoadingCurrentScene={isLoadingCurrentScene}
            diffPaneEnabled={diffPaneEnabled}
            flashRange={flashRange}
            onTriggerFlash={onTriggerFlash}
            onAIRewrite={onAIRewrite}
            isGeneratingAI={isGeneratingAI}
          />
        </div>

        {/* Resizer between Source Pane and Preview/Diff Pane */}
        {diffPaneEnabled && !isDiffCollapsed && (
          <PanelResizer
            id="preview-pane-resizer"
            label="Accepted Result & Diff Pane"
            onResize={handlePreviewResize}
            onResizeStart={handlePreviewResizeStart}
            onResizeEnd={handlePreviewResizeEnd}
            onReset={handlePreviewReset}
            onStepChange={handlePreviewStep}
          />
        )}

        {/* 3. Right Pane: Accepted Result & Diff (Collapsible on desktop, full pane on mobile tab) */}
        {diffPaneEnabled && (
          <div
            style={
              !isMobileScreen && !isDiffCollapsed
                ? { width: `${previewWidth}px` }
                : undefined
            }
            className={`
              ${activeMobileTab === 'preview' ? 'flex flex-1 w-full h-full' : 'hidden'}
              md:flex
              ${isDiffCollapsed ? 'md:w-11' : ''}
              h-full flex-shrink-0 ${isDiffDragging ? 'transition-none' : 'transition-all duration-150'}
            `}
          >
            <PreviewPane
              currentText={content}
              originalText={baselineContent}
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onExport={onExport}
              focusedSuggestion={focusedSuggestion}
              isCollapsed={isMobileScreen ? false : isDiffCollapsed}
              onToggleCollapse={handleToggleDiffCollapse}
              loreEntries={loreEntries}
              onOpenFile={onOpenFile}
              isCharacterOrWorld={isCharacterOrWorld}
              documentCategory={documentCategory}
            />
          </div>
        )}
      </div>
    </div>
  );
};
