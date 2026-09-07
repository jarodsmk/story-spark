export interface Suggestion {
  id: string;
  type:
    | 'repeated-word'
    | 'sentence-length'
    | 'passive-voice'
    | 'typography'
    | 'ai-rewrite'
    | 'grammar'
    | 'filter-word'
    | 'weak-word'
    | 'redundant-adverb'
    | 'cliche';
  title: string;
  description: string;
  originalText: string;
  replacementText: string;
  startIndex: number;
  endIndex: number;
  ruleCategory?: 'style' | 'grammar' | 'typography' | 'ai';
  severity: 'info' | 'warning' | 'suggestion';
}

export interface UserRule {
  id: string;
  name: string;
  category?: string;
  enabled: boolean;
  threshold?: number;
  description: string;
}

export interface IgnoredTerm {
  id: string;
  term: string;
  createdAt: number;
}

export interface RecentDocument {
  id: string;
  path: string;
  title: string;
  type: 'scene' | 'character' | 'bible' | 'scratchpad';
  lastOpened: number;
}

export interface BibleEntity {
  id: string;
  type: 'character' | 'world' | 'note';
  name: string;
  filename: string;
  content: string;
  tags?: string[];
}

export interface SceneDocument {
  id: string;
  title: string;
  filename: string;
  content: string;
  order: number;
  chapter?: string;
  synopsis?: string;
}

export interface SceneSummary {
  filePath: string;
  title: string;
  summary: string;
  keyEvents?: string[];
  keyCharacters?: string[];
  wordCount?: number;
  updatedAt: number;
}

export interface NovelCustomPrompts {
  storyGeneration?: string;
  summarization?: string;
  rewrite?: string;
  editorialPass?: string;
  storySuggestions?: string;
}

export type TailwindPaletteSteps = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface CoverTheme {
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  ambientBgHex: string;
  paletteRgb: Record<TailwindPaletteSteps, string>; // "R G B" format for Tailwind CSS variables
  paletteHex: Record<TailwindPaletteSteps, string>; // "#hex" format for inline styles/preview swatches
  prominentColors: string[]; // List of 4-6 prominent hex colors for UI display
  isMonochrome?: boolean;
}

export interface Novel {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  targetWordCount?: number;
  createdAt: number;
  updatedAt: number;
  coverImage?: string;
  coverTheme?: CoverTheme;
  customPrompts?: NovelCustomPrompts;
}

export interface LLMSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  provider?: string;
  customModel?: string;
}

export interface RewriteRequest {
  selectedText: string;
  instruction: string;
  fullContext?: string; // Optional context, but passage is isolated
}

export interface GenerateContentRequest {
  prompt: string;
  length?: 'brief' | 'standard' | 'extended' | number;
  style?: string;
  customStyle?: string;
  systemPrompt?: string;
  selectedText?: string;
  surroundingContext?: string;
  sceneSummaries?: Array<{ title: string; summary: string }>;
  temperature?: number;
}

export interface StorySuggestion {
  id: string;
  title: string;
  type: 'plot_twist' | 'character_conflict' | 'lore_revelation' | 'subplot' | 'scene_beat' | 'general';
  involvedCharacters: string[];
  involvedLore: string[];
  premise: string;
  dramaticConflict: string;
  suggestedSceneHook: string;
}

export interface GenerateStorySuggestionsRequest {
  focusType?: 'all' | 'plot_twist' | 'character_conflict' | 'lore_revelation' | 'subplot' | 'scene_beat' | 'general';
  customGuidance?: string;
  characters?: Array<{ name: string; role?: string; summary?: string }>;
  lore?: Array<{ name: string; category?: string; summary?: string }>;
  selectedSceneSummaries?: Array<{ title: string; summary: string }>;
  currentSceneTitle?: string;
  surroundingContext?: string;
  count?: number;
  systemPrompt?: string;
}
