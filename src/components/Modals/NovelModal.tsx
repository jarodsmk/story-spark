import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Target,
  Clock,
  Sparkles,
  AlertTriangle,
  Library,
  FileArchive,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { Novel } from '../../types/index.ts';
import { NovelCrafterParseResult } from '../../engine/novelcrafter/index.ts';
import { NovelCrafterImportOptions, NovelCrafterImportSummary } from '../../engine/novelcrafter/importer.ts';
import { NovelCrafterImportView } from './NovelCrafterImportView.tsx';
import { CoverImageInput } from '../Common/CoverImageInput.tsx';

interface NovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  novels: Novel[];
  activeNovelId: string;
  onSelectNovel: (id: string) => Promise<void>;
  onCreateNovel: (data: {
    title: string;
    genre?: string;
    description?: string;
    targetWordCount?: number;
    template?: 'standard' | 'blank' | 'rich';
    coverImage?: string;
  }) => Promise<{ novel: Novel; initialScenePath: string }>;
  onUpdateNovel: (id: string, updates: Partial<Omit<Novel, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteNovel: (id: string) => Promise<string>;
  onDuplicateNovel: (id: string) => Promise<Novel>;
  onExecuteImportNovelCrafter: (
    parsed: NovelCrafterParseResult,
    options: NovelCrafterImportOptions
  ) => Promise<{ novel: Novel; firstScenePath: string; summary: NovelCrafterImportSummary }>;
  onOpenScene: (scenePath: string) => Promise<void>;
  activeWordCount?: number;
  onOpenCoverUpload?: (novel: Novel) => void;
}

const GENRE_OPTIONS = [
  'Dark Fantasy',
  'Epic Fantasy',
  'Sci-Fi Cyberpunk',
  'Space Opera',
  'Mystery & Crime',
  'Psychological Thriller',
  'Gothic Horror',
  'Romance',
  'Historical Fiction',
  'Literary Fiction',
  'Dystopian',
  'Non-Fiction / Memoir',
  'Other',
];

export const NovelModal: React.FC<NovelModalProps> = ({
  isOpen,
  onClose,
  novels,
  activeNovelId,
  onSelectNovel,
  onCreateNovel,
  onUpdateNovel,
  onDeleteNovel,
  onDuplicateNovel,
  onExecuteImportNovelCrafter,
  onOpenScene,
  activeWordCount = 0,
  onOpenCoverUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'import'>('list');
  const [editingNovelId, setEditingNovelId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeNovel: Novel = novels.find(n => n.id === activeNovelId) || novels[0];

  // Form states for New Novel
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('Dark Fantasy');
  const [newCustomGenre, setNewCustomGenre] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetWords, setNewTargetWords] = useState(50000);
  const [newTemplate, setNewTemplate] = useState<'standard' | 'blank' | 'rich'>('standard');
  const [newCoverImage, setNewCoverImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Edit Novel
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetWords, setEditTargetWords] = useState(50000);
  const [editCoverImage, setEditCoverImage] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleStartEdit = (novel: Novel) => {
    setEditingNovelId(novel.id);
    setEditTitle(novel.title);
    setEditGenre(novel.genre || 'General Fiction');
    setEditDescription(novel.description || '');
    setEditTargetWords(novel.targetWordCount || 50000);
    setEditCoverImage(novel.coverImage);
    setActiveTab('edit');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNovelId || !editTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateNovel(editingNovelId, {
        title: editTitle.trim(),
        genre: editGenre.trim(),
        description: editDescription.trim(),
        targetWordCount: editTargetWords,
        coverImage: editCoverImage,
      });
      setActiveTab('list');
      setEditingNovelId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const genreToSave = newGenre === 'Other' && newCustomGenre.trim() ? newCustomGenre.trim() : newGenre;
      await onCreateNovel({
        title: newTitle.trim(),
        genre: genreToSave,
        description: newDescription.trim(),
        targetWordCount: newTargetWords,
        template: newTemplate,
        coverImage: newCoverImage,
      });
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewCustomGenre('');
      setNewCoverImage(undefined);
      setActiveTab('list');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteNovel(id);
      setDeleteConfirmId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onDuplicateNovel(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNovels = novels.filter(n => {
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      (n.genre && n.genre.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-xs overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center space-x-2">
            <Library className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-stone-100 text-sm">Author Studio: Novel Library</span>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
              {novels.length} {novels.length === 1 ? 'novel' : 'novels'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-stone-900 border border-stone-800 rounded p-0.5">
              <button
                onClick={() => { setActiveTab('list'); setEditingNovelId(null); }}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'list' ? 'bg-amber-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                All Novels
              </button>
              <button
                onClick={() => { setActiveTab('create'); setEditingNovelId(null); }}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                  activeTab === 'create' ? 'bg-amber-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Plus className="w-3 h-3" /> New Novel
              </button>
              <button
                onClick={() => { setActiveTab('import'); setEditingNovelId(null); }}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                  activeTab === 'import' ? 'bg-amber-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileArchive className="w-3 h-3" /> Import ZIP
              </button>
              {editingNovelId && (
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeTab === 'edit' ? 'bg-amber-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Edit Novel
                </button>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-white rounded ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: All Novels List */}
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Search novels by title, genre, or premise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
              />
              <button
                onClick={() => setActiveTab('create')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium flex items-center gap-1.5 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Start New Novel
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-medium flex items-center gap-1.5 flex-shrink-0 border border-stone-700 transition"
              >
                <FileArchive className="w-3.5 h-3.5 text-amber-400" /> Import NovelCrafter ZIP
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {filteredNovels.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-600" />
                  <p>No novels match your search.</p>
                </div>
              ) : (
                filteredNovels.map((novel) => {
                  const isActive = novel.id === activeNovelId;
                  const isConfirmingDelete = deleteConfirmId === novel.id;
                  const wordTarget = novel.targetWordCount || 50000;
                  const displayWords = isActive ? activeWordCount : 0;
                  const percent = Math.min(100, Math.round((displayWords / wordTarget) * 100));

                  return (
                    <div
                      key={novel.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-amber-950/20 border-amber-600/70 shadow-sm'
                          : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Book Cover Thumbnail with Quick Upload Trigger */}
                        <div
                          onClick={() => {
                            if (onOpenCoverUpload) {
                              onOpenCoverUpload(novel);
                            } else {
                              handleStartEdit(novel);
                            }
                          }}
                          title="Click to upload or change cover picture"
                          className="relative group w-12 aspect-[2/3] rounded bg-stone-950 border border-stone-800 hover:border-amber-500/80 flex-shrink-0 overflow-hidden shadow-sm cursor-pointer transition-all"
                        >
                          {novel.coverImage ? (
                            <>
                              <img
                                src={novel.coverImage}
                                alt={`${novel.title} cover`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-400">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-stone-600 group-hover:text-amber-400 transition-colors p-1">
                              <BookOpen className="w-4 h-4 mb-0.5" />
                              <span className="text-[7px] font-mono leading-tight text-center">+Cover</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-stone-100 text-sm">{novel.title}</h3>
                            {novel.genre && (
                              <span className="text-[10px] bg-stone-800 text-amber-300/90 px-2 py-0.5 rounded border border-stone-700 font-medium">
                                {novel.genre}
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 font-semibold">
                                <Check className="w-3 h-3" /> Active Project
                              </span>
                            )}
                          </div>

                          {novel.description && (
                            <p className="text-stone-400 text-[11px] line-clamp-2 leading-relaxed">
                              {novel.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-stone-500 text-[10px] pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-stone-400" />
                              Target: {wordTarget.toLocaleString()} words
                            </span>
                            {isActive && displayWords > 0 && (
                              <span className="flex items-center gap-1 text-amber-400/90 font-mono">
                                Progress: {displayWords.toLocaleString()} words ({percent}%)
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              Updated {new Date(novel.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!isActive && (
                            <button
                              onClick={async () => {
                                await onSelectNovel(novel.id);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-white rounded font-medium transition-colors"
                            >
                              Switch to Novel
                            </button>
                          )}

                          <button
                            title={novel.coverImage ? 'Change cover picture' : 'Upload cover picture'}
                            onClick={() => {
                              if (onOpenCoverUpload) {
                                onOpenCoverUpload(novel);
                              } else {
                                handleStartEdit(novel);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-amber-400 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800 transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Edit novel details"
                            onClick={() => handleStartEdit(novel)}
                            className="p-1.5 text-stone-400 hover:text-amber-400 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Duplicate novel and chapters"
                            onClick={() => handleDuplicate(novel.id)}
                            disabled={isSubmitting}
                            className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded border border-rose-800">
                              <span className="text-[10px] text-rose-300 font-medium px-1">Delete?</span>
                              <button
                                onClick={() => handleDelete(novel.id)}
                                disabled={isSubmitting}
                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[10px]"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-stone-800 text-stone-300 hover:text-white rounded text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              title="Delete novel"
                              onClick={() => setDeleteConfirmId(novel.id)}
                              disabled={novels.length <= 1}
                              className={`p-1.5 rounded border border-stone-800 ${
                                novels.length <= 1
                                  ? 'text-stone-600 cursor-not-allowed'
                                  : 'text-stone-400 hover:text-rose-400 bg-stone-900 hover:bg-stone-800'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create New Novel */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="flex-1 p-5 overflow-y-auto space-y-4">
            <div>
              <label className="block text-stone-300 font-medium mb-1">
                Novel Title <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Echoes of the Void, The Starlight Syndicate"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Genre / Category</label>
                <select
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-600 text-xs"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {newGenre === 'Other' && (
                  <input
                    type="text"
                    placeholder="Specify custom genre..."
                    value={newCustomGenre}
                    onChange={(e) => setNewCustomGenre(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-stone-200 mt-2 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Target Word Count</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={newTargetWords}
                  onChange={(e) => setNewTargetWords(parseInt(e.target.value) || 50000)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-600 text-xs font-mono"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Standard novel: 50,000 – 80,000 words. Novella: 20,000 – 40,000 words.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-medium mb-1">Premise / Synopsis</label>
              <textarea
                rows={3}
                placeholder="Brief logline or working summary of this novel's core conflict, characters, and world..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-xs leading-relaxed"
              />
            </div>

            {/* Cover Picture for New Novel */}
            <CoverImageInput
              value={newCoverImage}
              onChange={setNewCoverImage}
              novelTitle={newTitle || 'New Novel'}
              label="Cover Picture (Optional)"
            />

            <div>
              <label className="block text-stone-300 font-medium mb-2">Starter Template</label>
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => setNewTemplate('standard')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    newTemplate === 'standard'
                      ? 'bg-amber-950/30 border-amber-500 text-stone-100'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-stone-200 mb-1">Chapter 1 Starter</div>
                  <div className="text-[10px] leading-relaxed text-stone-400">
                    Creates an initial Chapter 1 scene ready for your first draft.
                  </div>
                </div>

                <div
                  onClick={() => setNewTemplate('rich')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    newTemplate === 'rich'
                      ? 'bg-amber-950/30 border-amber-500 text-stone-100'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-stone-200 mb-1">Full Studio Setup</div>
                  <div className="text-[10px] leading-relaxed text-stone-400">
                    Includes Chapter 1 draft, a Protagonist bible entry, and World setting note.
                  </div>
                </div>

                <div
                  onClick={() => setNewTemplate('blank')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    newTemplate === 'blank'
                      ? 'bg-amber-950/30 border-amber-500 text-stone-100'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-stone-200 mb-1">Blank Slate</div>
                  <div className="text-[10px] leading-relaxed text-stone-400">
                    Starts completely empty with a clean untitled Chapter 1.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSubmitting ? 'Creating Novel...' : 'Create & Open Novel'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Edit Novel */}
        {activeTab === 'edit' && editingNovelId && (
          <form onSubmit={handleSaveEdit} className="flex-1 p-5 overflow-y-auto space-y-4">
            <div>
              <label className="block text-stone-300 font-medium mb-1">
                Novel Title <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Target Word Count</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={editTargetWords}
                  onChange={(e) => setEditTargetWords(parseInt(e.target.value) || 50000)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-600 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-medium mb-1">Premise / Synopsis</label>
              <textarea
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-600 text-xs leading-relaxed"
              />
            </div>

            {/* Cover Picture for Edit Novel */}
            <CoverImageInput
              value={editCoverImage}
              onChange={setEditCoverImage}
              novelTitle={editTitle || 'Untitled Novel'}
              label="Cover Picture"
            />

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('list'); setEditingNovelId(null); }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !editTitle.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting ? 'Saving Changes...' : 'Save Details'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: NovelCrafter ZIP Import */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto p-5">
            <NovelCrafterImportView
              currentNovels={novels}
              activeNovel={activeNovel}
              onExecuteImport={onExecuteImportNovelCrafter}
              onSuccess={async (scenePath) => {
                await onOpenScene(scenePath);
                onClose();
              }}
              onCancel={() => setActiveTab('list')}
            />
          </div>
        )}
      </div>
    </div>
  );
};
