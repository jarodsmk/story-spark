import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  Save,
  Check,
  Search,
  BookOpen,
  Tag,
  User,
  Shield,
  Heart,
  Eye,
  Target,
  Sparkles,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  ChevronRight,
  Code,
} from 'lucide-react';
import { FileItem, fs } from '../../storage/fs.ts';
import {
  CharacterMetadata,
  CustomAttribute,
  createDefaultCharacterMetadata,
  parseCharacterMetadata,
  serializeCharacterMetadata,
} from '../../engine/lore/characterMetadata.ts';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterFiles: FileItem[];
  activeNovelId: string;
  novelTitle?: string;
  initialSelectedPath?: string;
  onSelectCharacterInEditor?: (path: string) => void;
  onSaveCharacter: (path: string, metadata: CharacterMetadata) => Promise<void>;
  onCreateCharacter: (metadata: CharacterMetadata) => Promise<string>;
  onDeleteCharacter: (path: string) => Promise<void>;
}

const COMMON_ROLES = [
  'Protagonist',
  'Antagonist',
  'Deuteragonist',
  'Supporting Character',
  'Mentor',
  'Foil',
  'Love Interest',
  'Rival',
  'Sidekick',
  'Inquisitor',
  'Scout',
  'Herald',
];

const COMMON_STATUSES = [
  'Active',
  'Major Character',
  'Supporting',
  'Deceased',
  'Missing',
  'Captured',
  'Unknown',
  'Inactive',
];

const COMMON_ARCHETYPES = [
  'Reluctant Hero',
  'The Mentor / Sage',
  'The Trickster / Rogue',
  'The Outlaw / Rebel',
  'The Caregiver / Protector',
  'The Explorer / Seeker',
  'The Ruler / Commander',
  'The Innocent',
  'The Magician / Scholar',
  'The Lover',
];

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  characterFiles,
  activeNovelId,
  novelTitle = 'Active Novel',
  initialSelectedPath,
  onSelectCharacterInEditor,
  onSaveCharacter,
  onCreateCharacter,
  onDeleteCharacter,
}) => {
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [draft, setDraft] = useState<CharacterMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newNameInput, setNewNameInput] = useState<string>('');
  const [newRoleInput, setNewRoleInput] = useState<string>('Protagonist');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load all character files into memory when modal opens
  const loadAllCharacters = async () => {
    setIsLoading(true);
    setSaveError(null);
    try {
      const loaded: CharacterMetadata[] = [];
      for (const file of characterFiles) {
        try {
          const content = await fs.readFile(file.path);
          const meta = parseCharacterMetadata(file.path, content);
          loaded.push(meta);
        } catch (e) {
          console.warn('Failed to parse character file:', file.path, e);
        }
      }
      setCharacters(loaded);

      // Determine selection
      const target = initialSelectedPath || selectedPath;
      if (target && loaded.some((c) => c.filePath === target)) {
        const found = loaded.find((c) => c.filePath === target)!;
        setSelectedPath(found.filePath);
        setDraft({ ...found, customAttributes: [...(found.customAttributes || [])] });
      } else if (loaded.length > 0) {
        setSelectedPath(loaded[0].filePath);
        setDraft({ ...loaded[0], customAttributes: [...(loaded[0].customAttributes || [])] });
      } else {
        setSelectedPath('');
        setDraft(null);
      }
    } catch (err) {
      console.error('Failed to load character list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllCharacters();
      setIsSavedRecently(false);
      setIsCreatingNew(false);
    }
  }, [isOpen, characterFiles, initialSelectedPath]);

  // Handle character selection in list
  const handleSelectCharacter = (char: CharacterMetadata) => {
    setSelectedPath(char.filePath);
    setDraft({
      ...char,
      customAttributes: char.customAttributes ? char.customAttributes.map((a) => ({ ...a })) : [],
    });
    setIsSavedRecently(false);
    setSaveError(null);
    setIsCreatingNew(false);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isOpen && draft) {
          e.preventDefault();
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, draft]);

  // Handle Save
  const handleSave = async () => {
    if (!draft || !draft.name.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSaveCharacter(draft.filePath, draft);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);

      // Update in local state
      setCharacters((prev) =>
        prev.map((c) => (c.filePath === draft.filePath ? { ...draft, updatedAt: Date.now() } : c))
      );
    } catch (err: any) {
      console.error('Failed to save character metadata', err);
      setSaveError(err.message || 'Failed to save character metadata');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Create New Character
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const newMeta = createDefaultCharacterMetadata(newNameInput.trim());
      newMeta.role = newRoleInput.trim() || 'Protagonist';
      const createdPath = await onCreateCharacter(newMeta);
      newMeta.filePath = createdPath;
      newMeta.id = createdPath;

      setCharacters((prev) => [...prev, newMeta]);
      setSelectedPath(createdPath);
      setDraft(newMeta);
      setIsCreatingNew(false);
      setNewNameInput('');
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2000);
    } catch (err: any) {
      console.error('Failed to create character', err);
      setSaveError(err.message || 'Failed to create character');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!draft) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete character "${draft.name}"? This removes the character file from your Story Bible.`
    );
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      await onDeleteCharacter(draft.filePath);
      const remaining = characters.filter((c) => c.filePath !== draft.filePath);
      setCharacters(remaining);
      if (remaining.length > 0) {
        handleSelectCharacter(remaining[0]);
      } else {
        setSelectedPath('');
        setDraft(null);
      }
    } catch (err: any) {
      console.error('Failed to delete character', err);
      setSaveError(err.message || 'Failed to delete character');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Add Custom Attribute
  const handleAddCustomAttribute = () => {
    if (!draft) return;
    const current = draft.customAttributes || [];
    setDraft({
      ...draft,
      customAttributes: [...current, { key: '', value: '' }],
    });
  };

  // Handle Change Custom Attribute
  const handleUpdateCustomAttribute = (index: number, key: string, value: string) => {
    if (!draft) return;
    const current = [...(draft.customAttributes || [])];
    current[index] = { key, value };
    setDraft({ ...draft, customAttributes: current });
  };

  // Handle Remove Custom Attribute
  const handleRemoveCustomAttribute = (index: number) => {
    if (!draft) return;
    const current = (draft.customAttributes || []).filter((_, i) => i !== index);
    setDraft({ ...draft, customAttributes: current });
  };

  // Filter characters by search and role
  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.archetype && c.archetype.toLowerCase().includes(q)) ||
        (c.tags && c.tags.toLowerCase().includes(q)) ||
        (c.summary && c.summary.toLowerCase().includes(q)) ||
        (c.appearance && c.appearance.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'All' ||
        c.role.toLowerCase().includes(roleFilter.toLowerCase()) ||
        c.status.toLowerCase().includes(roleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [characters, searchQuery, roleFilter]);

  if (!isOpen) return null;

  return (
    <div
      id="character-directory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden text-stone-200 select-none text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-stone-800 px-4 sm:px-5 flex items-center justify-between bg-stone-950/70 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-700/50 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-100 text-sm tracking-tight truncate">
                  Character Directory & Metadata
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[10px] font-mono">
                  {characters.length} {characters.length === 1 ? 'character' : 'characters'}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                Story Bible for <span className="text-amber-300/90 font-medium">{novelTitle}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="character-modal-new-btn"
              onClick={() => setIsCreatingNew(true)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition shadow-xs text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Character</span>
            </button>
            <button
              type="button"
              id="character-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="bg-rose-950/80 border-b border-rose-800/60 px-4 py-2 text-rose-200 text-xs flex items-center justify-between">
            <span>{saveError}</span>
            <button
              onClick={() => setSaveError(null)}
              className="text-rose-400 hover:text-rose-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Split */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Character List & Filters */}
          <div className="w-72 sm:w-80 border-r border-stone-800/80 bg-stone-950/40 flex flex-col flex-shrink-0 min-h-0">
            {/* Search and Filters */}
            <div className="p-3 border-b border-stone-800/60 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, role, tag..."
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Role filter pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                {['All', 'Protagonist', 'Antagonist', 'Active', 'Major'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`px-2 py-0.5 rounded-md whitespace-nowrap transition border ${
                      roleFilter === role
                        ? 'bg-blue-950 text-blue-200 border-blue-700 font-medium'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {isLoading ? (
                <div className="p-6 text-center text-stone-500">Loading characters...</div>
              ) : filteredCharacters.length === 0 ? (
                <div className="p-6 text-center text-stone-500 space-y-2">
                  <p>No characters found.</p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    <Plus className="w-3 h-3" /> Add a character
                  </button>
                </div>
              ) : (
                filteredCharacters.map((char) => {
                  const isSelected = selectedPath === char.filePath && !isCreatingNew;
                  const isProtagonist = char.role.toLowerCase().includes('protagonist');
                  const isAntagonist = char.role.toLowerCase().includes('antagonist');

                  return (
                    <button
                      key={char.filePath}
                      type="button"
                      onClick={() => handleSelectCharacter(char)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-950/70 border-blue-600/80 shadow-md text-stone-100'
                          : 'bg-stone-900/60 border-stone-800/80 text-stone-300 hover:bg-stone-900 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-xs text-stone-100 truncate flex-1">
                          {char.name}
                        </span>
                        {char.status && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              char.status.toLowerCase() === 'active'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                : char.status.toLowerCase() === 'deceased'
                                ? 'bg-stone-800 text-stone-400'
                                : 'bg-stone-800/80 text-stone-300 border border-stone-700/50'
                            }`}
                          >
                            {char.status}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {char.role && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              isProtagonist
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                                : isAntagonist
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {char.role}
                          </span>
                        )}
                        {char.archetype && (
                          <span className="text-[9px] text-stone-400 font-mono">
                            {char.archetype}
                          </span>
                        )}
                        {char.age && (
                          <span className="text-[9px] text-stone-500 font-mono">
                            Age: {char.age}
                          </span>
                        )}
                      </div>

                      {char.summary && (
                        <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                          {char.summary}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Inspector & Form */}
          <div className="flex-1 flex flex-col min-w-0 bg-stone-900/40">
            {isCreatingNew ? (
              /* Inline Create New Character Form */
              <div className="p-6 max-w-lg mx-auto w-full flex flex-col justify-center flex-1 animate-in fade-in duration-100">
                <div className="bg-stone-950 border border-stone-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2.5 text-blue-400">
                    <User className="w-5 h-5" />
                    <h3 className="font-semibold text-stone-100 text-sm">Create New Character</h3>
                  </div>
                  <p className="text-stone-400 text-xs">
                    Enter the character's initial name and core narrative role. You can capture full
                    appearance, psychology, goals, and lore metadata right after.
                  </p>

                  <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-stone-300">
                        Character Name *
                      </label>
                      <input
                        type="text"
                        value={newNameInput}
                        onChange={(e) => setNewNameInput(e.target.value)}
                        placeholder="e.g. Kaelen Vance, Elena Rowe"
                        required
                        autoFocus
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-stone-300">Narrative Role</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newRoleInput}
                          onChange={(e) => setNewRoleInput(e.target.value)}
                          placeholder="e.g. Protagonist, Antagonist, Scout"
                          className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['Protagonist', 'Antagonist', 'Deuteragonist', 'Mentor', 'Supporting'].map(
                          (r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setNewRoleInput(r)}
                              className="text-[10px] px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
                            >
                              {r}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(false)}
                        className="px-3.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newNameInput.trim() || isSaving}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-1.5 transition shadow-xs disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Creating...' : 'Create Character'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : draft ? (
              /* Character Details & Metadata Form */
              <div className="flex flex-col h-full min-h-0">
                {/* Form Action Header */}
                <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/50 flex-shrink-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-semibold text-stone-100 text-sm truncate">
                      {draft.name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 truncate hidden sm:inline">
                      ({draft.filePath})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* View mode toggle */}
                    <div className="flex items-center bg-stone-950 border border-stone-800 rounded-lg p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`px-2 py-0.5 rounded transition ${
                          activeTab === 'details'
                            ? 'bg-stone-800 text-stone-100 font-medium'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Metadata
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`px-2 py-0.5 rounded transition ${
                          activeTab === 'preview'
                            ? 'bg-stone-800 text-stone-100 font-medium'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Markdown
                      </button>
                    </div>

                    {onSelectCharacterInEditor && (
                      <button
                        type="button"
                        id="character-modal-open-editor-btn"
                        onClick={() => {
                          onSelectCharacterInEditor(draft.filePath);
                          onClose();
                        }}
                        title="Open character file in full StorySpark editor"
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 flex items-center gap-1 transition text-[11px]"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span className="hidden sm:inline">Open in Editor</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="character-modal-save-btn"
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition shadow-xs text-[11px] ${
                        isSavedRecently
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isSavedRecently ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          <span>{isSaving ? 'Saving...' : 'Save Metadata'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="character-modal-delete-btn"
                      onClick={handleDelete}
                      title="Delete Character"
                      className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  {activeTab === 'preview' ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-stone-400">
                        Generated Markdown saved to Story Bible:
                      </div>
                      <pre className="p-4 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto select-text">
                        {serializeCharacterMetadata(draft)}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-5 max-w-3xl">
                      {/* Section 1: Core Identity */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>Identity & Role</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Character Name *
                            </label>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                              placeholder="Full Name"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Role / Profession
                            </label>
                            <input
                              type="text"
                              value={draft.role}
                              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                              placeholder="e.g. Protagonist, Reluctant Scout, Mentor"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Narrative Status
                            </label>
                            <select
                              value={draft.status}
                              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-blue-500"
                            >
                              {COMMON_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Archetype
                            </label>
                            <input
                              type="text"
                              value={draft.archetype}
                              onChange={(e) => setDraft({ ...draft, archetype: e.target.value })}
                              placeholder="e.g. Reluctant Hero, Trickster, Caregiver"
                              list="archetypes-list"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-blue-500"
                            />
                            <datalist id="archetypes-list">
                              {COMMON_ARCHETYPES.map((a) => (
                                <option key={a} value={a} />
                              ))}
                            </datalist>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Age / Timeline
                            </label>
                            <input
                              type="text"
                              value={draft.age}
                              onChange={(e) => setDraft({ ...draft, age: e.target.value })}
                              placeholder="e.g. 24, Late 30s, Ageless"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Aliases / Nicknames
                            </label>
                            <input
                              type="text"
                              value={draft.aliases}
                              onChange={(e) => setDraft({ ...draft, aliases: e.target.value })}
                              placeholder="e.g. The Whisperer, Iris, Ghost"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Narrative Motivation & Psychology */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span>Motivation, Flaws & Arc</span>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Core Goal / Primary Motivation
                            </label>
                            <input
                              type="text"
                              value={draft.goal}
                              onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                              placeholder="What does this character desire or fight for above all else?"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-stone-400">
                                Internal Conflict / Flaw / Fear
                              </label>
                              <input
                                type="text"
                                value={draft.conflict}
                                onChange={(e) => setDraft({ ...draft, conflict: e.target.value })}
                                placeholder="What holds them back or haunts them?"
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-stone-400">
                                Stakes / Consequence of Failure
                              </label>
                              <input
                                type="text"
                                value={draft.stakes}
                                onChange={(e) => setDraft({ ...draft, stakes: e.target.value })}
                                placeholder="What happens if they fail?"
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Appearance & Mannerisms */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Appearance & Mannerisms</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Physical Appearance
                            </label>
                            <textarea
                              rows={2}
                              value={draft.appearance}
                              onChange={(e) => setDraft({ ...draft, appearance: e.target.value })}
                              placeholder="Height, build, eyes, hair, distinguishing scars, attire..."
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Voice, Speech & Mannerisms
                            </label>
                            <textarea
                              rows={2}
                              value={draft.mannerisms}
                              onChange={(e) => setDraft({ ...draft, mannerisms: e.target.value })}
                              placeholder="Speech cadence, gestures, recurring habits or quirks..."
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Affiliation & Relationships */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Affiliations & Relationships</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Faction / Guild / Allegiance
                            </label>
                            <input
                              type="text"
                              value={draft.affiliation}
                              onChange={(e) => setDraft({ ...draft, affiliation: e.target.value })}
                              placeholder="e.g. Free Transmitters, Imperial Council"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-stone-400">
                              Key Relationships & Allies
                            </label>
                            <input
                              type="text"
                              value={draft.relationships}
                              onChange={(e) =>
                                setDraft({ ...draft, relationships: e.target.value })
                              }
                              placeholder="e.g. Ally of Mara, Estranged child of Vance"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Summary & Tags */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Tooltip Summary & Tags</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-medium text-stone-400">
                              Quick Summary (Used in hover reference tooltips)
                            </label>
                            <input
                              type="text"
                              value={draft.summary}
                              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                              placeholder="Concise 1-sentence logline displayed when hovering lore links in the editor."
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-medium text-stone-400">
                              Tags (Comma separated)
                            </label>
                            <input
                              type="text"
                              value={draft.tags}
                              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                              placeholder="e.g. scout, cybernetics, magic, fugitive"
                              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 6: Custom Attributes */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Custom Metadata Fields</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCustomAttribute}
                            className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 hover:border-amber-500 text-stone-300 hover:text-amber-300 text-[10px] flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Field</span>
                          </button>
                        </div>

                        {draft.customAttributes && draft.customAttributes.length > 0 ? (
                          <div className="space-y-2">
                            {draft.customAttributes.map((attr, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={attr.key}
                                  onChange={(e) =>
                                    handleUpdateCustomAttribute(idx, e.target.value, attr.value)
                                  }
                                  placeholder="Attribute Name (e.g. Weapon)"
                                  className="w-1/3 bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                                />
                                <input
                                  type="text"
                                  value={attr.value}
                                  onChange={(e) =>
                                    handleUpdateCustomAttribute(idx, attr.key, e.target.value)
                                  }
                                  placeholder="Attribute Value (e.g. Pulse pistol)"
                                  className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomAttribute(idx)}
                                  className="p-1.5 text-stone-500 hover:text-rose-400 rounded"
                                  title="Remove Field"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg border border-dashed border-stone-800 text-center text-stone-500 text-[11px]">
                            No custom attributes yet. Click "Add Field" to record weapon, theme song,
                            first appearance, or magic tier.
                          </div>
                        )}
                      </div>

                      {/* Section 7: Freeform Backstory & Notes */}
                      <div className="space-y-3 pt-2 border-t border-stone-800/80">
                        <div className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          <span>Backstory, Scene Notes & History</span>
                        </div>

                        <div className="space-y-1">
                          <textarea
                            rows={5}
                            value={draft.notes}
                            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                            placeholder="Extended character history, key scenes, dialogue samples, arc beats, secret revelations..."
                            className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200 focus:outline-none focus:border-blue-500 resize-y font-sans text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500 space-y-3">
                <Users className="w-8 h-8 text-stone-600" />
                <div className="text-stone-300 font-medium">No character selected</div>
                <p className="max-w-xs text-xs text-stone-500">
                  Select a character from the directory on the left, or create a new character to
                  record their traits and backstory.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Character</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
