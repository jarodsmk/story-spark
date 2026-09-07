import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Save,
  Copy,
  Check,
  RotateCw,
  FileText,
  ListFilter,
  Layers,
  AlertCircle,
  Clock,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { SceneSummary, LLMSettings } from '../../types/index.ts';
import { FileItem } from '../../storage/fs.ts';

interface SceneSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilePath: string;
  currentFileTitle: string;
  currentContent: string;
  sceneFiles: FileItem[];
  summaries: Record<string, SceneSummary>;
  onGenerateSummary: (
    filePath: string,
    content?: string,
    title?: string,
    instructions?: string
  ) => Promise<SceneSummary>;
  onSaveSummary: (filePath: string, summary: string, title?: string) => Promise<void>;
  onDeleteSummary: (filePath: string) => Promise<void>;
  onGenerateAllMissing: () => Promise<void>;
  isGenerating: boolean;
  generatingPath: string | null;
  batchProgress: { current: number; total: number } | null;
  error: string | null;
  onSelectScene?: (path: string) => void;
}

export const SceneSummaryModal: React.FC<SceneSummaryModalProps> = ({
  isOpen,
  onClose,
  currentFilePath,
  currentFileTitle,
  currentContent,
  sceneFiles,
  summaries,
  onGenerateSummary,
  onSaveSummary,
  onDeleteSummary,
  onGenerateAllMissing,
  isGenerating,
  generatingPath,
  batchProgress,
  error: parentError,
  onSelectScene,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  const [selectedPath, setSelectedPath] = useState<string>(currentFilePath);
  const [draftSummary, setDraftSummary] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync selectedPath with currentFilePath when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPath(currentFilePath);
      setLocalError(null);
    }
  }, [isOpen, currentFilePath]);

  // Load summary for selectedPath
  useEffect(() => {
    const existing = summaries[selectedPath]?.summary || '';
    setDraftSummary(existing);
    setIsSavedRecently(false);
  }, [selectedPath, summaries]);

  if (!isOpen) return null;

  const currentSummaryObj = summaries[selectedPath];
  const selectedFile = sceneFiles.find((f) => f.path === selectedPath);
  const displayTitle =
    currentSummaryObj?.title ||
    selectedFile?.name.replace(/\.md$/, '').replace(/^\d+-/, '') ||
    currentFileTitle;

  const draftWordCount = draftSummary.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const isSelectedGenerating = isGenerating && generatingPath === selectedPath;

  const summarizedCount = sceneFiles.filter((f) => !!summaries[f.path]?.summary?.trim()).length;
  const totalScenes = sceneFiles.length;

  const handleGenerate = async () => {
    try {
      setLocalError(null);
      const res = await onGenerateSummary(
        selectedPath,
        selectedPath === currentFilePath ? currentContent : undefined,
        displayTitle,
        instructions.trim() || undefined
      );
      setDraftSummary(res.summary);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to generate summary');
    }
  };

  const handleSave = async () => {
    try {
      await onSaveSummary(selectedPath, draftSummary, displayTitle);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save summary');
    }
  };

  const handleCopy = () => {
    if (!draftSummary) return;
    navigator.clipboard.writeText(draftSummary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete summary for "${displayTitle}"?`)) {
      await onDeleteSummary(selectedPath);
      setDraftSummary('');
    }
  };

  return (
    <div
      id="scene-summary-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div
        id="scene-summary-modal-container"
        className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-stone-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                Scene Summaries & Context
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 font-mono">
                  LLM Context
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Generate and edit concise scene summaries used to inform AI story continuation.
              </p>
            </div>
          </div>

          <button
            id="close-scene-summary-modal-btn"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-stone-800/80 bg-stone-900/40 text-xs">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Active Scene ({displayTitle})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Novel Scenes ({summarizedCount}/{totalScenes})
            </button>
          </div>

          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-600" />
            <span>{summarizedCount} of {totalScenes} summarized</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Error Banner */}
          {(localError || parentError) && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                {localError || parentError}
              </div>
            </div>
          )}

          {/* Batch Generation Progress Indicator */}
          {batchProgress && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Generating summaries in batch... ({batchProgress.current} / {batchProgress.total})
                </span>
                <span className="font-mono text-[10px] text-amber-400">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {activeTab === 'all' ? (
            /* TAB: ALL NOVEL SCENES */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-stone-400 text-[11px]">
                  Browse and manage summaries for every scene in this novel. Missing summaries can be generated automatically.
                </p>
                {totalScenes > summarizedCount && (
                  <button
                    id="batch-generate-missing-btn"
                    onClick={onGenerateAllMissing}
                    disabled={isGenerating}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Missing ({totalScenes - summarizedCount})
                  </button>
                )}
              </div>

              <div className="border border-stone-800 rounded-lg divide-y divide-stone-800/80 bg-stone-950/40 max-h-[380px] overflow-y-auto">
                {sceneFiles.map((file, idx) => {
                  const s = summaries[file.path];
                  const hasSummary = !!s?.summary?.trim();
                  const isCur = file.path === selectedPath;
                  const isThisGen = isGenerating && generatingPath === file.path;

                  return (
                    <div
                      key={file.path}
                      onClick={() => {
                        setSelectedPath(file.path);
                        setActiveTab('current');
                      }}
                      className={`p-3 transition-colors cursor-pointer flex flex-col gap-1.5 hover:bg-stone-800/40 ${
                        isCur ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-stone-500 w-5">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-medium text-stone-200">
                            {file.name.replace(/\.md$/, '').replace(/^\d+-/, '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isThisGen ? (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 animate-pulse">
                              <RotateCw className="w-3 h-3 animate-spin" /> Generating...
                            </span>
                          ) : hasSummary ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-mono flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              {s.wordCount || s.summary.split(/\s+/).length} words
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                              No Summary
                            </span>
                          )}
                        </div>
                      </div>

                      {hasSummary ? (
                        <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                          {s.summary}
                        </p>
                      ) : (
                        <div className="text-[10px] text-stone-500 italic">
                          Click to open and generate a summary for this scene.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB: ACTIVE / SELECTED SCENE */
            <div className="space-y-4">
              {/* Scene Selector Pill */}
              <div className="flex items-center justify-between p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-stone-200">{displayTitle}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{selectedPath}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sceneFiles.length > 1 && (
                    <select
                      value={selectedPath}
                      onChange={(e) => setSelectedPath(e.target.value)}
                      className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                    >
                      {sceneFiles.map((f, i) => (
                        <option key={f.path} value={f.path}>
                          Scene {i + 1}: {f.name.replace(/\.md$/, '').replace(/^\d+-/, '')}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    id="generate-scene-summary-btn"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs"
                  >
                    {isSelectedGenerating ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        {draftSummary ? 'Regenerate Summary' : 'Generate Summary'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Optional Custom Instructions Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-[11px] text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <span className="font-semibold">{showInstructions ? '−' : '+'}</span>
                  {showInstructions ? 'Hide Custom Focus / Instructions' : 'Add Custom Focus / Instructions (Optional)'}
                </button>

                {showInstructions && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Emphasize Mara's discovery of the biocoding chip and tension with Jax..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-md px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Summary Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <label className="font-medium text-stone-300 flex items-center gap-1.5">
                    Scene Summary
                    {currentSummaryObj?.updatedAt && (
                      <span className="text-[10px] text-stone-500 font-normal">
                        (Updated {new Date(currentSummaryObj.updatedAt).toLocaleTimeString()})
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-mono text-[10px]">
                      {draftWordCount} words
                    </span>
                    {draftSummary && (
                      <>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="hover:text-stone-200 transition-colors p-1"
                          title="Copy summary text"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="hover:text-rose-400 transition-colors p-1 text-stone-500"
                          title="Delete summary"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <textarea
                  id="scene-summary-textarea"
                  value={draftSummary}
                  onChange={(e) => setDraftSummary(e.target.value)}
                  placeholder="No summary generated yet. Click 'Generate Summary' to have the integrated LLM analyze this scene, or write your own concise synopsis here..."
                  rows={6}
                  className="w-full bg-stone-950/90 border border-stone-800 rounded-lg p-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Context Injection Banner */}
              <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg flex items-start gap-2.5">
                <div className="p-1 bg-amber-500/10 rounded text-amber-400 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="text-[11px] text-stone-400 leading-relaxed">
                  <span className="text-stone-200 font-medium">Automatic Context Ingestion:</span> When prompting the LLM for future content generation, this scene summary will automatically provide background narrative context without consuming unnecessary prompt tokens.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-800 bg-stone-950/60 text-xs">
          <div className="text-[11px] text-stone-500">
            {activeTab === 'current' && isSavedRecently && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Summary saved
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="close-summary-footer-btn"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition-colors text-xs"
            >
              Close
            </button>
            {activeTab === 'current' && (
              <button
                id="save-summary-btn"
                onClick={handleSave}
                disabled={isGenerating}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-medium rounded transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50 border border-amber-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                Save Summary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
