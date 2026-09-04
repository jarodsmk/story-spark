import React, { useState } from 'react';
import { IgnoredTerm } from '../../types/index.ts';
import { Trash2 } from 'lucide-react';

interface TermsTabProps {
  terms: IgnoredTerm[];
  onAdd: (term: string) => void;
  onRemove: (id: string) => void;
}

export const TermsTab: React.FC<TermsTabProps> = ({ terms, onAdd, onRemove }) => {
  const [val, setVal] = useState('');

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <input
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="Add custom dictionary word..."
          className="flex-1 bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 text-xs"
        />
        <button
          onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs"
        >
          Add
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {terms.length === 0 ? (
          <p className="text-stone-500 italic py-2">No ignored terms.</p>
        ) : (
          terms.map(t => (
            <div key={t.id} className="flex justify-between items-center p-1.5 bg-stone-950 rounded border border-stone-800">
              <span className="font-mono text-stone-300">{t.term}</span>
              <button onClick={() => onRemove(t.id)} className="text-stone-500 hover:text-rose-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
