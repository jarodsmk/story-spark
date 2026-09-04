import React from 'react';
import { SourcePane } from './SourcePane.tsx';
import { SuggestionsPane } from './SuggestionsPane.tsx';
import { PreviewPane } from './PreviewPane.tsx';
import { Suggestion } from '../../types/index.ts';

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
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
  content, onContentChange, activeFileName, isSaving, wordCount,
  suggestions, onAcceptSuggestion, onDismissSuggestion, onIgnoreTerm,
  selectedText, onSelectionChange, onAIRewrite, isGeneratingAI, aiError,
  baselineContent, onUndo, onRedo, canUndo, canRedo, onExport
}) => {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[38%] h-full">
        <SourcePane
          content={content}
          onChange={onContentChange}
          onSelectionChange={onSelectionChange}
          title={activeFileName}
          isSaving={isSaving}
          wordCount={wordCount}
        />
      </div>

      <div className="w-[30%] h-full">
        <SuggestionsPane
          suggestions={suggestions}
          onAccept={onAcceptSuggestion}
          onDismiss={onDismissSuggestion}
          onIgnoreTerm={onIgnoreTerm}
          selectedText={selectedText}
          onTriggerAIRewrite={onAIRewrite}
          isGeneratingAI={isGeneratingAI}
          aiError={aiError}
        />
      </div>

      <div className="w-[32%] h-full">
        <PreviewPane
          currentText={content}
          originalText={baselineContent}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onExport={onExport}
        />
      </div>
    </div>
  );
};
