import React, { useState, useEffect, useRef } from 'react';
import { Suggestion } from '../../types/index.ts';
import {
  Sparkles,
  Wand2,
  Filter,
  Check,
  Play,
  RotateCcw,
  CheckCheck,
  Eye,
  Feather,
  MessageSquare,
  Zap,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Crosshair,
} from 'lucide-react';
import { SuggestionCard } from './SuggestionCard.tsx';

interface SuggestionsPaneProps {
  suggestions: Suggestion[];
  selectedSuggestionId?: string | null;
  onSelectSuggestion?: (id: string | null) => void;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onIgnoreTerm?: (term: string) => void;
  selectedText: string;
  onTriggerAIRewrite: (instruction: string) => void;
  isGeneratingAI: boolean;
  aiError: string | null;
  onRunAIPass?: (passType: string, instruction?: string, scope?: 'scene' | 'selection') => Promise<void>;
  onAcceptAllAI?: () => void;
  onClearAI?: () => void;
  isAnalyzingAI?: boolean;
  activeFileName?: string;
}

export const SuggestionsPane: React.FC<SuggestionsPaneProps> = ({
  suggestions,
  selectedSuggestionId,
  onSelectSuggestion,
  onAccept,
  onDismiss,
  onIgnoreTerm,
  selectedText,
  onTriggerAIRewrite,
  isGeneratingAI,
  aiError,
  onRunAIPass,
  onAcceptAllAI,
  onClearAI,
  isAnalyzingAI = false,
  activeFileName = 'Active Scene',
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedQuickPreset, setSelectedQuickPreset] = useState('Show, don\'t tell');

  // AI Tab specific controls
  const [selectedPassType, setSelectedPassType] = useState<string>('show-dont-tell');
  const [aiPassScope, setAiPassScope] = useState<'scene' | 'selection'>('scene');
  const [aiPassCustomPrompt, setAiPassCustomPrompt] = useState('');

  const filtered = suggestions.filter(s => {
    if (activeFilter === 'all') return true;
    return s.ruleCategory === activeFilter;
  });

  const aiSuggestions = suggestions.filter(s => s.ruleCategory === 'ai');
  const grammarCount = suggestions.filter(s => s.ruleCategory === 'grammar').length;
  const styleCount = suggestions.filter(s => s.ruleCategory === 'style').length;
  const typoCount = suggestions.filter(s => s.ruleCategory === 'typography').length;
  const aiCount = aiSuggestions.length;

  const hasSelection = !!selectedText.trim();
  const selectionWordCount = hasSelection ? selectedText.trim().split(/\s+/).length : 0;

  const hasAutoRunRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (activeFilter === 'ai' && aiCount === 0 && !isAnalyzingAI && onRunAIPass) {
      if (!hasAutoRunRef.current[activeFileName]) {
        hasAutoRunRef.current[activeFileName] = true;
        onRunAIPass('all');
      }
    }
  }, [activeFilter, aiCount, isAnalyzingAI, onRunAIPass, activeFileName]);

  const handleExecuteAIPass = async (overrideType?: string) => {
    if (!onRunAIPass) return;
    const typeToUse = overrideType || selectedPassType;
    const effectiveScope = hasSelection && aiPassScope === 'selection' ? 'selection' : 'scene';
    await onRunAIPass(typeToUse, aiPassCustomPrompt, effectiveScope);
  };

  const passPresets = [
    {
      id: 'show-dont-tell',
      label: 'Show, Don\'t Tell',
      icon: Eye,
      desc: 'Replaces internal emotion labels with visceral reactions and sensory anchors',
    },
    {
      id: 'prose-flow',
      label: 'Prose & Flow',
      icon: Feather,
      desc: 'Fixes awkward sentence cadence, clunky syntax, and wordiness',
    },
    {
      id: 'sensory',
      label: 'Sensory Depth',
      icon: Sparkles,
      desc: 'Deepens physical atmosphere, acoustic details, lighting, and textures',
    },
    {
      id: 'dialogue',
      label: 'Dialogue Polish',
      icon: MessageSquare,
      desc: 'Sharpens spoken subtext, cuts on-the-nose lines, and refines rhythm',
    },
    {
      id: 'pacing',
      label: 'Tension & Pacing',
      icon: Zap,
      desc: 'Eliminates passive drag, filter words (saw, felt, noticed), and lag',
    },
    {
      id: 'all',
      label: 'Full Critique',
      icon: BookOpen,
      desc: 'Comprehensive fiction editorial review across all craft elements',
    },
  ];

  const currentIndex = selectedSuggestionId
    ? filtered.findIndex(s => s.id === selectedSuggestionId)
    : -1;

  const handleNextSuggestion = () => {
    if (filtered.length === 0) return;
    if (currentIndex === -1 || currentIndex >= filtered.length - 1) {
      onSelectSuggestion?.(filtered[0].id);
    } else {
      onSelectSuggestion?.(filtered[currentIndex + 1].id);
    }
  };

  const handlePrevSuggestion = () => {
    if (filtered.length === 0) return;
    if (currentIndex <= 0) {
      onSelectSuggestion?.(filtered[filtered.length - 1].id);
    } else {
      onSelectSuggestion?.(filtered[currentIndex - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-r border-stone-800">
      {/* Pane Header */}
      <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-sm text-stone-200">Suggestions & Passes</span>
          <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
            {suggestions.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Cycle Navigation Buttons */}
          {filtered.length > 0 && (
            <div className="flex items-center space-x-1 bg-stone-950 border border-stone-800 px-1 py-0.5 rounded">
              {currentIndex !== -1 ? (
                <span className="text-[10px] text-amber-300 font-mono px-1">
                  {currentIndex + 1}/{filtered.length}
                </span>
              ) : (
                <span className="text-[10px] text-stone-500 font-mono px-1">
                  {filtered.length}
                </span>
              )}
              <button
                type="button"
                onClick={handlePrevSuggestion}
                title="Previous suggestion (navigates editor)"
                className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextSuggestion}
                title="Next suggestion (navigates editor)"
                className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {aiCount > 0 && (
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {aiCount} AI
            </span>
          )}
        </div>
      </div>

      {/* AI Rewrite Quick Action Box (Always visible at top for quick selection revisions) */}
      <div className="p-3 bg-stone-950/60 border-b border-stone-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Passage Drafting Pass</span>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">
            {hasSelection ? `${selectionWordCount} words selected` : 'Highlight text to draft'}
          </span>
        </div>

        {hasSelection ? (
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
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white text-xs font-medium rounded transition flex items-center gap-1"
              >
                {isGeneratingAI ? (
                  <>
                    <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  'Rewrite'
                )}
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
            Select any paragraph or dialogue in the Source pane to run an isolated rewrite pass.
          </p>
        )}
      </div>

      {/* Filter Tabs with Badge Counts */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-stone-800/80 overflow-x-auto text-xs bg-stone-950/20">
        <Filter className="w-3 h-3 text-stone-500 mr-1 flex-shrink-0" />
        {[
          { key: 'all', label: 'all', count: suggestions.length },
          { key: 'grammar', label: 'grammar', count: grammarCount },
          { key: 'style', label: 'style', count: styleCount },
          { key: 'typography', label: 'typography', count: typoCount },
          { key: 'ai', label: 'AI Passes', count: aiCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-2 py-0.5 rounded capitalize text-[11px] flex items-center gap-1 transition ${
              activeFilter === tab.key
                ? 'bg-stone-700 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                  tab.key === 'ai'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* AI Controls Bar (Displayed when AI tab is selected) */}
      {activeFilter === 'ai' && (
        <div className="p-3 bg-stone-950/40 border-b border-stone-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-stone-200">Gemini Editorial Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400">Scope:</span>
              <button
                onClick={() => setAiPassScope('scene')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  aiPassScope === 'scene'
                    ? 'bg-amber-600/80 text-white font-medium'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Scene
              </button>
              <button
                onClick={() => setAiPassScope('selection')}
                disabled={!hasSelection}
                title={!hasSelection ? 'Highlight text in editor first' : ''}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  aiPassScope === 'selection' && hasSelection
                    ? 'bg-amber-600/80 text-white font-medium'
                    : hasSelection
                    ? 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    : 'bg-stone-900 text-stone-600 cursor-not-allowed'
                }`}
              >
                Selection {hasSelection ? `(${selectionWordCount}w)` : ''}
              </button>
            </div>
          </div>

          {/* Pass Type Chips */}
          <div className="flex gap-1.5 flex-wrap">
            {passPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPassType === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPassType(preset.id)}
                  title={preset.desc}
                  className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 transition ${
                    isSelected
                      ? 'bg-amber-600 text-white font-medium shadow-sm'
                      : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700/50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional Prompt & Trigger Button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPassCustomPrompt}
              onChange={(e) => setAiPassCustomPrompt(e.target.value)}
              placeholder="Custom direction (e.g. emphasize visceral cold and dread)..."
              className="flex-1 bg-stone-900 border border-stone-700/80 rounded px-2.5 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleExecuteAIPass()}
              disabled={isAnalyzingAI}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white text-xs font-medium rounded transition flex items-center gap-1.5 flex-shrink-0"
            >
              {isAnalyzingAI ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Pass</span>
                </>
              )}
            </button>
          </div>

          {/* If AI suggestions exist, provide bulk action toolbar */}
          {aiCount > 0 && (
            <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-400 font-medium">
                {aiCount} AI {aiCount === 1 ? 'suggestion' : 'suggestions'} ready
              </span>
              <div className="flex items-center gap-2">
                {onAcceptAllAI && (
                  <button
                    onClick={onAcceptAllAI}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded transition"
                  >
                    <CheckCheck className="w-3 h-3" /> Accept All
                  </button>
                )}
                {onClearAI && (
                  <button
                    onClick={onClearAI}
                    className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 bg-stone-800/80 px-2 py-0.5 rounded transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestion Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          activeFilter === 'ai' ? (
            /* Dedicated AI Welcome / Empty State with One-Click Launch */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400 shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-200">No Active AI Passes</p>
                <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                  Run an AI editorial pass powered by Gemini to detect telling vs showing, clunky syntax, sensory depth, or dialogue rhythm in <span className="text-stone-300 font-mono text-[11px]">{activeFileName}</span>.
                </p>
              </div>

              {/* Quick Launch Cards */}
              <div className="w-full space-y-2 pt-1 text-left">
                {passPresets.slice(0, 3).map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleExecuteAIPass(preset.id)}
                      disabled={isAnalyzingAI}
                      className="w-full p-2.5 rounded bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800/80 hover:border-amber-700/60 transition group flex items-start gap-2.5 text-xs text-stone-300"
                    >
                      <Icon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex-1">
                        <div className="font-medium text-stone-200 flex items-center justify-between">
                          <span>{preset.label}</span>
                          <span className="text-[10px] text-amber-400/80 group-hover:text-amber-300 flex items-center gap-1 font-mono">
                            Run <Play className="w-2.5 h-2.5 fill-current" />
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 leading-snug mt-0.5">
                          {preset.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleExecuteAIPass('all')}
                disabled={isAnalyzingAI}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white font-medium rounded text-xs transition flex items-center justify-center gap-1.5 shadow-md"
              >
                {isAnalyzingAI ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Scene with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Full AI Editorial Pass</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
              <Check className="w-8 h-8 text-emerald-500/70 mb-2" />
              <p className="text-sm font-medium text-stone-300">Clean manuscript</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                No issues detected in active {activeFilter === 'all' ? 'rules' : activeFilter} pass.
              </p>
            </div>
          )
        ) : (
          filtered.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              isSelected={item.id === selectedSuggestionId}
              onSelect={() => onSelectSuggestion && onSelectSuggestion(item.id)}
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
