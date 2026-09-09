import { UserRule, IgnoredTerm, RecentDocument, Novel, LLMSettings, AuthorProfile } from '../types/index.ts';
import { DEFAULT_USER_RULES } from '../engine/checks/index.ts';

// Web LocalStorage / In-memory DB interface that mirrors SQLite schema
// Supports Tauri SQLite plugin when running natively or Web fallback in preview.

const RULES_KEY = 'storyspark_user_rules';
const IGNORED_KEY = 'storyspark_ignored_terms';
const RECENTS_KEY = 'storyspark_recent_docs';
const LLM_SETTINGS_KEY = 'storyspark_llm_settings';
const NOVELS_KEY = 'storyspark_novels';
const ACTIVE_NOVEL_KEY = 'storyspark_active_novel_id';
export const DIFF_PANE_ENABLED_KEY = 'storyspark_diff_pane_enabled';
export const AUTHOR_PROFILE_KEY = 'storyspark_author_profile';

export const DEFAULT_AUTHOR_PROFILE: AuthorProfile = {
  name: 'E. A. Sterling',
  penName: '',
  bio: 'Author of speculative fiction and dark fantasy exploring forgotten archives, ancient cartography, and quiet resistance.',
  email: 'author@storyspark.studio',
  website: 'https://storyspark.studio',
  socialHandle: '@easterling_author',
  location: 'Pacific Northwest',
  copyrightNotice: `© ${new Date().getFullYear()} E. A. Sterling. All rights reserved.`,
  updatedAt: 1700000000000,
};

export const DEFAULT_NOVELS: Novel[] = [
  {
    id: 'default',
    title: 'The Whisper of Ash',
    genre: 'Dark Fantasy',
    description: 'A courier attempts to smuggle an encrypted atlas out of a foggy, inquisitor-ruled port city.',
    targetWordCount: 50000,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: 'neon-horizon',
    title: 'Neon Horizon',
    genre: 'Sci-Fi Cyberpunk',
    description: 'A data courier with a synthetic ocular filter races against a biometric warrant in District 9.',
    targetWordCount: 65000,
    createdAt: 1700001000000,
    updatedAt: 1700001000000,
  },
];

export class LocalDatabase {
  private isTauri: boolean;
  private apiBaseUrl: string;

  constructor() {
    this.isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    this.apiBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? '';
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
      const saved: UserRule[] = JSON.parse(raw);
      // Merge any new default rules seamlessly
      const savedIds = new Set(saved.map((r) => r.id));
      const missingDefaults = DEFAULT_USER_RULES.filter((r) => !savedIds.has(r.id));
      if (missingDefaults.length > 0) {
        const merged = [...saved, ...missingDefaults];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(RULES_KEY, JSON.stringify(merged));
        }
        return merged;
      }
      return saved;
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

  async getLLMSettings(): Promise<LLMSettings> {
    const defaults: LLMSettings = {
      apiKey: import.meta.env?.VITE_LLM_API_KEY || '',
      baseUrl: import.meta.env?.VITE_LLM_BASE_URL || 'https://openrouter.ai/api/v1',
      model: import.meta.env?.VITE_LLM_MODEL || 'anthropic/claude-3.7-sonnet',
      systemPrompt: '',
      provider: 'openrouter',
    };

    const remote = await this.fetchSetting<LLMSettings>(LLM_SETTINGS_KEY);
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

  async saveLLMSettings(settings: LLMSettings): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
    }
    await this.saveSetting(LLM_SETTINGS_KEY, settings);
  }

  async getNovels(): Promise<Novel[]> {
    const remote = await this.fetchSetting<Novel[]>(NOVELS_KEY);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(NOVELS_KEY, JSON.stringify(remote));
      }
      return remote;
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(NOVELS_KEY) : null;
    if (!raw) return DEFAULT_NOVELS;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return DEFAULT_NOVELS;
    } catch {
      return DEFAULT_NOVELS;
    }
  }

  async saveNovels(novels: Novel[]): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
    }
    await this.saveSetting(NOVELS_KEY, novels);
  }

  async getActiveNovelId(): Promise<string> {
    const remote = await this.fetchSetting<{ activeId: string }>(ACTIVE_NOVEL_KEY);
    if (remote?.activeId) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_NOVEL_KEY, remote.activeId);
      }
      return remote.activeId;
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_NOVEL_KEY) : null;
    return raw || 'default';
  }

  async setActiveNovelId(id: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_NOVEL_KEY, id);
    }
    await this.saveSetting(ACTIVE_NOVEL_KEY, { activeId: id });
  }

  async getDiffPaneEnabled(): Promise<boolean> {
    const remote = await this.fetchSetting<{ enabled: boolean } | boolean>(DIFF_PANE_ENABLED_KEY);
    if (typeof remote === 'boolean') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DIFF_PANE_ENABLED_KEY, String(remote));
      }
      return remote;
    }
    if (remote && typeof (remote as any).enabled === 'boolean') {
      const val = (remote as any).enabled;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DIFF_PANE_ENABLED_KEY, String(val));
      }
      return val;
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(DIFF_PANE_ENABLED_KEY);
      if (raw !== null) {
        return raw === 'true';
      }
    }
    return true; // Default enabled
  }

  async saveDiffPaneEnabled(enabled: boolean): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DIFF_PANE_ENABLED_KEY, String(enabled));
    }
    await this.saveSetting(DIFF_PANE_ENABLED_KEY, { enabled });
  }

  async getAuthorProfile(): Promise<AuthorProfile> {
    const remote = await this.fetchSetting<AuthorProfile>(AUTHOR_PROFILE_KEY);
    if (remote && remote.name) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTHOR_PROFILE_KEY, JSON.stringify(remote));
      }
      return { ...DEFAULT_AUTHOR_PROFILE, ...remote };
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTHOR_PROFILE_KEY) : null;
    if (!raw) return DEFAULT_AUTHOR_PROFILE;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_AUTHOR_PROFILE, ...parsed };
      }
      return DEFAULT_AUTHOR_PROFILE;
    } catch {
      return DEFAULT_AUTHOR_PROFILE;
    }
  }

  async saveAuthorProfile(profile: AuthorProfile): Promise<void> {
    const updated = {
      ...profile,
      updatedAt: Date.now(),
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTHOR_PROFILE_KEY, JSON.stringify(updated));
    }
    await this.saveSetting(AUTHOR_PROFILE_KEY, updated);
  }
}

export const db = new LocalDatabase();
