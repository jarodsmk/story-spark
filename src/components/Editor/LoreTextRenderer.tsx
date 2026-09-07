import React from 'react';
import { User, Compass } from 'lucide-react';
import { LoreEntry, findLoreReferences, LoreReferenceMatch } from '../../engine/lore/loreReference.ts';
import { Suggestion } from '../../types/index.ts';

interface LoreTextRendererProps {
  text: string;
  entries: LoreEntry[] | Map<string, LoreEntry>;
  onHoverReference: (ref: LoreReferenceMatch, pos: { x: number; y: number }) => void;
  onLeaveReference: () => void;
  onClickReference?: (ref: LoreReferenceMatch) => void;
  focusedSuggestion?: Suggestion | null;
}

export const LoreTextRenderer: React.FC<LoreTextRendererProps> = ({
  text,
  entries,
  onHoverReference,
  onLeaveReference,
  onClickReference,
  focusedSuggestion,
}) => {
  if (!text) {
    return <span className="text-stone-500 italic">No text in scene.</span>;
  }

  const references = findLoreReferences(text, entries);

  // If no references and no focused suggestions, render plain text
  if (references.length === 0 && !focusedSuggestion) {
    return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
  }

  // Split text by references to render interactive highlighted spans
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  for (let i = 0; i < references.length; i++) {
    const ref = references[i];

    // Append text prior to reference
    if (ref.startIndex > lastIndex) {
      const chunk = text.substring(lastIndex, ref.startIndex);
      elements.push(
        <span key={`text-${lastIndex}`}>{chunk}</span>
      );
    }

    const isCharacter = ref.entry ? ref.entry.category === 'character' : ref.targetPath.includes('characters');

    elements.push(
      <span
        key={`ref-${ref.startIndex}-${ref.endIndex}`}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onHoverReference(ref, { x: rect.left, y: rect.bottom });
        }}
        onMouseLeave={onLeaveReference}
        onClick={(e) => {
          e.stopPropagation();
          if (onClickReference) onClickReference(ref);
        }}
        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded cursor-pointer transition-all border-b font-medium select-text ${
          isCharacter
            ? 'bg-amber-500/15 text-amber-200 border-amber-400/60 hover:bg-amber-500/25 hover:border-amber-300'
            : 'bg-cyan-500/15 text-cyan-200 border-cyan-400/60 hover:bg-cyan-500/25 hover:border-cyan-300'
        }`}
        title={`Click to view ${ref.entry?.name || ref.anchorText} in Story Bible`}
      >
        {isCharacter ? (
          <User className="w-3 h-3 text-amber-400/80 inline-block flex-shrink-0" />
        ) : (
          <Compass className="w-3 h-3 text-cyan-400/80 inline-block flex-shrink-0" />
        )}
        <span>{ref.anchorText}</span>
      </span>
    );

    lastIndex = ref.endIndex;
  }

  // Trailing text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-tail`}>{text.substring(lastIndex)}</span>
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed select-text font-serif">
      {elements}
    </div>
  );
};
