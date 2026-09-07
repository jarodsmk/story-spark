import React, { useState, useEffect } from 'react';
import { User, Compass, X, Sparkles, Plus, Lightbulb } from 'lucide-react';

interface NewLoreModalProps {
  isOpen: boolean;
  initialCategory: 'character' | 'world' | 'idea';
  defaultName: string;
  onSubmit: (
    name: string,
    category: 'character' | 'world' | 'idea',
    details: { roleOrAtmosphere: string; summary: string }
  ) => Promise<void>;
  onClose: () => void;
}

export const NewLoreModal: React.FC<NewLoreModalProps> = ({
  isOpen,
  initialCategory,
  defaultName,
  onSubmit,
  onClose,
}) => {
  const [category, setCategory] = useState<'character' | 'world' | 'idea'>(initialCategory);
  const [name, setName] = useState('');
  const [roleOrAtmosphere, setRoleOrAtmosphere] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setName(defaultName.trim());
      setRoleOrAtmosphere('');
      setSummary('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialCategory, defaultName]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-xs text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/50">
          <div className="flex items-center space-x-2">
            <span
              className={`p-1 rounded border ${
                category === 'character'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : category === 'world'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}
            >
              {category === 'character' ? (
                <User className="w-4 h-4" />
              ) : category === 'world' ? (
                <Compass className="w-4 h-4" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
            </span>
            <span className="font-semibold text-stone-100 text-sm">
              {category === 'idea' ? 'Jot Scratchpad Idea' : 'Add Story Bible Entry'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1 rounded hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category Switcher */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">Entry Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('character')}
                className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition text-center ${
                  category === 'character'
                    ? 'bg-amber-950/60 border-amber-600/80 text-amber-200 font-semibold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Character</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('world')}
                className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition text-center ${
                  category === 'world'
                    ? 'bg-cyan-950/60 border-cyan-600/80 text-cyan-200 font-semibold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lore</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('idea')}
                className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition text-center ${
                  category === 'idea'
                    ? 'bg-purple-950/60 border-purple-600/80 text-purple-200 font-semibold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                <span>Scratchpad</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">
              {category === 'character'
                ? 'Character Name'
                : category === 'world'
                ? 'Lore / World Title'
                : 'Idea Title'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                category === 'character'
                  ? 'e.g. Kaelen Vance'
                  : category === 'world'
                  ? 'e.g. The Port of Ash'
                  : 'e.g. Ancient Belltower Secret Passage'
              }
              required
              autoFocus
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Role / Atmosphere / Status Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">
              {category === 'character'
                ? 'Role / Archetype'
                : category === 'world'
                ? 'Atmosphere / Category'
                : 'Tags / Focus Area'}
            </label>
            <input
              type="text"
              value={roleOrAtmosphere}
              onChange={(e) => setRoleOrAtmosphere(e.target.value)}
              placeholder={
                category === 'character'
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
            <label className="text-[11px] font-medium text-stone-400">
              {category === 'idea' ? 'Idea Notes / Reference Outline' : 'Quick Summary (Shown on Hover)'}
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder={
                category === 'character'
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
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className={`px-4 py-1.5 text-stone-950 font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm disabled:opacity-40 ${
                category === 'idea'
                  ? 'bg-purple-500 hover:bg-purple-400'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Creating...'
                  : category === 'idea'
                  ? 'Save & Link Idea'
                  : 'Create & Reference'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
