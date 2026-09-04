import React, { useState } from 'react';
import { UserRule } from '../../types/index.ts';

interface RulesTabProps {
  rules: UserRule[];
  onToggle: (id: string) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({ rules, onToggle }) => (
  <div className="space-y-2">
    {rules.map(r => (
      <div key={r.id} className="p-2 bg-stone-950/70 border border-stone-800 rounded flex items-center justify-between">
        <div>
          <div className="font-medium text-stone-200">{r.name}</div>
          <div className="text-[10px] text-stone-500">{r.description}</div>
        </div>
        <input type="checkbox" checked={r.enabled} onChange={() => onToggle(r.id)} className="w-4 h-4 accent-amber-600" />
      </div>
    ))}
  </div>
);
