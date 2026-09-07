import React from 'react';
import { UserRule } from '../../types/index.ts';

interface RulesTabProps {
  rules: UserRule[];
  onToggle: (id: string) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({ rules, onToggle }) => {
  const grammarRules = rules.filter(
    (r) =>
      r.category === 'repeated-word' ||
      r.category === 'grammar-confusions' ||
      r.category === 'article-agreement'
  );

  const styleRules = rules.filter(
    (r) =>
      r.category === 'passive-voice' ||
      r.category === 'sentence-length' ||
      r.category === 'filter-words' ||
      r.category === 'weak-words' ||
      r.category === 'redundant-adverbs' ||
      r.category === 'cliches'
  );

  const typographyRules = rules.filter((r) => r.category === 'typography');

  const renderSection = (title: string, sectionRules: UserRule[]) => {
    if (sectionRules.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 px-1">
          {title} ({sectionRules.filter((r) => r.enabled).length}/{sectionRules.length} Active)
        </h4>
        <div className="space-y-1.5">
          {sectionRules.map((r) => (
            <div
              key={r.id}
              onClick={() => onToggle(r.id)}
              className={`p-2.5 rounded border transition cursor-pointer flex items-center justify-between ${
                r.enabled
                  ? 'bg-stone-900/90 border-stone-700/80 hover:border-amber-500/50'
                  : 'bg-stone-950/40 border-stone-800/50 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="pr-3">
                <div className="font-medium text-sm text-stone-200">{r.name}</div>
                <div className="text-xs text-stone-400 mt-0.5">{r.description}</div>
              </div>
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={() => onToggle(r.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer flex-shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-h-[460px] overflow-y-auto pr-1">
      {renderSection('Grammar & Mechanics', grammarRules)}
      {renderSection('Style & Narrative Craft', styleRules)}
      {renderSection('Typography & Formatting', typographyRules)}
    </div>
  );
};
