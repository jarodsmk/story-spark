import React, { useState, useEffect, useRef } from 'react';
import { User, Compass, X, Sparkles, Plus, Lightbulb, BookText } from 'lucide-react';

export type EntryCategory = 'character' | 'world' | 'idea' | 'scene';

export interface NewLoreModalProps {
  isOpen: boolean;
  initialCategory?: EntryCategory;
  defaultName?: string;
  allowScene?: boolean;
  onSubmit: (
    name: string,
    category: EntryCategory,
    details: { roleOrAtmosphere: string; summary: string }
  ) => Promise<void>;
  onClose: () => void;
}

export const NewLoreModal: React.FC<NewLoreModalProps> = ({
  isOpen,
  initialCategory = 'character',
  defaultName = '',
  allowScene = false,
  onSubmit,
  onClose,
}) => {
  const [category, setCategory] = useState<EntryCategory>(initialCategory);
  const [name, setName] = useState('');
  const [roleOrAtmosphere, setRoleOrAtmosphere] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setName(defaultName.trim());
      setRoleOrAtmosphere('');
      setSummary('');
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialCategory, defaultName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), category, {
        roleOrAtmosphere: roleOrAtmosphere.trim(),
        summary: summary.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to create entry', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderIcon = () => {
    switch (category) {
      case 'scene':
        return <BookText className="w-4 h-4 text-amber-400" />;
      case 'character':
        return <User className="w-4 h-4 text-blue-400" />;
      case 'world':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'idea':
      default:
        return <Lightbulb className="w-4 h-4 text-purple-400" />;
    }
  };

  const getHeaderBadgeClass = () => {
    switch (category) {
      case 'scene':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'character':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'world':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'idea':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  const getHeaderTitle = () => {
    switch (category) {
      case 'scene':
        return 'New Manuscript Scene';
      case 'character':
        return 'New Character Profile';
      case 'world':
        return 'New World & Lore Entry';
      case 'idea':
      default:
        return 'Jot Scratchpad Idea';
    }
  };

  return (
    <div
      id="new-entry-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="new-entry-modal-card"
        className="bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-xs text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center space-x-2">
            <span className={`p-1 rounded border ${getHeaderBadgeClass()}`}>
              {getHeaderIcon()}
            </span>
            <span className="font-semibold text-stone-100 text-sm">
              {getHeaderTitle()}
            </span>
          </div>
          <button
            type="button"
            id="new-entry-modal-close-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1 rounded hover:bg-stone-800 transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category Switcher */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">Entry Type</label>
            <div className={`grid ${allowScene ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
              {allowScene && (
                <button
                  type="button"
                  id="new-entry-modal-cat-scene"
                  onClick={() => setCategory('scene')}
                  className={`py-2 px-1.5 rounded-lg border flex items-center justify-center gap-1 transition text-center ${
                    category === 'scene'
                      ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 font-semibold shadow-xs'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <BookText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">Scene</span>
                </button>
              )}

              <button
                type="button"
                id="new-entry-modal-cat-character"
                onClick={() => setCategory('character')}
                className={`py-2 px-1.5 rounded-lg border flex items-center justify-center gap-1 transition text-center ${
                  category === 'character'
                    ? 'bg-blue-950/60 border-blue-500/80 text-blue-200 font-semibold shadow-xs'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="truncate">Character</span>
              </button>

              <button
                type="button"
                id="new-entry-modal-cat-world"
                onClick={() => setCategory('world')}
                className={`py-2 px-1.5 rounded-lg border flex items-center justify-center gap-1 transition text-center ${
                  category === 'world'
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-semibold shadow-xs'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">World</span>
              </button>

              <button
                type="button"
                id="new-entry-modal-cat-idea"
                onClick={() => setCategory('idea')}
                className={`py-2 px-1.5 rounded-lg border flex items-center justify-center gap-1 transition text-center ${
                  category === 'idea'
                    ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 font-semibold shadow-xs'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="truncate">Scratchpad</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="new-entry-modal-name-input" className="text-[11px] font-medium text-stone-400">
              {category === 'scene'
                ? 'Scene Title'
                : category === 'character'
                ? 'Character Name'
                : category === 'world'
                ? 'Lore / World Title'
                : 'Idea Title'}
            </label>
            <input
              ref={inputRef}
              id="new-entry-modal-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                category === 'scene'
                  ? 'e.g. Chapter 1: The Whispering Gates'
                  : category === 'character'
                  ? 'e.g. Kaelen Vance'
                  : category === 'world'
                  ? 'e.g. The Port of Ash'
                  : 'e.g. Dual Eclipse Plot Twist'
              }
              required
              autoFocus
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Role / Atmosphere / Status Field */}
          <div className="space-y-1.5">
            <label htmlFor="new-entry-modal-role-input" className="text-[11px] font-medium text-stone-400">
              {category === 'scene'
                ? 'POV / Setting'
                : category === 'character'
                ? 'Role / Archetype'
                : category === 'world'
                ? 'Atmosphere / Category'
                : 'Tags / Focus Area'}
            </label>
            <input
              id="new-entry-modal-role-input"
              type="text"
              value={roleOrAtmosphere}
              onChange={(e) => setRoleOrAtmosphere(e.target.value)}
              placeholder={
                category === 'scene'
                  ? 'e.g. Kaelen POV, High Citadel Courtyard'
                  : category === 'character'
                  ? 'e.g. Reluctant Scout, Mentor, Inquisitor'
                  : category === 'world'
                  ? 'e.g. Coastal Harbor, Ancient Faction, Magitech Relic'
                  : 'e.g. Subplot Hook, Foreshadowing, Clue'
              }
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Summary / Notes Field */}
          <div className="space-y-1.5">
            <label htmlFor="new-entry-modal-summary-input" className="text-[11px] font-medium text-stone-400">
              {category === 'scene'
                ? 'Scene Outline / Synopsis'
                : category === 'idea'
                ? 'Idea Notes / Reference Outline'
                : 'Quick Summary (Shown on Hover)'}
            </label>
            <textarea
              id="new-entry-modal-summary-input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder={
                category === 'scene'
                  ? 'e.g. Kaelen discovers the stolen cipher and decides to flee before nightfall...'
                  : category === 'character'
                  ? 'e.g. Tall, weathered hands. Deliver the encrypted atlas before the Grand Inquisitor seals the gates.'
                  : category === 'world'
                  ? 'e.g. Drenched in perpetual fog, smelling of salted timber and bitter sea spray.'
                  : 'e.g. If the protagonist pulls the lower lever, the resonance cancels out the sound barrier...'
              }
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none font-sans"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              id="new-entry-modal-cancel-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="new-entry-modal-submit-btn"
              disabled={!name.trim() || isSubmitting}
              className={`px-4 py-1.5 font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm disabled:opacity-40 cursor-pointer ${
                category === 'scene'
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                  : category === 'character'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : category === 'world'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Creating...'
                  : category === 'scene'
                  ? 'Create Scene'
                  : category === 'character'
                  ? 'Create Character'
                  : category === 'world'
                  ? 'Create Lore Entry'
                  : 'Create Idea'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

