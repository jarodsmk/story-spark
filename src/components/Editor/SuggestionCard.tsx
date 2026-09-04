import React from 'react';
import { Suggestion } from '../../types/index.ts';
import { Check, X, EyeOff } from 'lucide-react';

interface SuggestionCardProps {
  item: Suggestion;
  onAccept: (item: Suggestion) => void;
  onDismiss: (item: Suggestion) => void;
  onIgnoreTerm?: (term: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  item,
  onAccept,
  onDismiss,
  onIgnoreTerm,
}) => {
  const getBadge = () => {
    switch (item.type) {
      case 'repeated-word':
        return <span className="bg-rose-950/80 text-rose-400 border border-rose-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Repeat</span>;
      case 'sentence-length':
        return <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Length</span>;
      case 'passive-voice':
        return <span className="bg-blue-950/80 text-blue-400 border border-blue-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Passive</span>;
      case 'typography':
        return <span className="bg-purple-950/80 text-purple-400 border border-purple-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Typo</span>;
      default:
        return <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">AI Draft</span>;
    }
  };

  return (
    <div className="bg-stone-950/70 border border-stone-800 rounded p-3 space-y-2 text-xs hover:border-stone-700 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 truncate">
          {getBadge()}
          <span className="font-medium text-stone-300 truncate">{item.title}</span>
        </div>
      </div>

      <p className="text-stone-400 leading-normal">{item.description}</p>

      {item.originalText !== item.replacementText && (
        <div className="bg-stone-900 rounded p-2 border border-stone-800/60 font-mono text-[11px] space-y-1">
          <div className="text-rose-400/90 line-through truncate">- {item.originalText}</div>
          <div className="text-emerald-400 font-medium truncate">+ {item.replacementText}</div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-stone-800/50">
        {item.type === 'repeated-word' && onIgnoreTerm && (
          <button
            onClick={() => onIgnoreTerm(item.originalText.trim().split(/\s+/)[0])}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1 rounded bg-stone-800/60"
          >
            <EyeOff className="w-3 h-3" /> Ignore
          </button>
        )}
        <button
          onClick={() => onDismiss(item)}
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1 rounded bg-stone-800/60"
        >
          <X className="w-3 h-3" /> Dismiss
        </button>
        <button
          onClick={() => onAccept(item)}
          className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-800 hover:bg-emerald-900/90 px-2.5 py-1 rounded font-medium transition"
        >
          <Check className="w-3 h-3" /> Accept
        </button>
      </div>
    </div>
  );
};
