import React, { useState, useEffect } from 'react';
import { SourcePane } from './SourcePane.tsx';
import { SuggestionsPane } from './SuggestionsPane.tsx';
import { PreviewPane } from './PreviewPane.tsx';
import { Suggestion, LLMSettings } from '../../types/index.ts';
import { LoreEntry } from '../../engine/lore/loreReference.ts';

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
  currentSceneSummary?: string;
  currentSceneSummaryWordCount?: number;
  priorSceneSummaries?: Array<{ title: string; summary: string }>;
  allSceneSummaries?: Array<{ title: string; summary: string }>;
  onOpenSceneSummary?: () => void;
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
  currentSceneSummary,
  currentSceneSummaryWordCount,
  priorSceneSummaries,
  allSceneSummaries,
  onOpenSceneSummary,
}) => {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [isDiffCollapsed, setIsDiffCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('story_spark_diff_collapsed') === 'true';
    } catch {
      return false;
    }
  });

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

  // Keyboard shortcut Ctrl+\ or Cmd+\ to quickly toggle the Diff pane
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        handleToggleDiffCollapse();
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
    <div className="flex-1 flex overflow-hidden">
      {/* 1. Left Pane: Suggestions & Passes */}
      <div className="w-[28%] min-w-[280px] max-w-[380px] h-full flex-shrink-0">
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
        />
      </div>

      {/* 2. Central Pane: Manuscript Text Viewing & Editing (expands when Diff is collapsed) */}
      <div className="flex-1 min-w-0 h-full">
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
          loreEntries={loreEntries}
          loreCharacters={loreCharacters}
          loreWorld={loreWorld}
          onReferenceLore={onReferenceLore}
          onUnlinkLore={onUnlinkLore}
          onCreateLoreEntry={onCreateLoreEntry}
          onOpenFile={onOpenFile}
          llmSettings={llmSettings}
          currentSceneSummary={currentSceneSummary}
          currentSceneSummaryWordCount={currentSceneSummaryWordCount}
          priorSceneSummaries={priorSceneSummaries}
          allSceneSummaries={allSceneSummaries}
          onOpenSceneSummary={onOpenSceneSummary}
        />
      </div>

      {/* 3. Right Pane: Accepted Result & Diff (Collapsible) */}
      <div
        className={`${
          isDiffCollapsed ? 'w-11' : 'w-[32%] min-w-[300px] max-w-[500px]'
        } h-full flex-shrink-0 transition-all duration-150`}
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
          isCollapsed={isDiffCollapsed}
          onToggleCollapse={handleToggleDiffCollapse}
          loreEntries={loreEntries}
          onOpenFile={onOpenFile}
        />
      </div>
    </div>
  );
};
