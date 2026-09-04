import React, { useState } from 'react';
import { LLMSettings } from '../../types/index.ts';
import { Shield } from 'lucide-react';

interface AITabProps {
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
}

export const AITab: React.FC<AITabProps> = ({ settings, onSave }) => {
  const [local, setLocal] = useState(settings);

  return (
    <div className="space-y-2">
      <div className="p-2 bg-emerald-950/40 border border-emerald-900 rounded text-emerald-300 text-[10px] flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Privacy: Only the selected passage is sent. Zero manuscript uploads.</span>
      </div>
      <div>
        <label className="text-stone-400 text-[11px]">Base URL</label>
        <input
          type="text"
          value={local.baseUrl}
          onChange={e => setLocal({ ...local, baseUrl: e.target.value })}
          className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 mt-0.5 text-xs"
        />
      </div>
      <div>
        <label className="text-stone-400 text-[11px]">API Key</label>
        <input
          type="password"
          value={local.apiKey}
          onChange={e => setLocal({ ...local, apiKey: e.target.value })}
          placeholder="sk-... or blank for local"
          className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 mt-0.5 text-xs"
        />
      </div>
      <div>
        <label className="text-stone-400 text-[11px]">Model Name</label>
        <input
          type="text"
          value={local.model}
          onChange={e => setLocal({ ...local, model: e.target.value })}
          className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 mt-0.5 text-xs"
        />
      </div>
      <button
        onClick={() => onSave(local)}
        className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded mt-2 text-xs"
      >
        Save Model Settings
      </button>
    </div>
  );
};
