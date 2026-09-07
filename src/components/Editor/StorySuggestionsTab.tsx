import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Sparkles,
  Users,
  Compass,
  Check,
  Copy,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  FileDown,
  Layers,
} from 'lucide-react';
import { LoreEntry } from '../../engine/lore/loreReference.ts';
import { StorySuggestion, LLMSettings } from '../../types/index.ts';
import { generateStorySuggestions } from '../../engine/ai/index.ts';

interface StorySuggestionsTabProps {
  characters?: LoreEntry[];
  lore?: LoreEntry[];
  allSceneSummaries?: Array<{ title: string; summary: string; filePath?: string }>;
  currentSceneTitle?: string;
  currentSceneSummary?: string;
  surroundingContext?: string;
  llmSettings?: LLMSettings;
  customSystemPrompt?: string;
  onUseIdeaInGenerator: (promptGuidance: string) => void;
  onInsertContent: (text: string, mode: 'replace-or-cursor' | 'append') => void;
}

const FOCUS_PRESETS = [
  { id: 'all', label: 'Balanced Mix', desc: 'Varied dynamic ideas' },
  { id: 'plot_twist', label: 'Plot Twists', desc: 'Unexpected reveals & shocks' },
  { id: 'character_conflict', label: 'Character Clashes', desc: 'Secrets, dilemmas & friction' },
  { id: 'lore_revelation', label: 'Lore Revelations', desc: 'Hidden history & world secrets' },
  { id: 'scene_beat', label: 'Immediate Scene Beats', desc: 'Next kinetic steps to write' },
  { id: 'subplot', label: 'Subplots & Side Quests', desc: 'Secondary threads & mysteries' },
] as const;

const QUICK_CREATIVE_PROMPTS = [
  'Deepen the unspoken friction between the characters',
  'Introduce a sudden dilemma with no clean solution',
  'A secret about their past is accidentally revealed',
  'External danger forces reluctant cooperation',
  'A discovery contradicts what they believed about the lore',
];

export const StorySuggestionsTab: React.FC<StorySuggestionsTabProps> = ({
  characters = [],
  lore = [],
  allSceneSummaries = [],
  currentSceneTitle = '',
  currentSceneSummary = '',
  surroundingContext = '',
  llmSettings,
  customSystemPrompt,
  onUseIdeaInGenerator,
  onInsertContent,
}) => {
  // Focus & Guidance state
  const [focusType, setFocusType] = useState<
    'all' | 'plot_twist' | 'character_conflict' | 'lore_revelation' | 'subplot' | 'scene_beat'
  >('all');
  const [customGuidance, setCustomGuidance] = useState<string>('');
  const [ideaCount, setIdeaCount] = useState<number>(4);

  // Selected Characters
  const [selectedCharacterNames, setSelectedCharacterNames] = useState<Set<string>>(() => {
    // Default to selecting all characters if 4 or fewer, else first 3
    const set = new Set<string>();
    characters.slice(0, 4).forEach((c) => set.add(c.name));
    return set;
  });
  const [customCharacterInput, setCustomCharacterInput] = useState<string>('');
  const [customCharacters, setCustomCharacters] = useState<string[]>([]);

  // Selected Lore / World Items
  const [selectedLoreNames, setSelectedLoreNames] = useState<Set<string>>(() => {
    const set = new Set<string>();
    lore.slice(0, 3).forEach((l) => set.add(l.name));
    return set;
  });
  const [customLoreInput, setCustomLoreInput] = useState<string>('');
  const [customLoreItems, setCustomLoreItems] = useState<string[]>([]);

  // Selectable Scene Summaries
  // Store an array or set of indexes/keys of summaries to include
  const [selectedSummaryTitles, setSelectedSummaryTitles] = useState<Set<string>>(() => {
    const set = new Set<string>();
    // Default select all available scene summaries up to 6
    allSceneSummaries.slice(0, 6).forEach((s) => set.add(s.title));
    return set;
  });

  // UI state for expandable sections
  const [activeAccordion, setActiveAccordion] = useState<'context' | null>(null);

  // Generation execution state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StorySuggestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Available character list combining lore entries + user custom adds
  const allAvailableCharacters = useMemo(() => {
    const list: Array<{ name: string; role?: string; summary?: string }> = characters.map((c) => ({
      name: c.name,
      role: c.attributes?.Role || c.attributes?.Archetype || undefined,
      summary: c.summary,
    }));
    customCharacters.forEach((name) => {
      if (!list.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        list.push({ name, role: 'Custom' });
      }
    });
    return list;
  }, [characters, customCharacters]);

  // Available lore list combining world entries + user custom adds
  const allAvailableLore = useMemo(() => {
    const list: Array<{ name: string; category?: string; summary?: string }> = lore.map((l) => ({
      name: l.name,
      category: l.category,
      summary: l.summary,
    }));
    customLoreItems.forEach((name) => {
      if (!list.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
        list.push({ name, category: 'World Element' });
      }
    });
    return list;
  }, [lore, customLoreItems]);

  // Character selection helpers
  const toggleCharacter = (name: string) => {
    setSelectedCharacterNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddCustomCharacter = () => {
    const trimmed = customCharacterInput.trim();
    if (!trimmed) return;
    if (!customCharacters.includes(trimmed)) {
      setCustomCharacters((prev) => [...prev, trimmed]);
    }
    setSelectedCharacterNames((prev) => new Set(prev).add(trimmed));
    setCustomCharacterInput('');
  };

  // Lore selection helpers
  const toggleLore = (name: string) => {
    setSelectedLoreNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddCustomLore = () => {
    const trimmed = customLoreInput.trim();
    if (!trimmed) return;
    if (!customLoreItems.includes(trimmed)) {
      setCustomLoreItems((prev) => [...prev, trimmed]);
    }
    setSelectedLoreNames((prev) => new Set(prev).add(trimmed));
    setCustomLoreInput('');
  };

  // Scene summary selection helpers
  const toggleSummary = (title: string) => {
    setSelectedSummaryTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const selectAllSummaries = () => {
    const set = new Set<string>();
    allSceneSummaries.forEach((s) => set.add(s.title));
    setSelectedSummaryTitles(set);
  };

  const clearAllSummaries = () => {
    setSelectedSummaryTitles(new Set());
  };

  const selectCurrentOnly = () => {
    if (currentSceneTitle) {
      setSelectedSummaryTitles(new Set([currentSceneTitle]));
    }
  };

  // Filtered suggestions by tab
  const displayedSuggestions = useMemo(() => {
    if (activeFilter === 'all') return suggestions;
    return suggestions.filter((s) => s.type === activeFilter);
  }, [suggestions, activeFilter]);

  // Copy helper
  const handleCopySuggestion = async (sug: StorySuggestion) => {
    const text =
      `# ${sug.title}\n` +
      `Category: ${sug.type.replace('_', ' ').toUpperCase()}\n` +
      (sug.involvedCharacters.length ? `Characters: ${sug.involvedCharacters.join(', ')}\n` : '') +
      (sug.involvedLore.length ? `Lore: ${sug.involvedLore.join(', ')}\n` : '') +
      `\nPremise:\n${sug.premise}\n\n` +
      `Dramatic Conflict:\n${sug.dramaticConflict}\n\n` +
      `Scene Hook / Beat:\n${sug.suggestedSceneHook}\n`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(sug.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  // Insert suggestion into scene as an editorial beat/outline note
  const handleInsertSuggestion = (sug: StorySuggestion) => {
    const formatted =
      `\n\n<!-- STORY BEAT IDEA: ${sug.title} -->\n` +
      `> **Premise:** ${sug.premise}\n` +
      `> **Conflict & Stakes:** ${sug.dramaticConflict}\n` +
      `> **Immediate Hook:** ${sug.suggestedSceneHook}\n\n`;

    onInsertContent(formatted, 'replace-or-cursor');
  };

  // Switch to prose generator with prefilled prompt
  const handleSendToGenerator = (sug: StorySuggestion) => {
    const promptText =
      `Write a compelling scene exploring this plot idea: "${sug.title}".\n` +
      `Premise: ${sug.premise}\n` +
      `Conflict to heighten: ${sug.dramaticConflict}\n` +
      `Immediate beat to execute: ${sug.suggestedSceneHook}` +
      (sug.involvedCharacters.length ? `\nInvolved Characters: ${sug.involvedCharacters.join(', ')}` : '') +
      (sug.involvedLore.length ? `\nInvolved Lore: ${sug.involvedLore.join(', ')}` : '');

    onUseIdeaInGenerator(promptText);
  };

  // Trigger generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const selectedCharsPayload = allAvailableCharacters.filter((c) =>
        selectedCharacterNames.has(c.name)
      );

      const selectedLorePayload = allAvailableLore.filter((l) =>
        selectedLoreNames.has(l.name)
      );

      const selectedSummariesPayload = allSceneSummaries.filter((s) =>
        selectedSummaryTitles.has(s.title)
      );

      const result = await generateStorySuggestions(
        {
          focusType,
          customGuidance: customGuidance.trim() || undefined,
          characters: selectedCharsPayload,
          lore: selectedLorePayload,
          selectedSceneSummaries: selectedSummariesPayload,
          currentSceneTitle: currentSceneTitle || 'Current Scene',
          surroundingContext: surroundingContext || undefined,
          count: ideaCount,
          systemPrompt: customSystemPrompt,
        },
        llmSettings
      );

      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
        setActiveFilter('all');
      } else {
        throw new Error('No suggestions returned from the model.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate story suggestions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'plot_twist':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/80';
      case 'character_conflict':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/80';
      case 'lore_revelation':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80';
      case 'scene_beat':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      case 'subplot':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80';
      default:
        return 'bg-amber-950/70 text-amber-300 border-amber-800/80';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'plot_twist':
        return 'Plot Twist';
      case 'character_conflict':
        return 'Character Clash';
      case 'lore_revelation':
        return 'Lore Revelation';
      case 'scene_beat':
        return 'Scene Action Beat';
      case 'subplot':
        return 'Subplot Thread';
      default:
        return 'Story Suggestion';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Context Overview & Quick Configuration */}
      <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3.5 space-y-3">
        {/* 1. Category Focus & Count */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Brainstorm Direction
            </span>
            <div className="flex items-center gap-1 text-[11px] text-stone-400">
              <span>Ideas:</span>
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setIdeaCount(num)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    ideaCount === num
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {FOCUS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setFocusType(preset.id)}
                className={`p-2 rounded-lg border text-left transition text-xs ${
                  focusType === preset.id
                    ? 'bg-amber-950/50 border-amber-500/70 text-amber-200 shadow-sm'
                    : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:bg-stone-800/70 hover:border-stone-700'
                }`}
              >
                <div className="font-medium truncate">{preset.label}</div>
                <div className="text-[10px] text-stone-400 truncate">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Custom Author Guidance */}
        <div>
          <label htmlFor="story-guidance-input" className="block text-[11px] font-medium text-stone-300 mb-1">
            Author Guidance / Creative Direction (Optional)
          </label>
          <input
            id="story-guidance-input"
            type="text"
            value={customGuidance}
            onChange={(e) => setCustomGuidance(e.target.value)}
            placeholder="E.g., Explore Mara's hidden debt to the Syndicate, or high-stakes confrontation in the alley..."
            className="w-full bg-stone-900 border border-stone-800 rounded-md px-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/70"
          />

          {/* Quick inspiration chips */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {QUICK_CREATIVE_PROMPTS.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => setCustomGuidance(qp)}
                className="text-[10px] bg-stone-900/90 hover:bg-stone-800 text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded-full border border-stone-800 transition"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grounding Context Controls: Characters, Lore, and Scene Summaries */}
      <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950/50">
        <div className="p-3 border-b border-stone-800/80 bg-stone-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-stone-200">
              Grounding Context (Characters, Lore & Scene Summaries)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono">
            <span>{selectedCharacterNames.size} characters</span>
            <span>•</span>
            <span>{selectedLoreNames.size} lore</span>
            <span>•</span>
            <span className="text-amber-300 font-semibold">{selectedSummaryTitles.size} scenes</span>
          </div>
        </div>

        <div className="p-3.5 space-y-4 text-xs">
          {/* Section A: Characters */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Characters to Involve ({selectedCharacterNames.size}/{allAvailableCharacters.length})
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    const set = new Set<string>();
                    allAvailableCharacters.forEach((c) => set.add(c.name));
                    setSelectedCharacterNames(set);
                  }}
                  className="text-stone-400 hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCharacterNames(new Set())}
                  className="text-stone-400 hover:text-stone-200 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {allAvailableCharacters.map((c) => {
                const isSelected = selectedCharacterNames.has(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleCharacter(c.name)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-600/70 text-amber-200 font-medium'
                        : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-stone-600 flex-shrink-0 inline-block" />
                    )}
                    <span>{c.name}</span>
                    {c.role && <span className="text-[10px] text-stone-500 font-normal">({c.role})</span>}
                  </button>
                );
              })}

              {allAvailableCharacters.length === 0 && (
                <div className="text-[11px] text-stone-500 italic py-1">
                  No character lore files found in bible/characters. Add custom names below.
                </div>
              )}
            </div>

            {/* Inline add character */}
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                value={customCharacterInput}
                onChange={(e) => setCustomCharacterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCharacter();
                  }
                }}
                placeholder="Add character name (e.g. Jax)..."
                className="bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/70 flex-1"
              />
              <button
                type="button"
                onClick={handleAddCustomCharacter}
                disabled={!customCharacterInput.trim()}
                className="bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 px-2 py-1 rounded text-xs transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>

          {/* Section B: Lore & World Elements */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                World Lore & Settings ({selectedLoreNames.size}/{allAvailableLore.length})
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    const set = new Set<string>();
                    allAvailableLore.forEach((l) => set.add(l.name));
                    setSelectedLoreNames(set);
                  }}
                  className="text-stone-400 hover:text-cyan-300 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLoreNames(new Set())}
                  className="text-stone-400 hover:text-stone-200 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {allAvailableLore.map((l) => {
                const isSelected = selectedLoreNames.has(l.name);
                return (
                  <button
                    key={l.name}
                    type="button"
                    onClick={() => toggleLore(l.name)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-600/70 text-cyan-200 font-medium'
                        : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-stone-600 flex-shrink-0 inline-block" />
                    )}
                    <span>{l.name}</span>
                    {l.category && (
                      <span className="text-[10px] text-stone-500 font-normal">[{l.category}]</span>
                    )}
                  </button>
                );
              })}

              {allAvailableLore.length === 0 && (
                <div className="text-[11px] text-stone-500 italic py-1">
                  No world lore files found in bible/world. Add custom elements below.
                </div>
              )}
            </div>

            {/* Inline add lore item */}
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                value={customLoreInput}
                onChange={(e) => setCustomLoreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomLore();
                  }
                }}
                placeholder="Add world element or faction (e.g. Iron Guild, Old Vault)..."
                className="bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-cyan-500/70 flex-1"
              />
              <button
                type="button"
                onClick={handleAddCustomLore}
                disabled={!customLoreInput.trim()}
                className="bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 px-2 py-1 rounded text-xs transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>

          {/* Section C: Selectable Scene Summaries (Grounding Timeline Context) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Selectable Scene Summaries ({selectedSummaryTitles.size}/{allSceneSummaries.length})
              </span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={selectAllSummaries}
                  className="text-stone-400 hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={selectCurrentOnly}
                  className="text-stone-400 hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Current Scene Only
                </button>
                <button
                  type="button"
                  onClick={clearAllSummaries}
                  className="text-stone-400 hover:text-stone-200 px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {allSceneSummaries.length === 0 ? (
              <div className="p-3 bg-stone-900/60 rounded-md border border-stone-800/80 text-[11px] text-stone-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  No scene summaries generated yet. You can still brainstorm ideas, or generate scene
                  summaries in the Timeline modal to ground suggestions with high fidelity!
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {allSceneSummaries.map((scene, idx) => {
                  const isSelected = selectedSummaryTitles.has(scene.title);
                  const isCurrent = scene.title === currentSceneTitle;
                  return (
                    <div
                      key={scene.title || idx}
                      onClick={() => toggleSummary(scene.title)}
                      className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-700/60 text-stone-200'
                          : 'bg-stone-900/70 border-stone-800/80 text-stone-400 hover:bg-stone-900 hover:text-stone-300'
                      }`}
                    >
                      <div className="pt-0.5 flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-stone-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-stone-200 truncate">
                            Scene {idx + 1}: {scene.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-snug">
                          {scene.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brainstorm Action Button */}
      <div>
        <button
          id="brainstorm-suggestions-btn"
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 transition cursor-pointer disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-stone-900" />
              <span>Synthesizing Plot Threads & Story Ideas...</span>
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
              <span>
                {suggestions.length > 0 ? 'Brainstorm Fresh Suggestions' : 'Brainstorm Story Suggestions'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Generation Failed</div>
            <div className="text-[11px] text-rose-300/90 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Generated Suggestions Output Area */}
      {suggestions.length > 0 && (
        <div className="space-y-3 pt-2">
          {/* Filter Bar & Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-200">
                Generated Ideas ({suggestions.length})
              </span>
            </div>

            {/* Quick Filter tabs */}
            <div className="flex items-center gap-1">
              {['all', 'plot_twist', 'character_conflict', 'lore_revelation', 'scene_beat'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold transition ${
                    activeFilter === f
                      ? 'bg-stone-800 text-amber-300 border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {displayedSuggestions.map((sug) => {
              const isCopied = copiedId === sug.id;
              return (
                <div
                  key={sug.id}
                  className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 space-y-3 hover:border-stone-700 transition shadow-sm"
                >
                  {/* Card Header: Title & Tags */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeBadgeColor(
                            sug.type
                          )}`}
                        >
                          {getTypeLabel(sug.type)}
                        </span>
                        {sug.involvedCharacters.map((cName) => (
                          <span
                            key={cName}
                            className="text-[10px] bg-amber-500/10 text-amber-300/90 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium"
                          >
                            👤 {cName}
                          </span>
                        ))}
                        {sug.involvedLore.map((lName) => (
                          <span
                            key={lName}
                            className="text-[10px] bg-cyan-500/10 text-cyan-300/90 border border-cyan-500/30 px-2 py-0.5 rounded-full font-medium"
                          >
                            🏛️ {lName}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-sm font-semibold text-stone-100 font-serif leading-snug">
                        {sug.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopySuggestion(sug)}
                        title="Copy idea details"
                        className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Premise */}
                  <div className="text-xs text-stone-300 leading-relaxed font-serif">
                    {sug.premise}
                  </div>

                  {/* Dramatic Stakes / Conflict */}
                  {sug.dramaticConflict && (
                    <div className="p-2.5 rounded-lg bg-stone-900/70 border border-stone-800/80 text-[11px] text-stone-300 space-y-1">
                      <span className="font-semibold text-amber-400 block text-[10px] uppercase tracking-wider">
                        Dramatic Stakes & Tension
                      </span>
                      <p className="leading-relaxed">{sug.dramaticConflict}</p>
                    </div>
                  )}

                  {/* Actionable Scene Hook */}
                  {sug.suggestedSceneHook && (
                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200/90 space-y-1">
                      <span className="font-semibold text-amber-400 block text-[10px] uppercase tracking-wider">
                        Immediate Scene Hook to Write Next
                      </span>
                      <p className="italic leading-relaxed font-serif">"{sug.suggestedSceneHook}"</p>
                    </div>
                  )}

                  {/* Card Action Controls */}
                  <div className="pt-1 flex flex-wrap items-center justify-end gap-2 border-t border-stone-850">
                    <button
                      type="button"
                      onClick={() => handleInsertSuggestion(sug)}
                      className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 text-xs border border-stone-700/80 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-stone-400" />
                      <span>Insert as Beat Notes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendToGenerator(sug)}
                      className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs border border-amber-500/50 flex items-center gap-1.5 transition font-medium cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Draft with Generator</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State before generation */}
      {suggestions.length === 0 && !isGenerating && (
        <div className="p-6 text-center rounded-xl bg-stone-950/40 border border-dashed border-stone-800 space-y-2">
          <Lightbulb className="w-6 h-6 text-amber-400/80 mx-auto" />
          <h4 className="text-xs font-semibold text-stone-300">Ready to Brainstorm Story Trajectories</h4>
          <p className="text-[11px] text-stone-500 max-w-md mx-auto leading-relaxed">
            Select the characters, world lore, and scene summaries you want the LLM to consider above, then
            click <strong className="text-amber-300">Brainstorm Story Suggestions</strong>. You'll receive high-stakes
            plot turns, character confrontations, and scene hooks tailored directly to your story's continuity.
          </p>
        </div>
      )}
    </div>
  );
};
