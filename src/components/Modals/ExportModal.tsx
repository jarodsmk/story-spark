import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookCheck,
  Download,
  FileText,
  Check,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sliders,
  BookOpen,
  Search,
  FileCode,
  FileDown,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { fs, FileItem } from '../../storage/fs.ts';
import { sanitizeFilename, compileNovelManuscript, compileNovelText } from '../../engine/markdown/index.ts';
import { SceneDocument, BibleEntity } from '../../types/index.ts';
import { downloadNovelPDF } from '../../engine/export/pdfExport.ts';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  compiledMarkdown?: string;
  novelTitle?: string;
  genre?: string;
  author?: string;
  sceneFiles?: FileItem[];
  bibleFiles?: FileItem[];
  activeFilePath?: string;
  currentEditorContent?: string;
}

interface LoadedScene {
  id: string;
  path: string;
  title: string;
  filename: string;
  content: string;
  order: number;
  wordCount: number;
  selected: boolean;
}

interface LoadedBible {
  id: string;
  name: string;
  filename: string;
  content: string;
  type: 'character' | 'world' | 'note';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  compiledMarkdown: initialCompiledMarkdown = '',
  novelTitle = 'Novel',
  genre,
  author,
  sceneFiles = [],
  bibleFiles = [],
  activeFilePath,
  currentEditorContent,
}) => {
  const [scenes, setScenes] = useState<LoadedScene[]>([]);
  const [bibleEntities, setBibleEntities] = useState<LoadedBible[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [sceneSearch, setSceneSearch] = useState('');
  const [previewTab, setPreviewTab] = useState<'reading' | 'markdown' | 'text'>('reading');

  // Compilation customization options
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [headingStyle, setHeadingStyle] = useState<'numbered' | 'simple' | 'original'>('numbered');
  const [sceneSeparator, setSceneSeparator] = useState<'divider' | 'asterisms' | 'blank'>('divider');
  const [pdfFont, setPdfFont] = useState<'times' | 'helvetica'>('times');
  const [showOptions, setShowOptions] = useState(false);

  // Load all scenes and bible files when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedScenes: LoadedScene[] = [];
        let ord = 1;

        if (sceneFiles && sceneFiles.length > 0) {
          for (const f of sceneFiles) {
            let content = '';
            // If this is the active scene being edited right now, use freshest unsaved state
            if (activeFilePath && f.path === activeFilePath && currentEditorContent !== undefined) {
              content = currentEditorContent;
            } else {
              try {
                content = await fs.readFile(f.path);
              } catch {
                content = '';
              }
            }

            const cleanTitle = f.name
              .replace(/\.md$/, '')
              .replace(/^\d+-/, '')
              .replace(/-/g, ' ')
              .trim();
            const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
            const words = content.trim().split(/\s+/).filter((w) => w.length > 0).length;

            loadedScenes.push({
              id: f.path,
              path: f.path,
              title: formattedTitle || f.name.replace(/\.md$/, ''),
              filename: f.name,
              content,
              order: ord++,
              wordCount: words,
              selected: true, // Default: all scenes initially selected
            });
          }
        }

        const loadedBibles: LoadedBible[] = [];
        if (bibleFiles && bibleFiles.length > 0) {
          for (const f of bibleFiles) {
            try {
              const c = await fs.readFile(f.path);
              const type = f.path.includes('characters') ? 'character' : 'world';
              const name = f.name.replace(/\.md$/, '').replace(/-/g, ' ');
              loadedBibles.push({
                id: f.path,
                name: name.charAt(0).toUpperCase() + name.slice(1),
                filename: f.name,
                content: c,
                type,
              });
            } catch {
              // ignore missing file
            }
          }
        }

        if (isMounted) {
          setScenes(loadedScenes);
          setBibleEntities(loadedBibles);
        }
      } catch (err) {
        console.error('Failed to prepare manuscript compilation data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sceneFiles, bibleFiles, activeFilePath, currentEditorContent]);

  // Selected scenes in current user order
  const selectedScenes = useMemo(() => {
    return scenes.filter((s) => s.selected);
  }, [scenes]);

  // Prepared scene documents for markdown/text engine
  const sceneDocs: SceneDocument[] = useMemo(() => {
    return selectedScenes.map((s, idx) => ({
      id: s.id,
      title: s.title,
      filename: s.filename,
      content: s.content,
      order: idx + 1,
    }));
  }, [selectedScenes]);

  const bibleDocs: BibleEntity[] = useMemo(() => {
    return bibleEntities.map((b) => ({
      id: b.id,
      name: b.name,
      filename: b.filename,
      content: b.content,
      type: b.type,
    }));
  }, [bibleEntities]);

  // Dynamic compiled markdown representation
  const compiledMarkdown = useMemo(() => {
    if (scenes.length === 0 && initialCompiledMarkdown) {
      return initialCompiledMarkdown;
    }
    if (sceneDocs.length === 0) {
      return '';
    }
    return compileNovelManuscript(sceneDocs, bibleDocs, includeAppendix, {
      chapterHeadingStyle: headingStyle,
      sceneSeparator: sceneSeparator,
      novelTitle,
    });
  }, [scenes.length, initialCompiledMarkdown, sceneDocs, bibleDocs, includeAppendix, headingStyle, sceneSeparator, novelTitle]);

  // Dynamic compiled plain text representation
  const compiledText = useMemo(() => {
    if (sceneDocs.length === 0) return '';
    return compileNovelText(sceneDocs, bibleDocs, includeAppendix, {
      chapterHeadingStyle: headingStyle,
      sceneSeparator: sceneSeparator,
      novelTitle,
    });
  }, [sceneDocs, bibleDocs, includeAppendix, headingStyle, sceneSeparator, novelTitle]);

  // Manuscript aggregate metrics
  const totalSelectedWords = useMemo(() => {
    return selectedScenes.reduce((acc, s) => acc + s.wordCount, 0);
  }, [selectedScenes]);

  const estimatedReadingMinutes = useMemo(() => {
    return Math.max(1, Math.round(totalSelectedWords / 220));
  }, [totalSelectedWords]);

  const estimatedBookPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalSelectedWords / 280));
  }, [totalSelectedWords]);

  // Toggle single scene selection
  const handleToggleScene = (id: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  // Select all scenes
  const handleSelectAll = () => {
    setScenes((prev) => prev.map((s) => ({ ...s, selected: true })));
  };

  // Deselect all scenes
  const handleDeselectAll = () => {
    setScenes((prev) => prev.map((s) => ({ ...s, selected: false })));
  };

  // Invert selection
  const handleInvertSelection = () => {
    setScenes((prev) => prev.map((s) => ({ ...s, selected: !s.selected })));
  };

  // Move scene order Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setScenes((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Move scene order Down
  const handleMoveDown = (index: number) => {
    if (index >= scenes.length - 1) return;
    setScenes((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Copy compiled text to clipboard
  const handleCopyClipboard = async () => {
    const textToCopy = previewTab === 'text' ? compiledText : compiledMarkdown;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Export as single .md file
  const handleExportMarkdown = () => {
    if (selectedScenes.length === 0) return;
    const cleanTitle = sanitizeFilename(novelTitle.replace(/\s+/g, '-')) || 'StorySpark-Novel';
    const filename = `${cleanTitle}-Manuscript.md`;
    const blob = new Blob([compiledMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as single .txt file
  const handleExportText = () => {
    if (selectedScenes.length === 0) return;
    const cleanTitle = sanitizeFilename(novelTitle.replace(/\s+/g, '-')) || 'StorySpark-Novel';
    const filename = `${cleanTitle}-Manuscript.txt`;
    const blob = new Blob([compiledText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as single .pdf file
  const handleExportPDF = () => {
    if (selectedScenes.length === 0) return;
    setIsExportingPdf(true);
    try {
      downloadNovelPDF({
        title: novelTitle,
        genre,
        author,
        scenes: selectedScenes.map((s, idx) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          order: idx + 1,
        })),
        bibleEntities: bibleDocs,
        includeBibleAppendix: includeAppendix,
        fontFamily: pdfFont,
        chapterHeadingStyle: headingStyle,
        sceneSeparator: sceneSeparator === 'blank' ? 'pagebreak' : sceneSeparator,
        includeCoverPage: true,
        pageNumbers: true,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered scenes for search
  const filteredScenes = useMemo(() => {
    if (!sceneSearch.trim()) return scenes;
    const query = sceneSearch.toLowerCase();
    return scenes.filter((s) => s.title.toLowerCase().includes(query));
  }, [scenes, sceneSearch]);

  if (!isOpen) return null;

  return (
    <div
      id="compile-novel-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div
        id="compile-novel-modal-container"
        className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-5xl h-[90vh] max-h-[860px] flex flex-col shadow-2xl text-xs overflow-hidden"
      >
        {/* Modal Header */}
        <div className="h-13 border-b border-stone-800 px-5 flex items-center justify-between bg-stone-950/70 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-100 text-sm">Compile Novel Manuscript</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 font-medium text-[11px] border border-stone-700/60">
                  {novelTitle}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Select scenes to bundle and export into a single publication-ready manuscript file.
              </p>
            </div>
          </div>
          <button
            id="compile-modal-close-btn"
            onClick={onClose}
            title="Close modal"
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split view (Scene selection on left, live compiled preview on right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-stone-900">
          {/* Left Column: Scene Selector & Compilation Settings */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-stone-800 flex flex-col bg-stone-950/40 flex-shrink-0">
            {/* Scene Selector Header & Quick Controls */}
            <div className="p-3 border-b border-stone-800/80 space-y-2 bg-stone-950/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Scenes ({selectedScenes.length}/{scenes.length})</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    id="compile-select-all-btn"
                    onClick={handleSelectAll}
                    title="Select all scenes"
                    className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px] font-medium transition"
                  >
                    All
                  </button>
                  <button
                    id="compile-deselect-all-btn"
                    onClick={handleDeselectAll}
                    title="Deselect all scenes"
                    className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px] font-medium transition"
                  >
                    None
                  </button>
                  <button
                    id="compile-invert-selection-btn"
                    onClick={handleInvertSelection}
                    title="Invert selection"
                    className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded text-[10px] font-medium transition"
                  >
                    Invert
                  </button>
                </div>
              </div>

              {/* Scene Filter input */}
              {scenes.length > 4 && (
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-2 text-stone-500" />
                  <input
                    id="compile-scene-search-input"
                    type="text"
                    value={sceneSearch}
                    onChange={(e) => setSceneSearch(e.target.value)}
                    placeholder="Filter scenes..."
                    className="w-full pl-7 pr-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-[11px] text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
                  />
                  {sceneSearch && (
                    <button
                      onClick={() => setSceneSearch('')}
                      className="absolute right-2 top-1.5 text-stone-500 hover:text-stone-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable Scene List with checkboxes & ordering */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-stone-900/60">
              {isLoading ? (
                <div className="p-8 text-center text-stone-500 flex flex-col items-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading manuscript scenes...</span>
                </div>
              ) : filteredScenes.length === 0 ? (
                <div className="p-6 text-center text-stone-500">
                  {sceneSearch ? 'No scenes match your filter.' : 'No scenes found in this novel.'}
                </div>
              ) : (
                filteredScenes.map((scene, idx) => {
                  const originalIndex = scenes.findIndex((s) => s.id === scene.id);
                  return (
                    <div
                      key={scene.id}
                      id={`compile-scene-item-${originalIndex}`}
                      className={`group flex items-center justify-between p-2 rounded-lg transition-colors pt-2.5 ${
                        scene.selected
                          ? 'bg-stone-900/90 text-stone-200 border border-stone-800/80 shadow-xs'
                          : 'bg-transparent text-stone-500 hover:bg-stone-900/40 border border-transparent'
                      }`}
                    >
                      <div
                        onClick={() => handleToggleScene(scene.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                      >
                        <button
                          type="button"
                          id={`compile-scene-checkbox-${originalIndex}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleScene(scene.id);
                          }}
                          className="flex-shrink-0 text-amber-500 transition hover:scale-105"
                          title={scene.selected ? 'Exclude from compilation' : 'Include in compilation'}
                        >
                          {scene.selected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-600 hover:text-stone-400" />
                          )}
                        </button>

                        <div className="truncate flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-stone-500">#{originalIndex + 1}</span>
                            <span
                              className={`truncate font-medium text-[11px] ${
                                scene.selected ? 'text-stone-200' : 'text-stone-500'
                              }`}
                            >
                              {scene.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                            {scene.wordCount.toLocaleString()} words
                          </div>
                        </div>
                      </div>

                      {/* Move sequence Up/Down buttons */}
                      <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                        <button
                          type="button"
                          id={`compile-scene-move-up-${originalIndex}`}
                          onClick={() => handleMoveUp(originalIndex)}
                          disabled={originalIndex === 0}
                          title="Move earlier in manuscript order"
                          className="p-1 text-stone-500 hover:text-stone-200 disabled:opacity-20 disabled:hover:text-stone-500 rounded"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          id={`compile-scene-move-down-${originalIndex}`}
                          onClick={() => handleMoveDown(originalIndex)}
                          disabled={originalIndex === scenes.length - 1}
                          title="Move later in manuscript order"
                          className="p-1 text-stone-500 hover:text-stone-200 disabled:opacity-20 disabled:hover:text-stone-500 rounded"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Compilation Options Collapsible Footer */}
            <div className="p-3 border-t border-stone-800 bg-stone-950/70 space-y-2">
              <button
                type="button"
                id="compile-toggle-options-btn"
                onClick={() => setShowOptions(!showOptions)}
                className="w-full flex items-center justify-between text-stone-400 hover:text-stone-200 font-medium text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-amber-500" />
                  <span>Formatting & Layout Options</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {showOptions ? 'Hide ▲' : 'Edit ▼'}
                </span>
              </button>

              {showOptions && (
                <div className="pt-2 space-y-2.5 border-t border-stone-800/80 text-[11px]">
                  {/* Appendix Toggle */}
                  <label
                    id="compile-appendix-toggle-label"
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <span className="text-stone-300">Include Story Bible Appendix</span>
                    <input
                      id="compile-include-appendix-checkbox"
                      type="checkbox"
                      checked={includeAppendix}
                      onChange={(e) => setIncludeAppendix(e.target.checked)}
                      className="accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  {/* Chapter Heading Style */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-400">Chapter Headings</span>
                    <select
                      id="compile-heading-style-select"
                      value={headingStyle}
                      onChange={(e) => setHeadingStyle(e.target.value as any)}
                      className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-stone-200 text-[10px] focus:outline-none"
                    >
                      <option value="numbered">Numbered (Chapter 1: Title)</option>
                      <option value="simple">Simple (Title Only)</option>
                      <option value="original">Original Names</option>
                    </select>
                  </div>

                  {/* Scene Separator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-400">Scene Separator</span>
                    <select
                      id="compile-separator-style-select"
                      value={sceneSeparator}
                      onChange={(e) => setSceneSeparator(e.target.value as any)}
                      className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-stone-200 text-[10px] focus:outline-none"
                    >
                      <option value="divider">Horizontal Rule (---)</option>
                      <option value="asterisms">Asterisms (* * *)</option>
                      <option value="blank">Blank Page / Space</option>
                    </select>
                  </div>

                  {/* PDF Font */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-400">PDF Typography</span>
                    <select
                      id="compile-pdf-font-select"
                      value={pdfFont}
                      onChange={(e) => setPdfFont(e.target.value as any)}
                      className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-stone-200 text-[10px] focus:outline-none"
                    >
                      <option value="times">Classic Serif (Times Roman)</option>
                      <option value="helvetica">Clean Sans (Helvetica)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Manuscript Preview & Metrics */}
          <div className="flex-1 flex flex-col min-w-0 bg-stone-900">
            {/* Preview Toolbar & Stats Bar */}
            <div className="h-11 border-b border-stone-800 px-4 flex items-center justify-between bg-stone-950/40 flex-shrink-0">
              {/* Preview Format Tabs */}
              <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-lg border border-stone-800">
                <button
                  id="compile-preview-tab-reading"
                  type="button"
                  onClick={() => setPreviewTab('reading')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                    previewTab === 'reading'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Reading View</span>
                </button>
                <button
                  id="compile-preview-tab-markdown"
                  type="button"
                  onClick={() => setPreviewTab('markdown')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                    previewTab === 'markdown'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  id="compile-preview-tab-text"
                  type="button"
                  onClick={() => setPreviewTab('text')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                    previewTab === 'text'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Plain Text (.txt)</span>
                </button>
              </div>

              {/* Copy to Clipboard */}
              <button
                id="compile-copy-clipboard-btn"
                type="button"
                onClick={handleCopyClipboard}
                disabled={selectedScenes.length === 0}
                title="Copy manuscript text to clipboard"
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 hover:text-white rounded flex items-center gap-1 text-[11px] transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            {/* Real-time Manuscript Stats Ribbon */}
            <div className="bg-stone-950/60 border-b border-stone-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-4 text-stone-400">
                <span>
                  <strong className="text-amber-400 font-semibold">{selectedScenes.length}</strong> scenes included
                </span>
                <span className="font-mono text-stone-700">·</span>
                <span>
                  <strong className="text-stone-200 font-semibold">{totalSelectedWords.toLocaleString()}</strong> words
                </span>
                <span className="font-mono text-stone-700">·</span>
                <span>
                  Est. <strong className="text-stone-200 font-semibold">~{estimatedBookPages}</strong> pages
                </span>
                <span className="font-mono text-stone-700">·</span>
                <span>
                  <strong className="text-stone-200 font-semibold">~{estimatedReadingMinutes}</strong> mins reading
                </span>
              </div>
              {includeAppendix && (
                <span className="text-[10px] text-amber-400/90 font-medium px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/40">
                  + {bibleDocs.length} Story Bible entries in appendix
                </span>
              )}
            </div>

            {/* Manuscript Content Viewer */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-950/20">
              {selectedScenes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-500">
                  <BookOpen className="w-8 h-8 text-stone-600 mb-2" />
                  <p className="font-medium text-stone-300">No scenes selected</p>
                  <p className="text-[11px] text-stone-500 max-w-sm mt-1">
                    Select at least one scene on the left panel to compile and preview your novel manuscript.
                  </p>
                  <button
                    onClick={handleSelectAll}
                    className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium"
                  >
                    Select All Scenes
                  </button>
                </div>
              ) : previewTab === 'reading' ? (
                <div className="max-w-2xl mx-auto py-4 font-serif text-stone-300 leading-relaxed space-y-6 select-text">
                  <div className="text-center pb-6 border-b border-stone-800">
                    <h1 className="text-2xl md:text-3xl font-bold text-stone-100 font-sans tracking-tight">
                      {novelTitle}
                    </h1>
                    {genre && <p className="text-xs text-amber-500 italic mt-1 font-sans">{genre}</p>}
                    {author && <p className="text-xs text-stone-400 mt-1 font-sans">By {author}</p>}
                  </div>

                  {selectedScenes.map((scene, idx) => {
                    let displayHeading = scene.title;
                    if (headingStyle === 'numbered') {
                      displayHeading = `Chapter ${idx + 1}: ${scene.title}`;
                    } else if (headingStyle === 'simple') {
                      displayHeading = scene.title;
                    }

                    return (
                      <article key={scene.id} className="space-y-3">
                        <h2 className="text-lg font-bold text-stone-100 font-sans tracking-tight pt-2">
                          {displayHeading}
                        </h2>
                        <div className="text-stone-300 text-[13px] leading-relaxed whitespace-pre-wrap font-serif">
                          {scene.content
                            .replace(/^#{1,6}\s+/gm, '')
                            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                            .replace(/^>\s+/gm, '')}
                        </div>
                        {idx < selectedScenes.length - 1 && (
                          <div className="text-center text-stone-600 py-4 font-sans select-none">
                            {sceneSeparator === 'asterisms' ? (
                              <span className="tracking-widest text-amber-500/60 font-semibold">*   *   *</span>
                            ) : sceneSeparator === 'blank' ? (
                              <div className="h-6" />
                            ) : (
                              <hr className="border-stone-800" />
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}

                  {includeAppendix && bibleDocs.length > 0 && (
                    <div className="pt-8 border-t border-stone-800 space-y-4">
                      <h2 className="text-xl font-bold text-amber-400 font-sans">Appendix: Story Bible</h2>
                      {bibleDocs.map((ent) => (
                        <div key={ent.id} className="bg-stone-900/60 p-3 rounded-lg border border-stone-800">
                          <h3 className="font-semibold text-stone-200 font-sans text-xs">
                            {ent.name} <span className="text-stone-500 font-mono text-[10px]">({ent.type})</span>
                          </h3>
                          <div className="text-[12px] text-stone-400 mt-1 whitespace-pre-wrap font-serif">
                            {ent.content.replace(/^#{1,6}\s+/gm, '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <pre className="bg-stone-950 p-4 rounded-lg border border-stone-800 text-stone-300 font-mono text-[11px] whitespace-pre-wrap select-text leading-relaxed">
                  {previewTab === 'markdown' ? compiledMarkdown : compiledText}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: 3 Single-File Export Actions (.md, .txt, .pdf) */}
        <div className="p-3.5 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-950/80 flex-shrink-0">
          <div className="text-stone-400 text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Export full manuscript to a single file in your desired format:</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export as Single .md file */}
            <button
              id="compile-export-md-btn"
              type="button"
              onClick={handleExportMarkdown}
              disabled={selectedScenes.length === 0}
              title="Download compiled manuscript as a single Markdown (.md) file"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>

            {/* Export as Single .txt file */}
            <button
              id="compile-export-txt-btn"
              type="button"
              onClick={handleExportText}
              disabled={selectedScenes.length === 0}
              title="Download compiled manuscript as a single Plain Text (.txt) file"
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-200 font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export .txt</span>
            </button>

            {/* Export as Single .pdf file */}
            <button
              id="compile-export-pdf-btn"
              type="button"
              onClick={handleExportPDF}
              disabled={selectedScenes.length === 0 || isExportingPdf}
              title="Download compiled manuscript as a formatted publication-ready PDF (.pdf) file"
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:opacity-40 text-white font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>Export .pdf</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
