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
  ruleCategory: 'style' | 'grammar' | 'typography' | 'ai';
  severity: 'info' | 'warning' | 'suggestion';
}

export interface UserRule {
  id: string;
  name: string;
  category:
    | 'repeated-word'
    | 'sentence-length'
    | 'passive-voice'
    | 'typography'
    | 'grammar-confusions'
    | 'article-agreement'
    | 'filter-words'
    | 'weak-words'
    | 'redundant-adverbs'
    | 'cliches';
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
  type: 'scene' | 'character' | 'bible';
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

export interface Novel {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  targetWordCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface LLMSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
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
  temperature?: number;
}
