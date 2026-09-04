import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fs } from './storage/fs.ts';
import { Suggestion } from './types/index.ts';
import { runAllChecks } from './engine/checks/index.ts';
import { rewritePassage } from './engine/ai/index.ts';
import { applySuggestion, replacePassage } from './engine/diff/index.ts';
import { useHistory } from './hooks/useHistory.ts';
import { useProjectFiles } from './hooks/useProjectFiles.ts';
import { useProjectSettings } from './hooks/useProjectSettings.ts';
import { useManuscriptActions } from './hooks/useManuscriptActions.ts';

import { Sidebar } from './components/Navigation/Sidebar.tsx';
import { EditorContainer } from './components/Editor/EditorContainer.tsx';
import { SettingsModal } from './components/Settings/SettingsModal.tsx';
import { ModalsContainer } from './components/Modals/ModalsContainer.tsx';

export function App() {
  const files = useProjectFiles();
  const settings = useProjectSettings();
  const hist = useHistory<string>('');

  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const [selText, setSelText] = useState('');
  const [selRange, setSelRange] = useState({ start: 0, end: 0 });
  const [openSettings, setOpenSettings] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [genAI, setGenAI] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const ms = useManuscriptActions(files.activeFileName, hist.state, files.sceneFiles, files.bibleFiles);

  useEffect(() => {
    files.refreshFileList().then(() => loadFile('scenes/01-prologue.md'));
  }, []);

  const loadFile = async (path: string) => {
    try {
      const c = await fs.readFile(path);
      files.setActiveFilePath(path);
      files.setActiveFileName(path.split('/').pop() || path);
      hist.reset(c);
      setBaseline(c);
      setSelText('');
      setDismissed(new Set());
    } catch (e) {
      console.error(e);
    }
  };

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

  const ignoredSet = useMemo(() => new Set(settings.ignoredTerms.map(t => t.term.toLowerCase())), [settings.ignoredTerms]);

  const suggestions = useMemo(() => {
    if (!hist.state) return [];
    return runAllChecks(hist.state, settings.rules, ignoredSet).filter(s => !dismissed.has(s.id));
  }, [hist.state, settings.rules, ignoredSet, dismissed]);

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
        onDeleteFile={async (p) => { await files.deleteFile(p); if (files.activeFilePath === p && files.sceneFiles[0]) loadFile(files.sceneFiles[0].path); }}
        onOpenSettings={() => setOpenSettings(true)}
        onImportFile={() => setOpenImport(true)}
        onExportCompiled={ms.handleCompile}
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
        }}
        onDismissSuggestion={(s) => setDismissed(prev => new Set(prev).add(s.id))}
        onIgnoreTerm={settings.addIgnoredTerm}
        selectedText={selText}
        onSelectionChange={(t, s, e) => { setSelText(t); setSelRange({ start: s, end: e }); }}
        onAIRewrite={handleAIRewrite}
        isGeneratingAI={genAI}
        aiError={aiErr}
        baselineContent={baseline}
        onUndo={hist.undo}
        onRedo={hist.redo}
        canUndo={hist.canUndo}
        canRedo={hist.canRedo}
        onExport={ms.handleExport}
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
        compiledPreview={ms.compiledPreview}
        createScene={files.createScene}
        createBibleEntry={files.createBibleEntry}
        loadFile={loadFile}
      />
    </div>
  );
}

