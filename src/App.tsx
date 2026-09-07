import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fs } from './storage/fs.ts';
import { Suggestion } from './types/index.ts';
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
  const lore = useLoreManager(novelsState.activeNovelId, files.bibleFiles);
  const sceneSummaries = useSceneSummaries(
    novelsState.activeNovelId,
    files.sceneFiles,
    settings.llmSettings
  );

  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const [selText, setSelText] = useState('');
  const [selRange, setSelRange] = useState({ start: 0, end: 0 });
  const [openSettings, setOpenSettings] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openNovelManager, setOpenNovelManager] = useState(false);
  const [openSummariesModal, setOpenSummariesModal] = useState(false);
  const [summaryModalTargetFile, setSummaryModalTargetFile] = useState<string>('');
  const [genAI, setGenAI] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [activeWordCount, setActiveWordCount] = useState<number>(0);

  const ms = useManuscriptActions(
    files.activeFileName,
    hist.state,
    files.sceneFiles,
    files.bibleFiles,
    novelsState.activeNovel?.title || 'Novel'
  );

  const loadedPathRef = useRef<string>('');

  const loadFile = async (path: string) => {
    try {
      loadedPathRef.current = path;
      files.setActiveFilePath(path);
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
  }, [sceneSummaries, files.activeFilePath]);

  const allSummaries = useMemo(() => {
    return sceneSummaries.getAllSceneSummaries();
  }, [sceneSummaries]);

  const currentSummary = sceneSummaries.getSummary(files.activeFilePath);

  const ignoredSet = useMemo(() => new Set(settings.ignoredTerms.map(t => t.term.toLowerCase())), [settings.ignoredTerms]);

  const deterministicSuggestions = useMemo(() => {
    if (!hist.state) return [];
    return runAllChecks(hist.state, settings.rules, ignoredSet).filter(s => !dismissed.has(s.id));
  }, [hist.state, settings.rules, ignoredSet, dismissed]);

  const suggestions = useMemo(() => {
    const activeAI = aiSuggestions.filter(s => !dismissed.has(s.id));
    return [...deterministicSuggestions, ...activeAI];
  }, [deterministicSuggestions, aiSuggestions, dismissed]);

  const handleAIRewrite = async (inst: string) => {
    if (!selText.trim()) return;
    setGenAI(true);
    setAiErr(null);
    try {
      const res = await rewritePassage(selText, inst, settings.llmSettings);
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
    const textToAnalyze = scope === 'selection' && selText.trim() ? selText : hist.state;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzingAI(true);
    setAiErr(null);
    try {
      const result = await runAIEditorialPass(textToAnalyze, {
        passType: passType as any,
        instruction,
        contextTitle: files.activeFileName,
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
    <div className="flex h-screen w-screen overflow-hidden bg-stone-900 text-stone-100 select-none">
      <Sidebar
        sceneFiles={files.sceneFiles}
        bibleFiles={files.bibleFiles}
        activeFilePath={files.activeFilePath}
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
        onOpenNovelManager={() => setOpenNovelManager(true)}
        summaries={sceneSummaries.summaries}
        onOpenSceneSummaries={(path) => {
          setSummaryModalTargetFile(path || files.activeFilePath);
          setOpenSummariesModal(true);
        }}
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
          if (s.ruleCategory === 'ai') {
            setAiSuggestions(prev => prev.filter(item => item.id !== s.id));
          }
        }}
        onDismissSuggestion={(s) => {
          setDismissed(prev => new Set(prev).add(s.id));
          if (s.ruleCategory === 'ai') {
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
        currentSceneSummary={currentSummary?.summary}
        currentSceneSummaryWordCount={currentSummary?.wordCount}
        priorSceneSummaries={priorSummaries}
        allSceneSummaries={allSummaries}
        onOpenSceneSummary={() => {
          setSummaryModalTargetFile(files.activeFilePath);
          setOpenSummariesModal(true);
        }}
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

