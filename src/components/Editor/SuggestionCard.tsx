import React from 'react';
import { Suggestion } from '../../types/index.ts';
import { Check, X, EyeOff, Crosshair } from 'lucide-react';

interface SuggestionCardProps {
  item: Suggestion;
  isSelected?: boolean;
  onSelect?: (item: Suggestion) => void;
  onAccept: (item: Suggestion) => void;
  onDismiss: (item: Suggestion) => void;
  onIgnoreTerm?: (term: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  item,
  isSelected = false,
  onSelect,
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
      case 'grammar':
        return <span className="bg-red-950/80 text-red-400 border border-red-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Grammar</span>;
      case 'filter-word':
        return <span className="bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Filter</span>;
      case 'weak-word':
        return <span className="bg-orange-950/80 text-orange-400 border border-orange-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Weak</span>;
      case 'redundant-adverb':
        return <span className="bg-pink-950/80 text-pink-400 border border-pink-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Modifier</span>;
      case 'cliche':
        return <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">Cliché</span>;
      default:
        return <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">AI Draft</span>;
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className={`rounded p-3 space-y-2 text-xs transition cursor-pointer relative ${
        isSelected
          ? 'bg-amber-950/25 border-2 border-amber-500/90 shadow-md shadow-amber-950/50'
          : 'bg-stone-950/70 border border-stone-800 hover:border-stone-700 hover:bg-stone-950/90'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 truncate">
          {getBadge()}
          <span className="font-medium text-stone-200 truncate">{item.title}</span>
        </div>
        {isSelected ? (
          <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950 border border-amber-700/80 px-1.5 py-0.5 rounded font-medium flex-shrink-0 animate-pulse">
            <Crosshair className="w-3 h-3 text-amber-400" /> Focused
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(item);
            }}
            title="Navigate to passage in editor"
            className="text-stone-400 hover:text-amber-300 p-1 rounded hover:bg-stone-800/60 transition flex items-center gap-1 text-[10px]"
          >
            <Crosshair className="w-3 h-3" /> Focus
          </button>
        )}
      </div>

      <p className="text-stone-400 leading-normal">{item.description}</p>

      {item.originalText !== item.replacementText && (
        <div className="bg-stone-900 rounded p-2 border border-stone-800/60 font-mono text-[11px] space-y-1">
          <div className="text-rose-400/90 line-through truncate">- {item.originalText}</div>
          <div className="text-emerald-400 font-medium truncate">+ {item.replacementText}</div>
        </div>
      )}

      <div
        className="flex items-center justify-end space-x-2 pt-1 border-t border-stone-800/50"
        onClick={(e) => e.stopPropagation()}
      >
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
