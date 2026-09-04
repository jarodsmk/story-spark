import React, { useState } from 'react';
import { Suggestion } from '../../types/index.ts';
import { Sparkles, Wand2, Filter, Check } from 'lucide-react';
import { SuggestionCard } from './SuggestionCard.tsx';

interface SuggestionsPaneProps {
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onIgnoreTerm?: (term: string) => void;
  selectedText: string;
  onTriggerAIRewrite: (instruction: string) => void;
  isGeneratingAI: boolean;
  aiError: string | null;
}

export const SuggestionsPane: React.FC<SuggestionsPaneProps> = ({
  suggestions,
  onAccept,
  onDismiss,
  onIgnoreTerm,
  selectedText,
  onTriggerAIRewrite,
  isGeneratingAI,
  aiError,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedQuickPreset, setSelectedQuickPreset] = useState('Show, don\'t tell');

  const filtered = suggestions.filter(s => {
    if (activeFilter === 'all') return true;
    return s.ruleCategory === activeFilter;
  });

  return (
    <div className="flex flex-col h-full bg-stone-900 border-r border-stone-800">
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-sm text-stone-200">Suggestions & Passes</span>
          <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
            {suggestions.length}
          </span>
        </div>
      </div>

      {/* AI Rewrite Action Box */}
      <div className="p-3 bg-stone-950/60 border-b border-stone-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Passage Drafting Pass</span>
          </div>
          <span className="text-[10px] text-stone-500">
            {selectedText.trim() ? `${selectedText.split(/\s+/).length} words selected` : 'Highlight text in editor'}
          </span>
        </div>

        {selectedText.trim() ? (
          <div className="space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {['Show, don\'t tell', 'Tighten prose', 'Sensory depth', 'Punchier dialogue'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setSelectedQuickPreset(preset)}
                  className={`text-[11px] px-2 py-0.5 rounded transition ${
                    selectedQuickPreset === preset
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Custom instruction..."
                className="flex-1 bg-stone-900 border border-stone-700/80 rounded px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => onTriggerAIRewrite(customInstruction || selectedQuickPreset)}
                disabled={isGeneratingAI}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white text-xs font-medium rounded transition"
              >
                {isGeneratingAI ? 'Drafting...' : 'Rewrite'}
              </button>
            </div>
            {aiError && (
              <div className="text-[11px] text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-900/60">
                {aiError}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic">
            Select any paragraph or dialogue in the Source pane to run an isolated rewrite pass without uploading the novel.
          </p>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-stone-800/80 overflow-x-auto text-xs bg-stone-950/20">
        <Filter className="w-3 h-3 text-stone-500 mr-1" />
        {['all', 'grammar', 'style', 'typography', 'ai'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-2 py-0.5 rounded capitalize text-[11px] ${
              activeFilter === cat
                ? 'bg-stone-700 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Suggestion List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <Check className="w-8 h-8 text-emerald-500/70 mb-2" />
            <p className="text-sm font-medium text-stone-300">Clean manuscript</p>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              No issues detected in active rules. Prose and typography look sharp!
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onAccept={onAccept}
              onDismiss={onDismiss}
              onIgnoreTerm={onIgnoreTerm}
            />
          ))
        )}
      </div>
    </div>
  );
};
