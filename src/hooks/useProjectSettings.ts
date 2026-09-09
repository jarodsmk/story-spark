import { useState, useEffect } from 'react';
import { db, DEFAULT_AUTHOR_PROFILE } from '../storage/db.ts';
import { UserRule, IgnoredTerm, LLMSettings, AuthorProfile } from '../types/index.ts';
import { DEFAULT_USER_RULES } from '../engine/checks/index.ts';

export function useProjectSettings() {
  const [rules, setRules] = useState<UserRule[]>(DEFAULT_USER_RULES);
  const [ignoredTerms, setIgnoredTerms] = useState<IgnoredTerm[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile>(DEFAULT_AUTHOR_PROFILE);
  const [llmSettings, setLLMSettings] = useState<LLMSettings>({
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.7-sonnet',
    systemPrompt: '',
    provider: 'openrouter',
  });
  const [diffPaneEnabled, setDiffPaneEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('storyspark_diff_pane_enabled');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return true; // Default enabled
  });

  useEffect(() => {
    async function load() {
      await db.init();
      setRules(await db.getUserRules());
      setIgnoredTerms(await db.getIgnoredTerms());
      setLLMSettings(await db.getLLMSettings());
      setAuthorProfile(await db.getAuthorProfile());
      const enabled = await db.getDiffPaneEnabled();
      setDiffPaneEnabled(enabled);
    }
    load();
  }, []);

  const saveRules = async (newRules: UserRule[]) => {
    setRules(newRules);
    await db.saveUserRules(newRules);
  };

  const addIgnoredTerm = async (term: string) => {
    const added = await db.addIgnoredTerm(term);
    setIgnoredTerms(prev => [...prev, added]);
  };

  const removeIgnoredTerm = async (id: string) => {
    await db.removeIgnoredTerm(id);
    setIgnoredTerms(prev => prev.filter(t => t.id !== id));
  };

  const saveLLMSettings = async (settings: LLMSettings) => {
    setLLMSettings(settings);
    await db.saveLLMSettings(settings);
  };

  const saveDiffPaneEnabled = async (enabled: boolean) => {
    setDiffPaneEnabled(enabled);
    await db.saveDiffPaneEnabled(enabled);
  };

  const saveAuthorProfile = async (profile: AuthorProfile) => {
    setAuthorProfile(profile);
    await db.saveAuthorProfile(profile);
  };

  return {
    rules,
    ignoredTerms,
    llmSettings,
    diffPaneEnabled,
    authorProfile,
    saveRules,
    addIgnoredTerm,
    removeIgnoredTerm,
    saveLLMSettings,
    saveDiffPaneEnabled,
    saveAuthorProfile,
  };
}
