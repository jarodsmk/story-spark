import { UserRule, IgnoredTerm, RecentDocument } from '../types/index.ts';
import { DEFAULT_USER_RULES } from '../engine/checks/index.ts';

// Web LocalStorage / In-memory DB interface that mirrors SQLite schema
// Supports Tauri SQLite plugin when running natively or Web fallback in preview.

const RULES_KEY = 'storyspark_user_rules';
const IGNORED_KEY = 'storyspark_ignored_terms';
const RECENTS_KEY = 'storyspark_recent_docs';
const LLM_SETTINGS_KEY = 'storyspark_llm_settings';

export class LocalDatabase {
  private isTauri: boolean;

  constructor() {
    this.isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  async init(): Promise<void> {
    // If running under Tauri, we can initialize SQLite via the plugin or Rusqlite
    // Also prepare fallback default state
    const existingRules = localStorage.getItem(RULES_KEY);
    if (!existingRules) {
      localStorage.setItem(RULES_KEY, JSON.stringify(DEFAULT_USER_RULES));
    }
  }

  async getUserRules(): Promise<UserRule[]> {
    const raw = localStorage.getItem(RULES_KEY);
    if (!raw) return DEFAULT_USER_RULES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USER_RULES;
    }
  }

  async saveUserRules(rules: UserRule[]): Promise<void> {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  }

  async getIgnoredTerms(): Promise<IgnoredTerm[]> {
    const raw = localStorage.getItem(IGNORED_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async addIgnoredTerm(term: string): Promise<IgnoredTerm> {
    const clean = term.trim().toLowerCase();
    const terms = await this.getIgnoredTerms();
    const existing = terms.find(t => t.term.toLowerCase() === clean);
    if (existing) return existing;

    const newTerm: IgnoredTerm = {
      id: `ign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      term: clean,
      createdAt: Date.now(),
    };
    terms.push(newTerm);
    localStorage.setItem(IGNORED_KEY, JSON.stringify(terms));
    return newTerm;
  }

  async removeIgnoredTerm(id: string): Promise<void> {
    const terms = await this.getIgnoredTerms();
    const filtered = terms.filter(t => t.id !== id);
    localStorage.setItem(IGNORED_KEY, JSON.stringify(filtered));
  }

  async getRecentDocuments(): Promise<RecentDocument[]> {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async recordRecentDocument(doc: Omit<RecentDocument, 'lastOpened'>): Promise<void> {
    const recents = await this.getRecentDocuments();
    const filtered = recents.filter(r => r.id !== doc.id);
    filtered.unshift({
      ...doc,
      lastOpened: Date.now(),
    });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(filtered.slice(0, 15)));
  }

  async getLLMSettings(): Promise<{ apiKey: string; baseUrl: string; model: string; systemPrompt: string }> {
    const raw = localStorage.getItem(LLM_SETTINGS_KEY);
    const defaults = {
      apiKey: import.meta.env.VITE_LLM_API_KEY || '',
      baseUrl: import.meta.env.VITE_LLM_BASE_URL || 'https://openrouter.ai/api/v1',
      model: import.meta.env.VITE_LLM_MODEL || 'microsoft/wizardlm-2-8x22b',
      systemPrompt: '',
    };
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  async saveLLMSettings(settings: { apiKey: string; baseUrl: string; model: string; systemPrompt: string }): Promise<void> {
    localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
  }
}

export const db = new LocalDatabase();
