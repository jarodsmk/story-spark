import React from 'react';
import { UserRule } from '../../types/index.ts';

interface RulesTabProps {
  rules: UserRule[];
  onToggle: (id: string) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({ rules, onToggle }) => {
  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
      <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-stone-200">Compromise NLP Rule Engine</span>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Validation runs fluidly through spencermountain/compromise for rapid local text analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-amber-400 font-medium">
            {activeCount}/{rules.length} Active
          </span>
          <span className="text-[10px] bg-sky-950/80 text-sky-400 border border-sky-800/60 px-2 py-0.5 rounded font-mono">
            compromise v14
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {rules.map((r) => (
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
