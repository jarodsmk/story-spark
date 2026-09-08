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
import { getDocumentCategory, isCharacterOrWorldDocument } from './utils/documentType.ts';
import { Loader2 } from 'lucide-react';

import { Sidebar } from './components/Navigation/Sidebar.tsx';
import { EditorContainer } from './components/Editor/EditorContainer.tsx';
import { SettingsModal } from './components/Settings/SettingsModal.tsx';
import { ModalsContainer } from './components/Modals/ModalsContainer.tsx';
import { SceneSummaryModal } from './components/Modals/SceneSummaryModal.tsx';

export function App() {
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

  const { currentTheme, isThemeActive } = useCoverTheme(novelsState.activeNovel, coverThemeOptions);

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('story_spark_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

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

  // Sync loaded file with activeFilePath from useProjectFiles when it changes (e.g. novel switch)
  useEffect(() => {
    if (files.activeFilePath && files.activeFilePath !== loadedPathRef.current) {
      loadFile(files.activeFilePath);
    }
  }, [files.activeFilePath]);

  // Periodically refresh active novel word count
  useEffect(() => {
    let isMounted = true;
    files.getTotalWordCount().then(w => {
      if (isMounted) setActiveWordCount(w);
    });
    return () => {
      isMounted = false;
    };
  }, [files.sceneFiles, hist.state]);

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
      handleChange(replacePassage(hist.state, selRange.start, selRange.end, res.rewrittenText));
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
    const newText = applyMultipleSuggestions(hist.state, activeAI);
    handleChange(newText);
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
      className="flex h-screen w-screen overflow-hidden bg-stone-900 text-stone-100 select-none relative"
      style={{
        backgroundImage: isThemeActive && currentTheme ? 'var(--app-glow)' : undefined,
      }}
    >
      {/* Top Page Loading Bar */}
      {(files.isLoadingScenes || isLoadingCurrentScene || isImporting) && (
        <div
          id="global-page-loading-bar"
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 z-50 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"
        />
      )}

      {/* Floating Status Pill for Page Loading */}
      {(files.isLoadingScenes || isLoadingCurrentScene || isImporting) && (
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
        activeFilePath={files.activeFilePath}
        isLoadingScenes={files.isLoadingScenes}
        isLoadingCurrentScene={isLoadingCurrentScene}
        onSelectFile={loadFile}
        onNewScene={async () => {
          const t = prompt('Scene title:');
          if (t) loadFile(await files.createScene(t));
        }}
        onNewBibleEntry={async (t) => {
          const n = prompt(`${t} name:`);
          if (n) loadFile(await files.createBibleEntry(n, t));
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
        currentTheme={currentTheme}
        isThemeActive={isThemeActive}
      />

      <EditorContainer
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
          isCharacterOrWorld
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
        isLoadingCurrentScene={isLoadingCurrentScene}
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
    </div>
  );
}

