import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { fs } from './storage/fs.ts';
import { Suggestion, Novel, CoverTheme } from './types/index.ts';
import { runAllChecks } from './engine/checks/index.ts';
import { rewritePassage, runAIEditorialPass } from './engine/ai/index.ts';
import { applySuggestion, replacePassage, applyMultipleSuggestions } from './engine/diff/index.ts';
import { useHistory } from './hooks/useHistory.ts';
import { useNovels } from './hooks/useNovels.ts';
import { useProjectFiles } from './hooks/useProjectFiles.ts';
import { useProjectSettings } from './hooks/useProjectSettings.ts';
import { useManuscriptActions } from './hooks/useManuscriptActions.ts';
import { useLoreManager } from './hooks/useLoreManager.ts';
import { useSceneSummaries } from './hooks/useSceneSummaries.ts';
import { useCoverTheme } from './hooks/useCoverTheme.ts';
import { useThemeMode } from './hooks/useThemeMode.ts';
import { getDocumentCategory, isCharacterOrWorldDocument } from './utils/documentType.ts';
import { Loader2 } from 'lucide-react';

import { Sidebar } from './components/Navigation/Sidebar.tsx';
import { EditorContainer } from './components/Editor/EditorContainer.tsx';
import { PanelResizer } from './components/Common/PanelResizer.tsx';
import { SettingsModal } from './components/Settings/SettingsModal.tsx';
import { ModalsContainer } from './components/Modals/ModalsContainer.tsx';
import { SceneSummaryModal } from './components/Modals/SceneSummaryModal.tsx';
import { OfflineIndicator } from './components/Common/OfflineIndicator.tsx';
import { FullScreenLoader } from './components/Common/FullScreenLoader.tsx';
import { NewLoreModal, EntryCategory } from './components/Editor/NewLoreModal.tsx';

export function App() {
  const themeModeState = useThemeMode();
  const novelsState = useNovels();
  const files = useProjectFiles(novelsState.activeNovelId);
  const settings = useProjectSettings();
  const hist = useHistory<string>('');
  const lore = useLoreManager(novelsState.activeNovelId, files.bibleFiles, files.scratchpadFiles);
  const sceneSummaries = useSceneSummaries(
    novelsState.activeNovelId,
    files.sceneFiles,
    settings.llmSettings,
    novelsState.activeNovel?.customPrompts?.summarization
  );

  const [isLoadingCurrentScene, setIsLoadingCurrentScene] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [hasInitialLoaded, setHasInitialLoaded] = useState<boolean>(false);
  const [isLoaderFading, setIsLoaderFading] = useState<boolean>(false);

  const handleSaveTheme = useCallback(
    async (novelId: string, theme: any) => {
      await novelsState.updateNovel(novelId, { coverTheme: theme });
    },
    [novelsState.updateNovel]
  );

  const coverThemeOptions = useMemo(
    () => ({
      onSaveTheme: handleSaveTheme,
    }),
    [handleSaveTheme]
  );

  const { currentTheme, isThemeActive } = useCoverTheme(
    novelsState.activeNovel,
    coverThemeOptions,
    themeModeState.isLightMode
  );

  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const [selText, setSelText] = useState('');
  const [selRange, setSelRange] = useState({ start: 0, end: 0 });
  const [openSettings, setOpenSettings] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openNovelManager, setOpenNovelManager] = useState(false);
  const [novelModalTab, setNovelModalTab] = useState<'list' | 'create' | 'edit' | 'import' | 'prompts'>('list');
  const [novelModalNovelId, setNovelModalNovelId] = useState<string>('');
  const [openSummariesModal, setOpenSummariesModal] = useState(false);
  const [summaryModalTargetFile, setSummaryModalTargetFile] = useState<string>('');
  const [genAI, setGenAI] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [activeWordCount, setActiveWordCount] = useState<number>(0);
  const [openCoverModal, setOpenCoverModal] = useState(false);
  const [coverTargetNovel, setCoverTargetNovel] = useState<Novel | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Global In-App Modal for creating Scenes, Characters, World entries, and Scratchpad Ideas
  const [globalNewEntryModal, setGlobalNewEntryModal] = useState<{
    isOpen: boolean;
    category: EntryCategory;
    defaultName: string;
  }>({
    isOpen: false,
    category: 'character',
    defaultName: '',
  });

  // 2-second flash animation state for changed or added text via AI
  const [flashRange, setFlashRange] = useState<{ start: number; end: number; key: number } | null>(null);
  const flashTimerRef = useRef<any>(null);

  const triggerFlash = useCallback((start: number, end: number) => {
    if (start >= end) return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashRange({ start, end, key: Date.now() });
    flashTimerRef.current = setTimeout(() => {
      setFlashRange(null);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('story_spark_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const DEFAULT_SIDEBAR_WIDTH = 240;
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('story_spark_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 180 && parsed <= 480) return parsed;
      }
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const initialSidebarWidthRef = useRef<number>(sidebarWidth);

  const handleSidebarResizeStart = () => {
    initialSidebarWidthRef.current = sidebarWidth;
  };

  const handleSidebarResize = (deltaX: number) => {
    const min = 180;
    const maxAvailable = Math.max(min, window.innerWidth - 680);
    const max = Math.min(480, maxAvailable);
    const newWidth = Math.max(min, Math.min(max, Math.round(initialSidebarWidthRef.current + deltaX)));
    setSidebarWidth(newWidth);
  };

  const handleSidebarResizeEnd = () => {
    try {
      localStorage.setItem('story_spark_sidebar_width', String(sidebarWidth));
    } catch {}
  };

  const handleSidebarReset = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    try {
      localStorage.setItem('story_spark_sidebar_width', String(DEFAULT_SIDEBAR_WIDTH));
    } catch {}
  };

  const handleSidebarStep = (step: number) => {
    setSidebarWidth((prev) => {
      const min = 180;
      const maxAvailable = Math.max(min, window.innerWidth - 680);
      const max = Math.min(480, maxAvailable);
      const next = Math.max(min, Math.min(max, prev + step));
      try {
        localStorage.setItem('story_spark_sidebar_width', String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('story_spark_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleToggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCoverUpload = (novel: Novel) => {
    setCoverTargetNovel(novel);
    setOpenCoverModal(true);
  };

  const handleOpenNovelManager = () => {
    setNovelModalTab('list');
    setNovelModalNovelId(novelsState.activeNovelId);
    setOpenNovelManager(true);
  };

  const handleOpenNovelPrompts = (novel: Novel) => {
    setNovelModalTab('prompts');
    setNovelModalNovelId(novel.id);
    setOpenNovelManager(true);
  };

  const ms = useManuscriptActions(
    files.activeFileName,
    hist.state,
    files.sceneFiles,
    files.bibleFiles,
    novelsState.activeNovel?.title || 'Novel'
  );

  const loadedPathRef = useRef<string>('');

  const loadFile = async (path: string) => {
    setIsLoadingCurrentScene(true);
    try {
      loadedPathRef.current = path;
      if (files.activeFilePath !== path) {
        files.setActiveFilePath(path);
      }
      files.setActiveFileName(path.split('/').pop() || path);
      let c: string;
      try {
        c = await fs.readFile(path);
      } catch {
        const rawName = path.split('/').pop()?.replace(/\.md$/, '') || 'scene';
        const formatted = rawName.replace(/^\d+-/, '').replace(/-/g, ' ');
        const title = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        c = `# ${title}\n\nBegin writing here...`;
        await fs.writeFile(path, c);
      }
      hist.reset(c);
      setBaseline(c);
      setSelText('');
      setDismissed(new Set());
      setAiSuggestions([]);
    } catch (e) {
      console.error('Failed to load file at', path, e);
    } finally {
      setIsLoadingCurrentScene(false);
    }
  };

  const handleCreateNewEntry = useCallback(
    async (
      name: string,
      category: EntryCategory,
      details: { roleOrAtmosphere: string; summary: string }
    ) => {
      if (category === 'scene') {
        const path = await files.createScene(name);
        if (details.summary || details.roleOrAtmosphere) {
          const metaHeader = [
            `# ${name}`,
            details.roleOrAtmosphere ? `**POV / Setting**: ${details.roleOrAtmosphere}` : '',
            details.summary ? `> **Summary**: ${details.summary}` : '',
            '',
            'Write your scene here...',
          ]
            .filter((line) => line !== '')
            .join('\n\n');
          await fs.writeFile(path, metaHeader);
        }
        await files.refreshFileList();
        await loadFile(path);
      } else if (category === 'idea') {
        const statusVal = details.roleOrAtmosphere || 'Rough Concept';
        const content = `# Idea: ${name}\n\n- **Status**: ${statusVal}\n- **Summary**: ${
          details.summary || 'Ad-hoc idea for reference and exploration.'
        }\n\nWrite down quick thoughts, plot hooks, research notes, or dialogue ideas...\n`;
        const path = await files.createScratchpadIdea(name, content);
        await files.refreshFileList();
        await loadFile(path);
      } else {
        const entry = await lore.createLoreEntry(name, category, details);
        await files.refreshFileList();
        if (entry?.path) {
          await loadFile(entry.path);
        }
      }
    },
    [files, lore]
  );

  // Sync loaded file with activeFilePath from useProjectFiles when it changes (e.g. novel switch)
  useEffect(() => {
    if (files.activeFilePath && files.activeFilePath !== loadedPathRef.current) {
      loadFile(files.activeFilePath);
    }
  }, [files.activeFilePath]);

  // Check if expected novel and scene have fully loaded for the initial page load
  const isInitialReady = Boolean(
    !novelsState.isLoadingNovels &&
    !files.isLoadingScenes &&
    !isLoadingCurrentScene &&
    loadedPathRef.current &&
    loadedPathRef.current === files.activeFilePath
  );

  useEffect(() => {
    if (!hasInitialLoaded && isInitialReady) {
      setIsLoaderFading(true);
      const timer = setTimeout(() => {
        setHasInitialLoaded(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [hasInitialLoaded, isInitialReady]);

  // Fallback timer: ensure the user is never stuck if storage operations stall
  useEffect(() => {
    if (!hasInitialLoaded) {
      const fallbackTimer = setTimeout(() => {
        setIsLoaderFading(true);
        setTimeout(() => setHasInitialLoaded(true), 350);
      }, 6000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [hasInitialLoaded]);

  // Periodically refresh active novel word count
  useEffect(() => {
    let isMounted = true;
    files.getTotalWordCount(hist.state, files.activeFilePath).then(w => {
      if (isMounted) setActiveWordCount(w);
    });
    return () => {
      isMounted = false;
    };
  }, [files.sceneFiles, hist.state, files.activeFilePath]);

  const timer = useRef<any>(null);
  const handleChange = (c: string) => {
    hist.set(c);
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fs.writeFile(files.activeFilePath, c);
      setSaving(false);
    }, 600);
  };

  const priorSummaries = useMemo(() => {
    return sceneSummaries.getPriorSceneSummaries(files.activeFilePath);
  }, [sceneSummaries.summaries, files.activeFilePath]);

  const allSummaries = useMemo(() => {
    return sceneSummaries.getAllSceneSummaries();
  }, [sceneSummaries.summaries]);

  const currentSummary = sceneSummaries.getSummary(files.activeFilePath);

  const isCharacterOrWorld = useMemo(() => {
    return isCharacterOrWorldDocument(files.activeFilePath);
  }, [files.activeFilePath]);

  const documentCategory = useMemo(() => {
    return getDocumentCategory(files.activeFilePath);
  }, [files.activeFilePath]);

  const ignoredSet = useMemo(() => new Set(settings.ignoredTerms.map(t => t.term.toLowerCase())), [settings.ignoredTerms]);

  const deterministicSuggestions = useMemo(() => {
    // Never run suggestions or checks on characters & world/lore screens
    if (!hist.state || isCharacterOrWorld) return [];
    return runAllChecks(hist.state, settings.rules, ignoredSet).filter(s => !dismissed.has(s.id));
  }, [hist.state, settings.rules, ignoredSet, dismissed, isCharacterOrWorld]);

  const suggestions = useMemo(() => {
    // Never provide suggestions on characters & world/lore screens
    if (isCharacterOrWorld) return [];
    const activeAI = aiSuggestions.filter(s => !dismissed.has(s.id));
    return [...deterministicSuggestions, ...activeAI];
  }, [isCharacterOrWorld, deterministicSuggestions, aiSuggestions, dismissed]);

  const handleAIRewrite = async (inst: string) => {
    // Never run AI features on characters & world/lore screens
    if (isCharacterOrWorld) return;
    if (!selText.trim()) return;
    setGenAI(true);
    setAiErr(null);
    try {
      const res = await rewritePassage(
        selText,
        inst,
        settings.llmSettings,
        novelsState.activeNovel?.customPrompts?.rewrite
      );
      const newText = replacePassage(hist.state, selRange.start, selRange.end, res.rewrittenText);
      handleChange(newText);
      triggerFlash(selRange.start, selRange.start + res.rewrittenText.length);
    } catch (err: any) {
      setAiErr(err.message || 'Drafting failed.');
    } finally {
      setGenAI(false);
    }
  };

  const handleRunAIPass = async (
    passType: string,
    instruction?: string,
    scope: 'scene' | 'selection' = 'scene'
  ) => {
    // Never run AI features or editorial passes on characters & world/lore screens
    if (isCharacterOrWorld) return;
    const textToAnalyze = scope === 'selection' && selText.trim() ? selText : hist.state;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzingAI(true);
    setAiErr(null);
    try {
      const result = await runAIEditorialPass(textToAnalyze, {
        passType: passType as any,
        instruction,
        contextTitle: files.activeFileName,
        systemPrompt: novelsState.activeNovel?.customPrompts?.editorialPass,
      });

      const adjustedSuggestions = result.suggestions.map(s => {
        if (scope === 'selection') {
          return {
            ...s,
            startIndex: s.startIndex + selRange.start,
            endIndex: s.endIndex + selRange.start,
          };
        }
        return s;
      });

      setAiSuggestions(prev => {
        const existingIds = new Set(adjustedSuggestions.map(a => a.id));
        const kept = prev.filter(p => !existingIds.has(p.id) && !dismissed.has(p.id));
        return [...adjustedSuggestions, ...kept];
      });
    } catch (err: any) {
      console.error('AI Pass failed:', err);
      setAiErr(err.message || 'AI Editorial Pass failed.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleAcceptAllAI = () => {
    const activeAI = aiSuggestions.filter(s => !dismissed.has(s.id));
    if (activeAI.length === 0) return;
    const minStart = Math.min(...activeAI.map(s => s.startIndex));
    const newText = applyMultipleSuggestions(hist.state, activeAI);
    handleChange(newText);
    triggerFlash(minStart, minStart + Math.max(1, newText.length - minStart));
    setDismissed(prev => {
      const next = new Set(prev);
      activeAI.forEach(s => next.add(s.id));
      return next;
    });
    setAiSuggestions([]);
  };

  const handleClearAI = () => {
    setDismissed(prev => {
      const next = new Set(prev);
      aiSuggestions.forEach(s => next.add(s.id));
      return next;
    });
    setAiSuggestions([]);
  };

  const handleReferenceLore = (targetPath: string, start: number, end: number) => {
    const { newContent } = lore.linkTextToLore(hist.state, start, end, targetPath);
    handleChange(newContent);
  };

  const handleUnlinkLore = (start: number, end: number) => {
    const { newContent } = lore.unlinkTextFromLore(hist.state, start, end);
    handleChange(newContent);
  };

  const handleCreateLoreEntry = async (
    name: string,
    category: 'character' | 'world',
    details: { roleOrAtmosphere: string; summary: string }
  ) => {
    const entry = await lore.createLoreEntry(name, category, details);
    await files.refreshFileList();
    return entry;
  };

  return (
    <div
      id="storyspark-app-root"
      data-theme={themeModeState.themeMode}
      className="flex h-screen w-screen overflow-hidden bg-stone-900 text-stone-100 select-none relative transition-colors duration-200"
      style={{
        backgroundImage: isThemeActive && currentTheme ? 'var(--app-glow)' : undefined,
      }}
    >
      {/* Full Screen Initial Loader */}
      {!hasInitialLoaded && (
        <FullScreenLoader
          activeNovelTitle={novelsState.activeNovel?.title}
          activeSceneName={files.activeFileName}
          isLoadingNovels={novelsState.isLoadingNovels}
          isLoadingScenes={files.isLoadingScenes}
          isLoadingCurrentScene={isLoadingCurrentScene}
          isFadingOut={isLoaderFading}
          isLightMode={themeModeState.isLightMode}
        />
      )}

      {/* Top Page Loading Bar */}
      {hasInitialLoaded && (files.isLoadingScenes || isLoadingCurrentScene || isImporting) && (
        <div
          id="global-page-loading-bar"
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 z-50 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"
        />
      )}

      {/* Floating Status Pill for Page Loading */}
      {hasInitialLoaded && (files.isLoadingScenes || isLoadingCurrentScene || isImporting) && (
        <div
          id="global-page-loading-status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/95 border border-amber-500/40 text-amber-200 text-xs font-medium shadow-2xl backdrop-blur-md pointer-events-none"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          <span>
            {isImporting
              ? 'Importing manuscript and assets...'
              : isLoadingCurrentScene
              ? `Loading scene${files.activeFileName ? `: ${files.activeFileName.replace(/\.md$/, '').replace(/^\d+-/, '')}` : '...'}`
              : 'Loading scenes...'}
          </span>
        </div>
      )}

      <Sidebar
        sceneFiles={files.sceneFiles}
        bibleFiles={files.bibleFiles}
        scratchpadFiles={files.scratchpadFiles}
        totalWordCount={activeWordCount}
        activeFilePath={files.activeFilePath}
        isLoadingScenes={files.isLoadingScenes}
        isLoadingCurrentScene={isLoadingCurrentScene}
        onSelectFile={loadFile}
        onNewScene={() => {
          setGlobalNewEntryModal({
            isOpen: true,
            category: 'scene',
            defaultName: '',
          });
        }}
        onNewBibleEntry={(type) => {
          setGlobalNewEntryModal({
            isOpen: true,
            category: type === 'world' ? 'world' : 'character',
            defaultName: '',
          });
        }}
        onNewScratchpadIdea={() => {
          setGlobalNewEntryModal({
            isOpen: true,
            category: 'idea',
            defaultName: '',
          });
        }}
        onDeleteFile={async (p) => {
          await files.deleteFile(p);
          if (files.activeFilePath === p && files.sceneFiles[0]) {
            loadFile(files.sceneFiles[0].path);
          }
        }}
        onOpenSettings={() => setOpenSettings(true)}
        onImportFile={() => setOpenImport(true)}
        onExportCompiled={ms.handleCompile}
        novels={novelsState.novels}
        activeNovel={novelsState.activeNovel}
        authorProfile={settings.authorProfile}
        onSelectNovel={novelsState.selectNovel}
        onOpenNovelManager={handleOpenNovelManager}
        onOpenNovelPrompts={handleOpenNovelPrompts}
        onUploadCover={handleOpenCoverUpload}
        summaries={sceneSummaries.summaries}
        onOpenSceneSummaries={(path) => {
          setSummaryModalTargetFile(path || files.activeFilePath);
          setOpenSummariesModal(true);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentTheme={currentTheme}
        isThemeActive={isThemeActive}
        sidebarWidth={sidebarWidth}
      />

      {!isSidebarCollapsed && (
        <PanelResizer
          id="sidebar-resizer"
          label="Navigation Sidebar"
          onResize={handleSidebarResize}
          onResizeStart={handleSidebarResizeStart}
          onResizeEnd={handleSidebarResizeEnd}
          onReset={handleSidebarReset}
          onStepChange={handleSidebarStep}
        />
      )}

      <EditorContainer
        key={`editor-container-${settings.diffPaneEnabled ? 'diff-enabled' : 'diff-disabled'}`}
        sidebarWidth={sidebarWidth}
        content={hist.state}
        onContentChange={handleChange}
        activeFileName={files.activeFileName}
        isSaving={saving}
        wordCount={hist.state.trim().split(/\s+/).filter(w => w.length > 0).length}
        suggestions={suggestions}
        onAcceptSuggestion={(s) => {
          handleChange(applySuggestion(hist.state, s.startIndex, s.endIndex, s.replacementText));
          setDismissed(prev => new Set(prev).add(s.id));
          if (s.ruleCategory === 'ai' || s.type === 'ai-rewrite') {
            setAiSuggestions(prev => prev.filter(item => item.id !== s.id));
            triggerFlash(s.startIndex, s.startIndex + s.replacementText.length);
          }
        }}
        onDismissSuggestion={(s) => {
          setDismissed(prev => new Set(prev).add(s.id));
          if (s.ruleCategory === 'ai' || s.type === 'ai-rewrite') {
            setAiSuggestions(prev => prev.filter(item => item.id !== s.id));
          }
        }}
        onIgnoreTerm={settings.addIgnoredTerm}
        selectedText={selText}
        onSelectionChange={(t, s, e) => { setSelText(t); setSelRange({ start: s, end: e }); }}
        onAIRewrite={handleAIRewrite}
        isGeneratingAI={genAI}
        aiError={aiErr}
        onRunAIPass={handleRunAIPass}
        onAcceptAllAI={handleAcceptAllAI}
        onClearAI={handleClearAI}
        isAnalyzingAI={isAnalyzingAI}
        baselineContent={baseline}
        onUndo={hist.undo}
        onRedo={hist.redo}
        canUndo={hist.canUndo}
        canRedo={hist.canRedo}
        onExport={ms.handleExport}
        loreEntries={lore.entries}
        loreCharacters={lore.characters}
        loreWorld={lore.loreItems}
        onReferenceLore={handleReferenceLore}
        onUnlinkLore={handleUnlinkLore}
        onCreateLoreEntry={handleCreateLoreEntry}
        onOpenFile={loadFile}
        llmSettings={settings.llmSettings}
        customPrompts={novelsState.activeNovel?.customPrompts}
        currentSceneSummary={currentSummary?.summary}
        currentSceneSummaryWordCount={currentSummary?.wordCount}
        priorSceneSummaries={priorSummaries}
        allSceneSummaries={allSummaries}
        onOpenSceneSummary={
          isCharacterOrWorld || documentCategory === 'scratchpad'
            ? undefined
            : () => {
                setSummaryModalTargetFile(files.activeFilePath);
                setOpenSummariesModal(true);
              }
        }
        isCharacterOrWorld={isCharacterOrWorld}
        documentCategory={documentCategory}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={handleToggleSidebarCollapse}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isLoadingCurrentScene={isLoadingCurrentScene}
        diffPaneEnabled={settings.diffPaneEnabled}
        flashRange={flashRange}
        onTriggerFlash={triggerFlash}
      />

      <SettingsModal
        isOpen={openSettings}
        onClose={() => setOpenSettings(false)}
        rules={settings.rules}
        onSaveRules={settings.saveRules}
        ignoredTerms={settings.ignoredTerms}
        onAddIgnoredTerm={settings.addIgnoredTerm}
        onRemoveIgnoredTerm={settings.removeIgnoredTerm}
        llmSettings={settings.llmSettings}
        onSaveLLMSettings={(s) => { settings.saveLLMSettings(s); setOpenSettings(false); }}
        authorProfile={settings.authorProfile}
        onSaveAuthorProfile={settings.saveAuthorProfile}
        themeMode={themeModeState.themeMode}
        onToggleThemeMode={themeModeState.toggleThemeMode}
        diffPaneEnabled={settings.diffPaneEnabled}
        onToggleDiffPane={settings.saveDiffPaneEnabled}
      />

      <ModalsContainer
        isImportOpen={openImport}
        setIsImportOpen={setOpenImport}
        isExportOpen={ms.isExportOpen}
        setIsExportOpen={ms.setIsExportOpen}
        isNovelOpen={openNovelManager}
        setIsNovelOpen={setOpenNovelManager}
        initialNovelModalTab={novelModalTab}
        initialNovelModalNovelId={novelModalNovelId}
        authorProfile={settings.authorProfile}
        isCoverUploadOpen={openCoverModal}
        setIsCoverUploadOpen={setOpenCoverModal}
        coverUploadNovel={coverTargetNovel}
        onOpenCoverUpload={handleOpenCoverUpload}
        onSaveCover={async (novelId, coverDataUrl, theme) => {
          await novelsState.updateNovelCover(novelId, coverDataUrl, theme);
        }}
        compiledPreview={ms.compiledPreview}
        createScene={files.createScene}
        createBibleEntry={files.createBibleEntry}
        loadFile={loadFile}
        novels={novelsState.novels}
        activeNovelId={novelsState.activeNovelId}
        activeNovel={novelsState.activeNovel}
        refreshFileList={files.refreshFileList}
        onSelectNovel={novelsState.selectNovel}
        onCreateNovel={novelsState.createNovel}
        onUpdateNovel={novelsState.updateNovel}
        onDeleteNovel={novelsState.deleteNovel}
        onDuplicateNovel={novelsState.duplicateNovel}
        onImportNovelCrafter={novelsState.importNovelCrafter}
        novelTitle={novelsState.activeNovel?.title}
        activeWordCount={activeWordCount}
        sceneFiles={files.sceneFiles}
        bibleFiles={files.bibleFiles}
        activeFilePath={files.activeFilePath}
        currentEditorContent={hist.state}
        isImporting={isImporting}
        setIsImporting={setIsImporting}
      />

      <SceneSummaryModal
        isOpen={openSummariesModal}
        onClose={() => setOpenSummariesModal(false)}
        currentFilePath={summaryModalTargetFile || files.activeFilePath}
        currentFileTitle={
          files.sceneFiles.find(
            (f) => f.path === (summaryModalTargetFile || files.activeFilePath)
          )?.name.replace(/\.md$/, '').replace(/^\d+-/, '') ||
          files.activeFileName.replace(/\.md$/, '').replace(/^\d+-/, '')
        }
        currentContent={
          summaryModalTargetFile === files.activeFilePath || !summaryModalTargetFile
            ? hist.state
            : ''
        }
        sceneFiles={files.sceneFiles}
        summaries={sceneSummaries.summaries}
        onGenerateSummary={sceneSummaries.generateSummaryForScene}
        onSaveSummary={sceneSummaries.saveSummary}
        onDeleteSummary={sceneSummaries.deleteSummary}
        onGenerateAllMissing={() =>
          sceneSummaries.generateAllMissingSummaries(settings.llmSettings)
        }
        isGenerating={sceneSummaries.isGenerating}
        generatingPath={sceneSummaries.generatingPath}
        batchProgress={sceneSummaries.batchProgress}
        error={sceneSummaries.error}
        onSelectScene={(p) => {
          loadFile(p);
        }}
      />

      <NewLoreModal
        isOpen={globalNewEntryModal.isOpen}
        initialCategory={globalNewEntryModal.category}
        defaultName={globalNewEntryModal.defaultName}
        allowScene={true}
        onSubmit={handleCreateNewEntry}
        onClose={() => setGlobalNewEntryModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <OfflineIndicator />
    </div>
  );
}

