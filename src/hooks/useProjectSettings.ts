import { useState, useEffect } from 'react';
import { db } from '../storage/db.ts';
import { UserRule, IgnoredTerm, LLMSettings } from '../types/index.ts';
import { DEFAULT_USER_RULES } from '../engine/checks/index.ts';

export function useProjectSettings() {
  const [rules, setRules] = useState<UserRule[]>(DEFAULT_USER_RULES);
  const [ignoredTerms, setIgnoredTerms] = useState<IgnoredTerm[]>([]);
  const [llmSettings, setLLMSettings] = useState<LLMSettings>({
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'microsoft/wizardlm-2-8x22b',
    systemPrompt: '',
  });

  useEffect(() => {
    async function load() {
      await db.init();
      setRules(await db.getUserRules());
      setIgnoredTerms(await db.getIgnoredTerms());
      setLLMSettings(await db.getLLMSettings());
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

  return {
    rules,
    ignoredTerms,
    llmSettings,
    saveRules,
    addIgnoredTerm,
    removeIgnoredTerm,
    saveLLMSettings,
  };
}
