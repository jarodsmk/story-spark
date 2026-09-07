import React from 'react';
import { User, Compass, ExternalLink, Lightbulb } from 'lucide-react';
import { LoreEntry } from '../../engine/lore/loreReference.ts';

interface LoreHoverTooltipProps {
  entry?: LoreEntry | null;
  anchorText: string;
  targetPath: string;
  position: { x: number; y: number };
  onOpenEntry?: (path: string) => void;
}

export const LoreHoverTooltip: React.FC<LoreHoverTooltipProps> = ({
  entry,
  anchorText,
  targetPath,
  position,
  onOpenEntry,
}) => {
  const isCharacter = entry ? entry.category === 'character' : targetPath.includes('characters');
  const isIdea = entry ? entry.category === 'idea' : (targetPath.includes('scratchpad') || targetPath.includes('ideas'));
  const title = entry?.name || anchorText;
  const summary = entry?.summary || (entry?.attributes?.Role ? `Role: ${entry.attributes.Role}` : isIdea ? `Scratchpad Idea: ${targetPath}` : `Referenced bible entry: ${targetPath}`);

  // Prevent tooltip from overflowing the viewport
  const left = Math.min(Math.max(12, position.x - 120), window.innerWidth - 320);
  const top = position.y + 24;

  return (
    <div
      className="fixed z-50 pointer-events-auto shadow-2xl rounded-lg border border-stone-700/80 bg-stone-900/95 backdrop-blur-md p-3.5 w-72 text-xs select-none transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{ left: `${left}px`, top: `${top}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
        <div className="flex items-center space-x-2 truncate">
          {isCharacter ? (
            <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <User className="w-3.5 h-3.5" />
            </span>
          ) : isIdea ? (
            <span className="p-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Lightbulb className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="p-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Compass className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="font-semibold text-stone-100 truncate text-[13px]">{title}</span>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider ${
            isCharacter
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
              : isIdea
              ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
          }`}
        >
          {isCharacter ? 'Character' : isIdea ? 'Idea' : 'Lore / World'}
        </span>
      </div>

      {/* Summary Content */}
      <div className="text-stone-300 text-[11px] leading-relaxed mb-3">
        {summary}
      </div>

      {/* Attributes if available */}
      {entry && Object.keys(entry.attributes).length > 0 && (
        <div className="space-y-1 mb-3 pt-2 border-t border-stone-800/60 text-[11px]">
          {entry.attributes['Status'] && (
            <div className="text-stone-400">
              <span className="text-purple-400 font-medium">Status:</span> {entry.attributes['Status']}
            </div>
          )}
          {entry.attributes['Role'] && (
            <div className="text-stone-400">
              <span className="text-stone-500 font-medium">Role:</span> {entry.attributes['Role']}
            </div>
          )}
          {entry.attributes['Tags'] && (
            <div className="text-stone-400 truncate">
              <span className="text-stone-500 font-medium">Tags:</span> {entry.attributes['Tags']}
            </div>
          )}
          {entry.attributes['Appearance'] && (
            <div className="text-stone-400 truncate">
              <span className="text-stone-500 font-medium">Appearance:</span> {entry.attributes['Appearance']}
            </div>
          )}
          {entry.attributes['Atmosphere'] && (
            <div className="text-stone-400">
              <span className="text-stone-500 font-medium">Atmosphere:</span> {entry.attributes['Atmosphere']}
            </div>
          )}
          {entry.attributes['Goal'] && (
            <div className="text-stone-400 truncate">
              <span className="text-stone-500 font-medium">Goal:</span> {entry.attributes['Goal']}
            </div>
          )}
        </div>
      )}

      {/* Footer link to bible file */}
      <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-500">
        <span className="font-mono truncate max-w-[150px]">{entry?.filename || targetPath}</span>
        {onOpenEntry && (
          <button
            type="button"
            onClick={() => onOpenEntry(entry?.path || targetPath)}
            className={`flex items-center gap-1 transition hover:underline font-medium ml-2 ${
              isIdea ? 'text-purple-300 hover:text-purple-200' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>{isIdea ? 'Open & Edit Idea' : 'Open Entry'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
