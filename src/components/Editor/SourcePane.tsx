import React, { useRef, useEffect } from 'react';
import { FileText, Sparkles, BookOpen, Clock } from 'lucide-react';

interface SourcePaneProps {
  content: string;
  onChange: (value: string) => void;
  onSelectionChange: (selectedText: string, start: number, end: number) => void;
  title: string;
  isSaving: boolean;
  wordCount: number;
}

export const SourcePane: React.FC<SourcePaneProps> = ({
  content,
  onChange,
  onSelectionChange,
  title,
  isSaving,
  wordCount,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelect = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.slice(start, end);
    onSelectionChange(selected, start, end);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-r border-stone-800">
      {/* Pane Header */}
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40">
        <div className="flex items-center space-x-2 truncate">
          <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="font-medium text-sm text-stone-200 truncate">{title}</span>
          {isSaving ? (
            <span className="text-xs text-amber-500 animate-pulse flex items-center gap-1">
              <Clock className="w-3 h-3" /> Saving...
            </span>
          ) : (
            <span className="text-[10px] text-stone-500 uppercase tracking-wider">Synced</span>
          )}
        </div>
        <div className="text-xs text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded font-mono">
          {wordCount} words
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative flex flex-col p-4 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          placeholder="Start writing your scene in Markdown..."
          spellCheck={false}
          className="w-full h-full bg-transparent resize-none border-none outline-none font-serif text-stone-200 text-base leading-relaxed tracking-wide placeholder-stone-600 focus:ring-0 overflow-y-auto"
        />
      </div>

      {/* Footer Info */}
      <div className="h-8 border-t border-stone-800/60 px-4 flex items-center justify-between text-xs text-stone-500 bg-stone-950/20">
        <span>Markdown format preserved</span>
        <span>Highlight passage to rewrite</span>
      </div>
    </div>
  );
};
