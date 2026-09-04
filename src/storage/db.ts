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
  private apiBaseUrl: string;

  constructor() {
    this.isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    this.apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  async init(): Promise<void> {
    const existingRules = typeof localStorage !== 'undefined' ? localStorage.getItem(RULES_KEY) : null;
    if (!existingRules && typeof localStorage !== 'undefined') {
      localStorage.setItem(RULES_KEY, JSON.stringify(DEFAULT_USER_RULES));
    }
  }

  private async fetchSetting<T>(key: string): Promise<T | null> {
    try {
      const resp = await fetch(`${this.apiBaseUrl}/api/settings/${key}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  private async saveSetting<T>(key: string, value: T): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch {
      // Offline fallback
    }
  }

  async getUserRules(): Promise<UserRule[]> {
    const remote = await this.fetchSetting<UserRule[]>(RULES_KEY);
    if (remote) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RULES_KEY, JSON.stringify(remote));
      }
      return remote;
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RULES_KEY) : null;
    if (!raw) return DEFAULT_USER_RULES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USER_RULES;
    }
  }

  async saveUserRules(rules: UserRule[]): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    }
    await this.saveSetting(RULES_KEY, rules);
  }

  async getIgnoredTerms(): Promise<IgnoredTerm[]> {
    const remote = await this.fetchSetting<IgnoredTerm[]>(IGNORED_KEY);
    if (remote) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(IGNORED_KEY, JSON.stringify(remote));
      }
      return remote;
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(IGNORED_KEY) : null;
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(IGNORED_KEY, JSON.stringify(terms));
    }
    await this.saveSetting(IGNORED_KEY, terms);
    return newTerm;
  }

  async removeIgnoredTerm(id: string): Promise<void> {
    const terms = await this.getIgnoredTerms();
    const filtered = terms.filter(t => t.id !== id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(IGNORED_KEY, JSON.stringify(filtered));
    }
    await this.saveSetting(IGNORED_KEY, filtered);
  }

  async getRecentDocuments(): Promise<RecentDocument[]> {
    const remote = await this.fetchSetting<RecentDocument[]>(RECENTS_KEY);
    if (remote) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(remote));
      }
      return remote;
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RECENTS_KEY) : null;
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
    const updated = filtered.slice(0, 15);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    }
    await this.saveSetting(RECENTS_KEY, updated);
  }

  async getLLMSettings(): Promise<{ apiKey: string; baseUrl: string; model: string; systemPrompt: string }> {
    const defaults = {
      apiKey: import.meta.env?.VITE_LLM_API_KEY || '',
      baseUrl: import.meta.env?.VITE_LLM_BASE_URL || 'https://openrouter.ai/api/v1',
      model: import.meta.env?.VITE_LLM_MODEL || 'microsoft/wizardlm-2-8x22b',
      systemPrompt: '',
    };

    const remote = await this.fetchSetting<{ apiKey: string; baseUrl: string; model: string; systemPrompt: string }>(LLM_SETTINGS_KEY);
    if (remote) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(remote));
      }
      return { ...defaults, ...remote };
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LLM_SETTINGS_KEY) : null;
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  async saveLLMSettings(settings: { apiKey: string; baseUrl: string; model: string; systemPrompt: string }): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
    }
    await this.saveSetting(LLM_SETTINGS_KEY, settings);
  }
}

export const db = new LocalDatabase();
