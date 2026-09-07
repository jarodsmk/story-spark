import React, { useState, useEffect } from 'react';
import { User, Compass, X, Sparkles, Plus } from 'lucide-react';

interface NewLoreModalProps {
  isOpen: boolean;
  initialCategory: 'character' | 'world';
  defaultName: string;
  onSubmit: (
    name: string,
    category: 'character' | 'world',
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
  const [category, setCategory] = useState<'character' | 'world'>(initialCategory);
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
      console.error('Failed to create bible entry', err);
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
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-semibold text-stone-100 text-sm">
              Add Story Bible Entry
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('character')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition ${
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
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition ${
                  category === 'world'
                    ? 'bg-cyan-950/60 border-cyan-600/80 text-cyan-200 font-semibold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lore & World</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">
              {category === 'character' ? 'Character Name' : 'Lore / World Title'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={category === 'character' ? 'e.g. Kaelen Vance' : 'e.g. The Port of Ash'}
              required
              autoFocus
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Role / Atmosphere Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">
              {category === 'character' ? 'Role / Archetype' : 'Atmosphere / Category'}
            </label>
            <input
              type="text"
              value={roleOrAtmosphere}
              onChange={(e) => setRoleOrAtmosphere(e.target.value)}
              placeholder={
                category === 'character'
                  ? 'e.g. Reluctant Scout, Mentor, Inquisitor'
                  : 'e.g. Coastal Harbor, Ancient Faction, Magitech Relic'
              }
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Summary / Notes Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-stone-400">
              Quick Summary (Shown on Hover)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder={
                category === 'character'
                  ? 'e.g. Tall, weathered hands. Deliver the encrypted atlas before the Grand Inquisitor seals the gates.'
                  : 'e.g. Drenched in perpetual fog, smelling of salted timber and bitter sea spray.'
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
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create & Reference'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
