import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Feather,
  BookOpen,
  ArrowRight,
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { LLMSettings } from '../../types/index.ts';
import { LoreEntry } from '../../engine/lore/loreReference.ts';
import { generateManuscriptContent, GenerateContentResult } from '../../engine/ai/index.ts';
import { StorySuggestionsTab } from './StorySuggestionsTab.tsx';

interface GenerateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  startIndex?: number;
  endIndex?: number;
  surroundingContext?: string;
  activeFileName?: string;
  llmSettings?: LLMSettings;
  priorSceneSummaries?: Array<{ title: string; summary: string; filePath?: string }>;
  currentSceneSummary?: string;
  allSceneSummaries?: Array<{ title: string; summary: string; filePath?: string }>;
  loreCharacters?: LoreEntry[];
  loreWorld?: LoreEntry[];
  loreEntries?: LoreEntry[];
  onInsertContent: (text: string, mode: 'replace-or-cursor' | 'append') => void;
}

const DEFAULT_SYSTEM_PROMPT =
  'You are an expert novelist and creative fiction writing assistant.\n' +
  'Generate compelling, immersion-rich fiction prose that seamlessly matches the story\'s world, character voice, and narrative tone.\n' +
  '- Maintain consistent perspective (POV), tense, and cadence with the manuscript.\n' +
  '- Adhere closely to the requested length and writing style.\n' +
  '- Emphasize "show, don\'t tell" with grounded sensory details and authentic character motivations.\n' +
  '- Output ONLY the creative manuscript prose without any meta-commentary, preamble, greetings, or quotation wrappers.';

const STYLE_OPTIONS = [
  {
    id: 'default',
    label: 'Manuscript Natural',
    description: 'Balanced, contemporary fiction tone matching the surrounding text',
    icon: Feather,
  },
  {
    id: 'vivid-sensory',
    label: 'Vivid & Sensory',
    description: 'Rich tactile textures, ambient acoustics, scents, and evocative lighting',
    icon: Sparkles,
  },
  {
    id: 'fast-paced',
    label: 'Fast-Paced & Tense',
    description: 'Short punchy sentences, active verbs, urgent cadence, and rising stakes',
    icon: ArrowRight,
  },
  {
    id: 'lyrical',
    label: 'Atmospheric & Lyrical',
    description: 'Poetic cadence, deeper subtext, reflective depth, and rich metaphors',
    icon: BookOpen,
  },
  {
    id: 'snappy-dialogue',
    label: 'Sharp Dialogue',
    description: 'Character banter, witty subtext, natural pauses, minimal dialogue tags',
    icon: Send,
  },
  {
    id: 'dark-gritty',
    label: 'Dark & Gritty',
    description: 'Uncompromising realism, atmospheric weight, and raw visceral tension',
    icon: Feather,
  },
  {
    id: 'custom',
    label: 'Custom Style...',
    description: 'Provide your own specific stylistic guidance or author voice',
    icon: Sliders,
  },
];

const QUICK_PROMPTS = [
  'Continue the scene beat naturally',
  'Write a tense dialogue confrontation',
  'Describe sensory atmosphere and setting',
  'A sudden kinetic action sequence',
  'Internal psychological realization',
];

export const GenerateContentModal: React.FC<GenerateContentModalProps> = ({
  isOpen,
  onClose,
  selectedText = '',
  startIndex = 0,
  endIndex = 0,
  surroundingContext = '',
  activeFileName = '',
  llmSettings,
  priorSceneSummaries = [],
  currentSceneSummary = '',
  allSceneSummaries = [],
  loreCharacters = [],
  loreWorld = [],
  loreEntries = [],
  onInsertContent,
}) => {
  const [activeTab, setActiveTab] = useState<'prose' | 'suggestions'>('prose');
  const [prompt, setPrompt] = useState('');
  const [lengthMode, setLengthMode] = useState<'brief' | 'standard' | 'extended' | 'custom'>('standard');
  const [customWordCount, setCustomWordCount] = useState<number>(200);
  const [selectedStyle, setSelectedStyle] = useState<string>('default');
  const [customStyleText, setCustomStyleText] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);

  // Scene Summaries Context state
  const [includeSceneSummaries, setIncludeSceneSummaries] = useState<boolean>(true);
  const [summaryScope, setSummaryScope] = useState<'prior' | 'current' | 'all'>('prior');
  const [showSummariesPreview, setShowSummariesPreview] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateContentResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Handle using a brainstormed story idea directly inside the prose generator
  const handleUseIdeaInGenerator = (promptGuidance: string) => {
    setPrompt(promptGuidance);
    setActiveTab('prose');
  };

  // Initialize or reset state when opening
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      setResult(null);

      // Default scope to prior if prior summaries exist, else current/all
      if (priorSceneSummaries && priorSceneSummaries.length > 0) {
        setSummaryScope('prior');
      } else if (currentSceneSummary) {
        setSummaryScope('current');
      } else {
        setSummaryScope('all');
      }

      // Automatically include the system prompt, incorporating user settings if present
      const initialSystemPrompt =
        llmSettings?.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
      setSystemPrompt(initialSystemPrompt);

      // If user had selected text that isn't a placeholder, suggest continuing or expanding
      const cleanSelected = selectedText.trim();
      if (cleanSelected && cleanSelected !== 'Selected Passage' && cleanSelected.length > 3) {
        setPrompt(`Continue or expand the scene following: "${cleanSelected.length > 60 ? cleanSelected.slice(0, 60) + '...' : cleanSelected}"`);
      } else {
        setPrompt('');
      }
    }
  }, [isOpen, selectedText, llmSettings]);

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const connectedModel = llmSettings?.model || 'gemini-3.8-flash';
  const hasSelection =
    selectedText &&
    selectedText.trim().length > 0 &&
    selectedText !== 'Selected Passage';

  const hasAnySummaries =
    Boolean((priorSceneSummaries && priorSceneSummaries.length > 0) ||
    currentSceneSummary ||
    (allSceneSummaries && allSceneSummaries.length > 0));

  const getActiveSummaries = () => {
    if (!includeSceneSummaries || !hasAnySummaries) return [];
    if (summaryScope === 'prior') {
      return (priorSceneSummaries && priorSceneSummaries.length > 0)
        ? priorSceneSummaries
        : currentSceneSummary
        ? [{ title: activeFileName || 'Current Scene', summary: currentSceneSummary }]
        : allSceneSummaries || [];
    }
    if (summaryScope === 'current') {
      return currentSceneSummary
        ? [{ title: activeFileName || 'Current Scene', summary: currentSceneSummary }]
        : [];
    }
    return allSceneSummaries || [];
  };

  const activeSummaries = getActiveSummaries();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want the AI to generate.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const lengthVal = lengthMode === 'custom' ? customWordCount : lengthMode;

    try {
      const res = await generateManuscriptContent(
        {
          prompt: prompt.trim(),
          length: lengthVal,
          style: selectedStyle,
          customStyle: selectedStyle === 'custom' ? customStyleText : undefined,
          systemPrompt: systemPrompt.trim(),
          selectedText: hasSelection ? selectedText : undefined,
          surroundingContext,
          sceneSummaries: activeSummaries.length > 0 ? activeSummaries : undefined,
        },
        llmSettings
      );

      setResult(res);
    } catch (err: any) {
      console.error('Content generation failed:', err);
      setError(err.message || 'Failed to generate content. Check your connection or API status.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.generatedText) return;
    navigator.clipboard.writeText(result.generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (mode: 'replace-or-cursor' | 'append') => {
    if (!result?.generatedText) return;
    onInsertContent(result.generatedText, mode);
    onClose();
  };

  const handleResetSystemPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-text"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-stone-900 border border-stone-700/80 shadow-2xl rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-stone-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 bg-stone-950/60 flex flex-col gap-2.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                {activeTab === 'prose' ? <Sparkles className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
              </div>
              <div>
                <h2 id="generate-modal-title" className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                  <span>{activeTab === 'prose' ? 'Generate Content' : 'Story Suggestions & Ideas'}</span>
                  <span className="text-[11px] font-normal text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                    {connectedModel}
                  </span>
                </h2>
                <p className="text-[11px] text-stone-400">
                  {activeFileName ? `Active Scene: ${activeFileName}` : 'Draft prose or brainstorm narrative trajectories'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-stone-400 hover:text-stone-200 p-1 rounded-md hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Switcher: Draft Prose vs. Story Suggestions */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-900 border border-stone-800 rounded-lg select-none">
            <button
              id="generate-tab-prose-btn"
              type="button"
              onClick={() => setActiveTab('prose')}
              className={`flex-1 py-1 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'prose'
                  ? 'bg-stone-800 text-amber-300 shadow-sm border border-stone-700/80'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Draft Prose</span>
            </button>

            <button
              id="generate-tab-suggestions-btn"
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 py-1 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-stone-800 text-amber-300 shadow-sm border border-stone-700/80'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Story Suggestions</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-mono">
                Ideas
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'suggestions' ? (
            <StorySuggestionsTab
              characters={loreCharacters}
              lore={loreWorld}
              allSceneSummaries={allSceneSummaries}
              currentSceneTitle={activeFileName}
              currentSceneSummary={currentSceneSummary}
              surroundingContext={surroundingContext}
              llmSettings={llmSettings}
              onUseIdeaInGenerator={handleUseIdeaInGenerator}
              onInsertContent={onInsertContent}
            />
          ) : (
            <>
              {/* Active selection context note if right-clicked with selection */}
              {hasSelection && (
                <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800 text-xs flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="truncate">
                    <span className="text-stone-400 font-medium">Selected in scene: </span>
                    <span className="text-amber-200/90 font-mono italic">
                      "{selectedText.length > 80 ? `${selectedText.slice(0, 80)}...` : selectedText}"
                    </span>
                  </div>
                </div>
              )}

          {/* 1. Content Description Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="content-description-input" className="text-xs font-semibold text-stone-300">
                Describe What to Generate <span className="text-amber-400">*</span>
              </label>
              <span className="text-[11px] text-stone-500">Provide scene beat, character actions, or plot guidance</span>
            </div>

            <textarea
              id="content-description-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Mara enters the neon-drenched black market and confronts Jax about the corrupted biocoding data. High tension, rain drumming against the tarps..."
              rows={3}
              autoFocus
              className="w-full bg-stone-950/90 border border-stone-800 rounded-lg p-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 font-serif leading-relaxed"
            />

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mr-1">
                Quick Prompts:
              </span>
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => setPrompt(qp)}
                  className="text-[11px] bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 hover:text-stone-100 px-2 py-0.5 rounded-full border border-stone-700/60 transition"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Content Length / Word Count Options */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              How Much Content to Generate
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setLengthMode('brief')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  lengthMode === 'brief'
                    ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                    : 'bg-stone-950/50 border-stone-800 hover:bg-stone-800/60 text-stone-300'
                }`}
              >
                <div className="font-semibold text-xs">Brief Beat</div>
                <div className="text-[10px] opacity-75 font-mono mt-0.5">~50–100 words</div>
                <div className="text-[10px] text-stone-400 mt-1">Short reaction or punchy sentence beat</div>
              </button>

              <button
                type="button"
                onClick={() => setLengthMode('standard')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  lengthMode === 'standard'
                    ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                    : 'bg-stone-950/50 border-stone-800 hover:bg-stone-800/60 text-stone-300'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1">
                  <span>Standard</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">Default</span>
                </div>
                <div className="text-[10px] opacity-75 font-mono mt-0.5">~150–250 words</div>
                <div className="text-[10px] text-stone-400 mt-1">Full scene beat or dialogue exchange</div>
              </button>

              <button
                type="button"
                onClick={() => setLengthMode('extended')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  lengthMode === 'extended'
                    ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                    : 'bg-stone-950/50 border-stone-800 hover:bg-stone-800/60 text-stone-300'
                }`}
              >
                <div className="font-semibold text-xs">Extended</div>
                <div className="text-[10px] opacity-75 font-mono mt-0.5">~350–500 words</div>
                <div className="text-[10px] text-stone-400 mt-1">Full scene section or detailed sequence</div>
              </button>

              <button
                type="button"
                onClick={() => setLengthMode('custom')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  lengthMode === 'custom'
                    ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                    : 'bg-stone-950/50 border-stone-800 hover:bg-stone-800/60 text-stone-300'
                }`}
              >
                <div className="font-semibold text-xs">Custom Length</div>
                <div className="text-[10px] opacity-75 font-mono mt-0.5">{customWordCount} words</div>
                <div className="text-[10px] text-stone-400 mt-1">Specify target word count</div>
              </button>
            </div>

            {/* Custom word count slider if custom selected */}
            {lengthMode === 'custom' && (
              <div className="mt-2.5 p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center gap-4">
                <input
                  type="range"
                  min={50}
                  max={800}
                  step={25}
                  value={customWordCount}
                  onChange={(e) => setCustomWordCount(Number(e.target.value))}
                  className="flex-1 accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-mono text-xs text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800/60">
                  <span>{customWordCount}</span>
                  <span className="text-[10px] text-stone-400">words</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Writing Style Options */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              Writing Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((st) => {
                const isSelected = selectedStyle === st.id;
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                        : 'bg-stone-950/50 border-stone-800 hover:bg-stone-800/60 text-stone-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs">{st.label}</div>
                      <div className="text-[11px] text-stone-400 leading-snug mt-0.5">{st.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom style freeform input */}
            {selectedStyle === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customStyleText}
                  onChange={(e) => setCustomStyleText(e.target.value)}
                  placeholder="E.g., Sparse Hemingway prose, short declarative sentences, cold hard-boiled tone..."
                  className="w-full bg-stone-950/90 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/80"
                />
              </div>
            )}
          </div>

          {/* 4. Story Context & Scene Summaries for LLM Prompting */}
          <div className="rounded-lg border border-stone-800/80 bg-stone-950/50 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-stone-200 flex items-center gap-2">
                    <span>Story Context & Scene Summaries</span>
                    {activeSummaries.length > 0 && includeSceneSummaries && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 font-mono">
                        {activeSummaries.length} {activeSummaries.length === 1 ? 'scene' : 'scenes'} included
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Provides chronological plot and character context to the LLM for narrative consistency.
                  </div>
                </div>
              </div>

              {hasAnySummaries && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSceneSummaries}
                    onChange={(e) => setIncludeSceneSummaries(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-amber-500"
                  />
                  <span className="text-xs text-stone-300 font-medium">Include</span>
                </label>
              )}
            </div>

            {hasAnySummaries ? (
              includeSceneSummaries && (
                <div className="px-3.5 pb-3 pt-1 border-t border-stone-800/60 space-y-2.5 bg-stone-950/80">
                  {/* Scope selector */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[11px] text-stone-400 mr-1">Context Scope:</span>
                    <button
                      type="button"
                      onClick={() => setSummaryScope('prior')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        summaryScope === 'prior'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                      }`}
                    >
                      Preceding Scenes ({priorSceneSummaries?.length || 0})
                    </button>
                    {currentSceneSummary && (
                      <button
                        type="button"
                        onClick={() => setSummaryScope('current')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                          summaryScope === 'current'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                        }`}
                      >
                        Current Scene Summary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSummaryScope('all')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        summaryScope === 'all'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                      }`}
                    >
                      All Novel Scenes ({allSceneSummaries?.length || 0})
                    </button>
                  </div>

                  {/* Collapsible preview of the summaries being sent */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSummariesPreview(!showSummariesPreview)}
                      className="text-[10px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>{showSummariesPreview ? 'Hide context preview' : 'Preview included scene summaries'}</span>
                      {showSummariesPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showSummariesPreview && (
                      <div className="mt-1.5 max-h-36 overflow-y-auto space-y-1.5 p-2 rounded bg-stone-900/90 border border-stone-800 text-[11px]">
                        {activeSummaries.map((s, idx) => (
                          <div key={idx} className="border-b border-stone-800/60 pb-1.5 last:border-0 last:pb-0">
                            <span className="font-semibold text-amber-300/90 mr-1.5">[{s.title}]:</span>
                            <span className="text-stone-300 leading-relaxed">{s.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="px-3.5 pb-3 text-[11px] text-stone-500 italic">
                No scene summaries generated yet. Generate summaries for your scenes to give the LLM memory of earlier chapters.
              </div>
            )}
          </div>

          {/* 5. Automatically Included System Prompt */}
          <div className="rounded-lg border border-stone-800/80 bg-stone-950/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-stone-900/50 transition"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-stone-300">
                  System Prompt
                </span>
                <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Automatically Included
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-stone-500">
                <span>{showSystemPrompt ? 'Hide details' : 'View / Edit'}</span>
                {showSystemPrompt ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {showSystemPrompt && (
              <div className="p-3.5 border-t border-stone-800/80 space-y-2 bg-stone-950/80 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    This prompt directs the connected model's fiction persona and output rules:
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSystemPrompt}
                    className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Default</span>
                  </button>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-[11px] font-mono text-stone-300 focus:outline-none focus:border-amber-500/80 leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>{error}</div>
            </div>
          )}

          {/* Generated Result Review Card */}
          {result && (
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950/20 p-4 space-y-3 shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Generated Prose</span>
                  <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                    {result.wordCount} words
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 rounded text-[11px] flex items-center gap-1 transition"
                    title="Copy generated text to clipboard"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 rounded text-[11px] flex items-center gap-1 transition"
                    title="Generate another variation"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Editable generated output preview */}
              <div className="relative">
                <textarea
                  value={result.generatedText}
                  onChange={(e) =>
                    setResult({
                      ...result,
                      generatedText: e.target.value,
                      wordCount: e.target.value.split(/\s+/).filter((w) => w.length > 0).length,
                    })
                  }
                  rows={6}
                  className="w-full bg-stone-950/90 border border-stone-800/80 rounded-lg p-3 text-xs text-stone-100 font-serif leading-relaxed focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Insertion action buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleInsert('append')}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
                >
                  Append to Scene End
                </button>

                <button
                  type="button"
                  onClick={() => handleInsert('replace-or-cursor')}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md hover:shadow-amber-500/20 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {hasSelection ? 'Replace Selection' : 'Insert at Cursor'}
                  </span>
                </button>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-stone-500">
            Powered by connected <span className="text-stone-400 font-medium">{connectedModel}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              {activeTab === 'suggestions' ? 'Close' : 'Cancel'}
            </button>

            {activeTab === 'suggestions' ? (
              <button
                type="button"
                onClick={() => setActiveTab('prose')}
                className="px-3.5 py-1.5 bg-stone-850 hover:bg-stone-800 text-amber-300 border border-stone-700 hover:border-amber-500/50 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Go to Draft Prose</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-semibold rounded-lg text-xs flex items-center gap-2 shadow-md hover:shadow-amber-500/20 transition cursor-pointer disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
