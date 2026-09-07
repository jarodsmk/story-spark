import { useState, useEffect, useCallback, useRef } from 'react';
import { fs, FileItem } from '../storage/fs.ts';
import { SceneSummary, LLMSettings } from '../types/index.ts';
import { summarizeSceneContent } from '../engine/ai/index.ts';

export function useSceneSummaries(
  activeNovelId: string = 'default',
  sceneFiles: FileItem[] = [],
  llmSettings?: LLMSettings
) {
  const [summaries, setSummaries] = useState<Record<string, SceneSummary>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingPath, setGeneratingPath] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metadataPath =
    activeNovelId === 'default'
      ? 'metadata/scene_summaries.json'
      : `novels/${activeNovelId}/metadata/scene_summaries.json`;
  const storageKey = `storyspark_scene_summaries_${activeNovelId}`;

  // Load summaries from fs / localStorage
  const loadSummaries = useCallback(async () => {
    try {
      // 1. Try reading from filesystem
      const content = await fs.readFile(metadataPath).catch(() => null);
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          setSummaries(parsed);
          return;
        }
      }

      // 2. Fallback to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = window.localStorage.getItem(storageKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === 'object') {
            setSummaries(parsed);
            return;
          }
        }
      }

      setSummaries({});
    } catch (err) {
      console.warn('Failed to load scene summaries:', err);
      setSummaries({});
    }
  }, [metadataPath, storageKey]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  // Persist summaries map
  const persistSummaries = useCallback(
    async (updated: Record<string, SceneSummary>) => {
      setSummaries(updated);
      try {
        const json = JSON.stringify(updated, null, 2);
        await fs.writeFile(metadataPath, json);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(storageKey, json);
        }
      } catch (err) {
        console.warn('Failed to persist scene summaries:', err);
      }
    },
    [metadataPath, storageKey]
  );

  const getSummary = useCallback(
    (filePath: string): SceneSummary | undefined => {
      return summaries[filePath];
    },
    [summaries]
  );

  const saveSummary = useCallback(
    async (filePath: string, summaryText: string, title?: string) => {
      const cleanSummary = summaryText.trim();
      const sceneTitle = title || filePath.split('/').pop()?.replace(/\.md$/, '') || 'Untitled Scene';
      const wordCount = cleanSummary.split(/\s+/).filter((w) => w.length > 0).length;

      const updated: Record<string, SceneSummary> = {
        ...summaries,
        [filePath]: {
          filePath,
          title: sceneTitle,
          summary: cleanSummary,
          wordCount,
          updatedAt: Date.now(),
        },
      };

      await persistSummaries(updated);
    },
    [summaries, persistSummaries]
  );

  const deleteSummary = useCallback(
    async (filePath: string) => {
      const updated = { ...summaries };
      delete updated[filePath];
      await persistSummaries(updated);
    },
    [summaries, persistSummaries]
  );

  const generateSummaryForScene = useCallback(
    async (
      filePath: string,
      content?: string,
      title?: string,
      instructions?: string,
      customSettings?: LLMSettings
    ): Promise<SceneSummary> => {
      setIsGenerating(true);
      setGeneratingPath(filePath);
      setError(null);

      try {
        // If content is not passed in, read it from fs
        let sceneContent = content;
        if (!sceneContent) {
          sceneContent = await fs.readFile(filePath);
        }

        if (!sceneContent || !sceneContent.trim()) {
          throw new Error('Scene content is empty. Write or import some text before generating a summary.');
        }

        const sceneTitle = title || filePath.split('/').pop()?.replace(/\.md$/, '').replace(/^\d+-/, '') || 'Untitled Scene';

        const result = await summarizeSceneContent(
          {
            sceneContent,
            sceneTitle,
            instructions,
          },
          customSettings || llmSettings
        );

        const newSummary: SceneSummary = {
          filePath,
          title: sceneTitle,
          summary: result.summary,
          wordCount: result.wordCount,
          updatedAt: Date.now(),
        };

        const updated = {
          ...summaries,
          [filePath]: newSummary,
        };

        await persistSummaries(updated);
        return newSummary;
      } catch (err: any) {
        const msg = err?.message || 'Failed to generate scene summary';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsGenerating(false);
        setGeneratingPath(null);
      }
    },
    [summaries, persistSummaries, llmSettings]
  );

  // Batch generate summaries for all scenes that don't have one yet
  const generateAllMissingSummaries = useCallback(
    async (customSettings?: LLMSettings) => {
      const missing = sceneFiles.filter((f) => !summaries[f.path]);
      if (missing.length === 0) return;

      setIsGenerating(true);
      setError(null);
      setBatchProgress({ current: 0, total: missing.length });

      let currentMap = { ...summaries };

      for (let i = 0; i < missing.length; i++) {
        const file = missing[i];
        setGeneratingPath(file.path);
        setBatchProgress({ current: i + 1, total: missing.length });

        try {
          const content = await fs.readFile(file.path);
          if (content && content.trim()) {
            const title = file.name.replace(/\.md$/, '').replace(/^\d+-/, '');
            const result = await summarizeSceneContent(
              {
                sceneContent: content,
                sceneTitle: title,
              },
              customSettings || llmSettings
            );

            currentMap = {
              ...currentMap,
              [file.path]: {
                filePath: file.path,
                title,
                summary: result.summary,
                wordCount: result.wordCount,
                updatedAt: Date.now(),
              },
            };
            await persistSummaries(currentMap);
          }
        } catch (err) {
          console.warn(`Failed batch summary for ${file.path}:`, err);
        }
      }

      setIsGenerating(false);
      setGeneratingPath(null);
      setBatchProgress(null);
    },
    [sceneFiles, summaries, persistSummaries, llmSettings]
  );

  // Get summaries of scenes that appear strictly before the current scene
  const getPriorSceneSummaries = useCallback(
    (currentFilePath: string): Array<{ title: string; summary: string }> => {
      const currentIndex = sceneFiles.findIndex((f) => f.path === currentFilePath);
      const priorFiles = currentIndex > 0 ? sceneFiles.slice(0, currentIndex) : [];

      const result: Array<{ title: string; summary: string }> = [];
      for (const file of priorFiles) {
        const s = summaries[file.path];
        if (s && s.summary && s.summary.trim()) {
          result.push({
            title: s.title || file.name.replace(/\.md$/, ''),
            summary: s.summary,
          });
        }
      }
      return result;
    },
    [sceneFiles, summaries]
  );

  // Get all scene summaries in manuscript order
  const getAllSceneSummaries = useCallback((): Array<{ title: string; summary: string; filePath: string }> => {
    const result: Array<{ title: string; summary: string; filePath: string }> = [];
    for (const file of sceneFiles) {
      const s = summaries[file.path];
      if (s && s.summary && s.summary.trim()) {
        result.push({
          filePath: file.path,
          title: s.title || file.name.replace(/\.md$/, ''),
          summary: s.summary,
        });
      }
    }
    return result;
  }, [sceneFiles, summaries]);

  return {
    summaries,
    isGenerating,
    generatingPath,
    batchProgress,
    error,
    getSummary,
    saveSummary,
    deleteSummary,
    generateSummaryForScene,
    generateAllMissingSummaries,
    getPriorSceneSummaries,
    getAllSceneSummaries,
  };
}
