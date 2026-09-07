import React, { useState, useRef } from 'react';
import {
  Upload,
  FileArchive,
  BookOpen,
  Users,
  MapPin,
  Scroll,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { Novel } from '../../types/index.ts';
import { parseNovelCrafterZip, NovelCrafterParseResult } from '../../engine/novelcrafter/index.ts';
import { NovelCrafterImportOptions, NovelCrafterImportSummary } from '../../engine/novelcrafter/importer.ts';

interface NovelCrafterImportViewProps {
  currentNovels: Novel[];
  activeNovel: Novel;
  onExecuteImport: (
    parsed: NovelCrafterParseResult,
    options: NovelCrafterImportOptions
  ) => Promise<{ novel: Novel; firstScenePath: string; summary: NovelCrafterImportSummary }>;
  onSuccess: (scenePath: string) => void;
  onCancel: () => void;
}

const GENRES = [
  'Sci-Fi Cyberpunk',
  'Space Opera',
  'Epic Fantasy',
  'Dark Fantasy',
  'Mystery & Crime',
  'Psychological Thriller',
  'Gothic Horror',
  'Romance',
  'Historical Fiction',
  'Literary Fiction',
  'Dystopian',
  'General Fiction',
];

export const NovelCrafterImportView: React.FC<NovelCrafterImportViewProps> = ({
  currentNovels,
  activeNovel,
  onExecuteImport,
  onSuccess,
  onCancel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<NovelCrafterParseResult | null>(null);

  // Form options
  const [targetMode, setTargetMode] = useState<'new_novel' | 'active_novel'>('new_novel');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(50000);
  const [splitScenes, setSplitScenes] = useState(true);
  const [importCharacters, setImportCharacters] = useState(true);
  const [importWorldLore, setImportWorldLore] = useState(true);

  // Import execution
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<NovelCrafterImportSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processZipFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setParseError('Please upload a .zip archive exported from NovelCrafter.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseNovelCrafterZip(file, file.name);
      setParsedData(result);
      setTitle(result.suggestedTitle);
      setGenre(result.suggestedGenre);
      setDescription(result.suggestedDescription);
      setTargetWordCount(Math.max(result.totalWordCount + 10000, 50000));
    } catch (err: any) {
      console.error('Failed to parse NovelCrafter zip', err);
      setParseError(err?.message || 'Could not parse this ZIP file. Please ensure it is a valid NovelCrafter export.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processZipFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processZipFile(file);
    }
  };

  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData) return;

    setIsImporting(true);
    try {
      const res = await onExecuteImport(parsedData, {
        targetMode,
        title: title.trim() || parsedData.suggestedTitle,
        genre: genre || parsedData.suggestedGenre,
        description: description.trim(),
        targetWordCount,
        splitScenes,
        importCharacters,
        importWorldLore,
      });

      setImportSuccess(res.summary);
    } catch (err: any) {
      console.error('Import execution failed', err);
      setParseError(err?.message || 'An error occurred while importing the novel into the filesystem.');
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* If not yet parsed or wants to choose another file */}
      {!parsedData && !importSuccess && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-stone-700 hover:border-amber-500/50 bg-stone-950/60 hover:bg-stone-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
            {isParsing ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-sm font-medium text-stone-200">Unpacking and analyzing NovelCrafter archive...</p>
                <p className="text-xs text-stone-500">Scanning novel.md chapters, characters, locations, and lore</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FileArchive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone-200">
                    Drop your NovelCrafter ZIP file here, or <span className="text-amber-400 underline">browse</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">Supports standard NovelCrafter export archives</p>
                </div>

                {/* Expected structure badges */}
                <div className="pt-3 border-t border-stone-800/80 w-full max-w-sm mt-2">
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold mb-2 flex items-center justify-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-amber-400/80" />
                    Expected Archive Structure
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-stone-400">
                    <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700 text-amber-300/90 font-mono">novel.md</span>
                    <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700 text-stone-300 font-mono">characters/</span>
                    <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700 text-stone-300 font-mono">locations/</span>
                    <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700 text-stone-300 font-mono">lore/</span>
                    <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700 text-stone-400 font-mono">codex.html</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {parseError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Import Warning</p>
                <p className="text-red-300/90 mt-0.5">{parseError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsed staging preview & options */}
      {parsedData && !importSuccess && (
        <form onSubmit={handleStartImport} className="space-y-4">
          {/* Header Card */}
          <div className="p-3.5 rounded-lg bg-stone-950 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> NovelCrafter Archive Verified
                </span>
                <span className="text-xs text-stone-400 font-mono">{parsedData.zipFilename}</span>
              </div>
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" /> Choose another file
              </button>
            </div>

            {/* Discovered Content Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                  <BookOpen className="w-3.5 h-3.5" />
                  Manuscript
                </div>
                <div className="text-lg font-bold text-stone-100 mt-1">
                  {parsedData.scenes.length} <span className="text-xs font-normal text-stone-400">scenes</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  {parsedData.totalWordCount.toLocaleString()} words
                </div>
              </div>

              <div className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                  <Users className="w-3.5 h-3.5" />
                  Characters
                </div>
                <div className="text-lg font-bold text-stone-100 mt-1">
                  {parsedData.characters.length} <span className="text-xs font-normal text-stone-400">profiles</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Import to Bible
                </div>
              </div>

              <div className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  Locations
                </div>
                <div className="text-lg font-bold text-stone-100 mt-1">
                  {parsedData.locations.length} <span className="text-xs font-normal text-stone-400">places</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Import to Bible
                </div>
              </div>

              <div className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-purple-400 text-xs font-medium">
                  <Scroll className="w-3.5 h-3.5" />
                  Lore & Codex
                </div>
                <div className="text-lg font-bold text-stone-100 mt-1">
                  {parsedData.lore.length} <span className="text-xs font-normal text-stone-400">entries</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  {parsedData.hasCodexHtml ? 'codex.html found' : 'Lore docs'}
                </div>
              </div>
            </div>
          </div>

          {/* Import Destination Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-300">Import Destination</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                  targetMode === 'new_novel'
                    ? 'border-amber-500/80 bg-amber-500/10'
                    : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'new_novel'}
                  onChange={() => setTargetMode('new_novel')}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <p className="text-xs font-medium text-stone-200">Create as New Novel in Library</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Recommended. Creates an independent novel project without affecting existing stories.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                  targetMode === 'active_novel'
                    ? 'border-amber-500/80 bg-amber-500/10'
                    : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'active_novel'}
                  onChange={() => setTargetMode('active_novel')}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <p className="text-xs font-medium text-stone-200">
                    Import into Current Novel ({activeNovel.title})
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Merges scenes and story bible items into the active project workspace.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Novel Metadata (Editable) */}
          <div className="space-y-3 bg-stone-950/60 border border-stone-800 p-3.5 rounded-lg">
            <h4 className="text-xs font-medium text-stone-300">Novel Configuration</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Novel Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neon Horizon"
                  className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Target Word Count</label>
                <input
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(Number(e.target.value) || 50000)}
                  className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  min="1000"
                  step="1000"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Synopsis / Premise</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief pitch or premise..."
                  className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Import Inclusion Checkboxes */}
          <div className="space-y-2 border-t border-stone-800/80 pt-3">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Extraction Options</p>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitScenes}
                  onChange={(e) => setSplitScenes(e.target.checked)}
                  className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-amber-500"
                />
                <span>
                  Split <code className="text-amber-400">novel.md</code> into numbered scene files ({parsedData.scenes.length} detected)
                </span>
              </label>

              {parsedData.characters.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importCharacters}
                    onChange={(e) => setImportCharacters(e.target.checked)}
                    className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    Import {parsedData.characters.length} character profiles from <code className="text-stone-400">characters/</code> into Story Bible
                  </span>
                </label>
              )}

              {(parsedData.locations.length > 0 || parsedData.lore.length > 0) && (
                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importWorldLore}
                    onChange={(e) => setImportWorldLore(e.target.checked)}
                    className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    Import {parsedData.locations.length} locations & {parsedData.lore.length} lore entries into Story Bible World
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded text-xs text-stone-400 hover:text-stone-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || !title.trim()}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white font-medium rounded text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing Novel...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import Novel to StorySpark
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Success View */}
      {importSuccess && (
        <div className="py-6 px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-stone-100">Novel Successfully Imported!</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              "{importSuccess.novelTitle}" has been imported with all chapters and story bible items.
            </p>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg max-w-sm mx-auto text-left text-xs space-y-1.5 text-stone-300">
            <div className="flex justify-between">
              <span className="text-stone-400">Chapters & Scenes:</span>
              <span className="font-semibold text-amber-400">{importSuccess.scenesImported} files</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Total Word Count:</span>
              <span className="font-semibold text-stone-200">{importSuccess.totalWords.toLocaleString()} words</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Character Profiles:</span>
              <span className="font-semibold text-stone-200">{importSuccess.charactersImported} entries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Locations & Lore:</span>
              <span className="font-semibold text-stone-200">
                {importSuccess.locationsImported + importSuccess.loreImported} entries
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSuccess(importSuccess.firstScenePath)}
            className="w-full max-w-sm mx-auto py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>Open Manuscript in Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
