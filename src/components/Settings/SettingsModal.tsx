import React, { useState } from 'react';
import { UserRule, IgnoredTerm, LLMSettings } from '../../types/index.ts';
import { X, Sliders } from 'lucide-react';
import { RulesTab } from './RulesTab.tsx';
import { AITab } from './AITab.tsx';
import { TermsTab } from './TermsTab.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: UserRule[];
  onSaveRules: (rules: UserRule[]) => void;
  ignoredTerms: IgnoredTerm[];
  onAddIgnoredTerm: (term: string) => void;
  onRemoveIgnoredTerm: (id: string) => void;
  llmSettings: LLMSettings;
  onSaveLLMSettings: (settings: LLMSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  ignoredTerms,
  onAddIgnoredTerm,
  onRemoveIgnoredTerm,
  llmSettings,
  onSaveLLMSettings,
}) => {
  const [tab, setTab] = useState<'rules' | 'ai' | 'terms'>('rules');

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    onSaveRules(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg w-full max-w-sm flex flex-col shadow-2xl text-xs">
        <div className="h-10 border-b border-stone-800 px-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-medium text-stone-200">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>StorySpark Settings</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-stone-800 px-2 bg-stone-950/40">
          {(['rules', 'ai', 'terms'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-1.5 px-3 border-b-2 font-medium capitalize ${tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400'}`}
            >
              {t === 'ai' ? 'BYOM' : t}
            </button>
          ))}
        </div>

        <div className="p-3">
          {tab === 'rules' && <RulesTab rules={rules} onToggle={handleToggle} />}
          {tab === 'ai' && <AITab settings={llmSettings} onSave={onSaveLLMSettings} />}
          {tab === 'terms' && <TermsTab terms={ignoredTerms} onAdd={onAddIgnoredTerm} onRemove={onRemoveIgnoredTerm} />}
        </div>
      </div>
    </div>
  );
};
