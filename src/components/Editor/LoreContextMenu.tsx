import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Compass,
  UserPlus,
  BookmarkPlus,
  Search,
  Check,
  Unlink,
  ExternalLink,
  Tag,
  X,
  Sparkles,
} from 'lucide-react';
import { LoreEntry, LoreReferenceMatch } from '../../engine/lore/loreReference.ts';

interface LoreContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  selectedText: string;
  startIndex: number;
  endIndex: number;
  existingReference?: LoreReferenceMatch | null;
  characters: LoreEntry[];
  loreItems: LoreEntry[];
  onSelectReference: (targetPath: string) => void;
  onOpenNewModal: (category: 'character' | 'world') => void;
  onOpenGenerateContent?: (selectedText: string, startIndex: number, endIndex: number) => void;
  onAIRewrite?: (instruction: string) => void;
  onUnlinkReference?: () => void;
  onOpenBibleFile?: (path: string) => void;
  onClose: () => void;
}

export const LoreContextMenu: React.FC<LoreContextMenuProps> = ({
  isOpen,
  x,
  y,
  selectedText,
  startIndex,
  endIndex,
  existingReference,
  characters,
  loreItems,
  onSelectReference,
  onOpenNewModal,
  onOpenGenerateContent,
  onAIRewrite,
  onUnlinkReference,
  onOpenBibleFile,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter lists based on search query
  const query = search.trim().toLowerCase();
  const filteredCharacters = characters.filter(
    (c) => c.name.toLowerCase().includes(query) || (c.attributes['Role'] || '').toLowerCase().includes(query)
  );
  const filteredLore = loreItems.filter(
    (l) => l.name.toLowerCase().includes(query) || l.summary.toLowerCase().includes(query)
  );

  // Calculate position with viewport boundary checking
  const menuWidth = 288; // 18rem
  const menuHeight = 360;
  let posX = x;
  let posY = y;

  if (typeof window !== 'undefined') {
    if (posX + menuWidth > window.innerWidth - 16) {
      posX = Math.max(16, window.innerWidth - menuWidth - 16);
    }
    if (posY + menuHeight > window.innerHeight - 16) {
      posY = Math.max(16, window.innerHeight - menuHeight - 16);
    }
  }

  const cleanSelected = selectedText.length > 28
    ? `${selectedText.substring(0, 25)}...`
    : selectedText;

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 bg-stone-900/95 backdrop-blur-md border border-stone-700/80 shadow-2xl rounded-lg py-1.5 w-72 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Context Menu Header */}
      <div className="px-3 py-1.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 truncate">
          <Tag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-semibold text-stone-200 truncate">
            {existingReference ? 'Lore Reference' : 'Reference'}
          </span>
          <span className="text-stone-400 font-mono text-[11px] truncate">
            "{cleanSelected}"
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-500 hover:text-stone-300 p-0.5 rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI Generate Content Action */}
      <div className="p-1.5 border-b border-stone-800 bg-amber-950/20 space-y-1">
        <button
          type="button"
          onClick={() => {
            if (onOpenGenerateContent) {
              onOpenGenerateContent(selectedText, startIndex, endIndex);
            }
            onClose();
          }}
          className="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-700/15 hover:from-amber-500/25 hover:to-amber-700/25 text-amber-200 hover:text-amber-100 flex items-center justify-between transition border border-amber-500/30 group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-150">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-amber-200 group-hover:text-amber-100 flex items-center gap-1.5">
                <span>Generate Content...</span>
              </div>
              <div className="text-[10px] text-amber-400/80">
                Draft with connected LLM
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
            AI
          </span>
        </button>

        {onAIRewrite && selectedText.trim() && (
          <button
            type="button"
            onClick={() => {
              onAIRewrite('Polish and tighten prose while maintaining voice');
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-stone-850 hover:bg-amber-950/40 text-stone-300 hover:text-amber-200 flex items-center justify-between transition border border-stone-700/60 group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-150">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-stone-200 group-hover:text-amber-200 flex items-center gap-1.5">
                  <span>Rewrite Selection with AI</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  Polish prose with connected LLM
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium uppercase bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20">
              Rewrite
            </span>
          </button>
        )}
      </div>

      {/* Existing reference actions if already linked */}
      {existingReference && (
        <div className="p-2 border-b border-stone-800/80 bg-stone-950/40 space-y-1">
          <div className="text-[11px] text-amber-300/90 font-medium px-1 flex items-center gap-1">
            <Check className="w-3 h-3 text-amber-400" />
            <span>Currently linked to {existingReference.entry?.name || existingReference.targetPath}</span>
          </div>
          <div className="flex items-center space-x-1 pt-1">
            {onOpenBibleFile && (
              <button
                type="button"
                onClick={() => {
                  onOpenBibleFile(existingReference.entry?.path || existingReference.targetPath);
                  onClose();
                }}
                className="flex-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center justify-center gap-1 text-[11px] transition"
              >
                <ExternalLink className="w-3 h-3 text-amber-400" /> View in Bible
              </button>
            )}
            {onUnlinkReference && (
              <button
                type="button"
                onClick={() => {
                  onUnlinkReference();
                  onClose();
                }}
                className="flex-1 px-2 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 rounded flex items-center justify-center gap-1 text-[11px] transition border border-rose-800/40"
              >
                <Unlink className="w-3 h-3" /> Unlink
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Filter for entries */}
      {(characters.length > 2 || loreItems.length > 2) && (
        <div className="px-2 pt-2 pb-1">
          <div className="relative">
            <Search className="w-3 h-3 text-stone-500 absolute left-2 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter characters or lore..."
              autoFocus
              className="w-full bg-stone-950/80 border border-stone-800 rounded pl-6 pr-2 py-1 text-[11px] text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>
      )}

      {/* Scrollable list of entries */}
      <div className="max-h-56 overflow-y-auto px-1 py-1 space-y-2">
        {/* Characters Section */}
        <div>
          <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-amber-400" /> Characters
            </span>
            <span className="font-mono text-stone-500">{filteredCharacters.length}</span>
          </div>

          {filteredCharacters.length === 0 ? (
            <div className="px-3 py-1 text-[11px] text-stone-500 italic">
              {query ? 'No matching characters' : 'No characters added yet'}
            </div>
          ) : (
            filteredCharacters.map((c) => {
              const isCurrent = existingReference?.entry?.id === c.id || existingReference?.targetPath === c.path;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectReference(c.path);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between group transition ${
                    isCurrent
                      ? 'bg-amber-950/60 text-amber-200 border border-amber-800/60'
                      : 'hover:bg-stone-800/80 text-stone-200'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-medium truncate group-hover:text-amber-300 transition">
                      {c.name}
                    </div>
                    {c.attributes['Role'] && (
                      <div className="text-[10px] text-stone-400 truncate">
                        {c.attributes['Role']}
                      </div>
                    )}
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Lore & World Section */}
        <div>
          <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" /> Lore & World
            </span>
            <span className="font-mono text-stone-500">{filteredLore.length}</span>
          </div>

          {filteredLore.length === 0 ? (
            <div className="px-3 py-1 text-[11px] text-stone-500 italic">
              {query ? 'No matching lore entries' : 'No lore entries added yet'}
            </div>
          ) : (
            filteredLore.map((l) => {
              const isCurrent = existingReference?.entry?.id === l.id || existingReference?.targetPath === l.path;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    onSelectReference(l.path);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between group transition ${
                    isCurrent
                      ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-800/60'
                      : 'hover:bg-stone-800/80 text-stone-200'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-medium truncate group-hover:text-cyan-300 transition">
                      {l.name}
                    </div>
                    {l.summary && (
                      <div className="text-[10px] text-stone-400 truncate">
                        {l.summary}
                      </div>
                    )}
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Creation Actions: Add New Character / Add New Lore */}
      <div className="pt-1.5 mt-1 border-t border-stone-800 px-1 space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onOpenNewModal('character');
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-950/50 text-amber-300 hover:text-amber-200 flex items-center gap-2 transition"
        >
          <UserPlus className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium">Add New Character...</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenNewModal('world');
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-cyan-950/50 text-cyan-300 hover:text-cyan-200 flex items-center gap-2 transition"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium">Add New Lore Entry...</span>
        </button>
      </div>
    </div>
  );
};
