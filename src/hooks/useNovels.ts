import { useState, useEffect, useCallback } from 'react';
import { Novel } from '../types/index.ts';
import { db, DEFAULT_NOVELS } from '../storage/db.ts';
import { fs } from '../storage/fs.ts';
import { sanitizeFilename } from '../engine/markdown/index.ts';
import { NovelCrafterParseResult } from '../engine/novelcrafter/index.ts';
import { executeNovelCrafterImport, NovelCrafterImportOptions, NovelCrafterImportSummary } from '../engine/novelcrafter/importer.ts';

export function useNovels() {
  const [novels, setNovels] = useState<Novel[]>(DEFAULT_NOVELS);
  const [activeNovelId, setActiveNovelId] = useState<string>('default');
  const [isLoadingNovels, setIsLoadingNovels] = useState<boolean>(true);

  // Initialize novels and active novel from database
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const storedNovels = await db.getNovels();
        const storedActiveId = await db.getActiveNovelId();
        if (!isMounted) return;

        if (storedNovels && storedNovels.length > 0) {
          setNovels(storedNovels);
          const activeExists = storedNovels.some(n => n.id === storedActiveId);
          setActiveNovelId(activeExists ? storedActiveId : storedNovels[0].id);
        } else {
          setNovels(DEFAULT_NOVELS);
          setActiveNovelId('default');
        }
      } catch (err) {
        console.error('Failed to load novels:', err);
      } finally {
        if (isMounted) setIsLoadingNovels(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeNovel: Novel = novels.find(n => n.id === activeNovelId) || novels[0] || DEFAULT_NOVELS[0];

  const selectNovel = useCallback(async (id: string) => {
    setActiveNovelId(id);
    await db.setActiveNovelId(id);
  }, []);

  const createNovel = useCallback(async (data: {
    title: string;
    genre?: string;
    description?: string;
    targetWordCount?: number;
    template?: 'standard' | 'blank' | 'rich';
    coverImage?: string;
  }): Promise<{ novel: Novel; initialScenePath: string }> => {
    const slug = sanitizeFilename(data.title.toLowerCase()) || 'novel';
    const uniqueId = `${slug}-${Date.now().toString(36)}`;
    const now = Date.now();

    const newNovel: Novel = {
      id: uniqueId,
      title: data.title.trim() || 'Untitled Novel',
      genre: data.genre || 'General Fiction',
      description: data.description?.trim() || '',
      targetWordCount: data.targetWordCount || 50000,
      createdAt: now,
      updatedAt: now,
      coverImage: data.coverImage,
    };

    const initialScenePath = `novels/${uniqueId}/scenes/01-chapter-1.md`;
    const template = data.template || 'standard';

    if (template === 'blank') {
      await fs.writeFile(
        initialScenePath,
        `# Chapter 1: Untitled\n\n`
      );
    } else if (template === 'rich') {
      await fs.writeFile(
        initialScenePath,
        `# Chapter 1: The Inciting Spark\n\nThe silence before the first word is the heaviest. Write the opening scene that draws your reader into ${data.title}...\n\n`
      );
      await fs.writeFile(
        `novels/${uniqueId}/bible/characters/protagonist.md`,
        `# Character: Protagonist\n\n- **Role**: Lead\n- **Goal**: What drives them forward?\n- **Flaw**: What stands in their own way?`
      );
      await fs.writeFile(
        `novels/${uniqueId}/bible/world/setting.md`,
        `# World: Primary Setting\n\n- **Location**: \n- **Atmosphere**: \n- **Key Rules & Culture**: `
      );
    } else {
      // standard
      await fs.writeFile(
        initialScenePath,
        `# Chapter 1: An Unforeseen Beginning\n\nThe morning broke with an unsettling quiet. Begin your scene here...\n\n`
      );
    }

    const updatedNovels = [...novels, newNovel];
    setNovels(updatedNovels);
    setActiveNovelId(uniqueId);

    await db.saveNovels(updatedNovels);
    await db.setActiveNovelId(uniqueId);

    return { novel: newNovel, initialScenePath };
  }, [novels]);

  const updateNovel = useCallback(async (
    id: string,
    updates: Partial<Omit<Novel, 'id' | 'createdAt'>>
  ) => {
    const updatedNovels = novels.map(n => {
      if (n.id === id) {
        return {
          ...n,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return n;
    });

    setNovels(updatedNovels);
    await db.saveNovels(updatedNovels);
  }, [novels]);

  const deleteNovel = useCallback(async (id: string): Promise<string> => {
    // Delete files associated with this novel
    if (id !== 'default') {
      await fs.deleteDirectory(`novels/${id}`);
    } else {
      await fs.deleteDirectory('scenes');
      await fs.deleteDirectory('bible');
    }

    const remaining = novels.filter(n => n.id !== id);
    let nextActiveId = activeNovelId;

    if (remaining.length === 0) {
      // Recreate default novel if everything deleted
      const freshDefault: Novel = {
        ...DEFAULT_NOVELS[0],
        id: 'default',
        updatedAt: Date.now(),
      };
      remaining.push(freshDefault);
      nextActiveId = 'default';
      await fs.writeFile('scenes/01-prologue.md', `# Prologue\n\nNew story starts here...`);
    } else if (activeNovelId === id) {
      nextActiveId = remaining[0].id;
    }

    setNovels(remaining);
    setActiveNovelId(nextActiveId);
    await db.saveNovels(remaining);
    await db.setActiveNovelId(nextActiveId);

    return nextActiveId;
  }, [novels, activeNovelId]);

  const duplicateNovel = useCallback(async (id: string): Promise<Novel> => {
    const original = novels.find(n => n.id === id);
    if (!original) throw new Error('Original novel not found');

    const uniqueId = `novel-${Date.now().toString(36)}`;
    const now = Date.now();
    const duplicated: Novel = {
      ...original,
      id: uniqueId,
      title: `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    // Copy all files
    const srcPrefix = id === 'default' ? '' : `novels/${id}/`;
    const destPrefix = `novels/${uniqueId}/`;

    const allFiles = fs.getAllFiles();
    for (const [filePath, content] of Object.entries(allFiles)) {
      if (id === 'default') {
        if (filePath.startsWith('scenes/') || filePath.startsWith('bible/')) {
          await fs.writeFile(`${destPrefix}${filePath}`, content);
        }
      } else if (filePath.startsWith(srcPrefix)) {
        const subPath = filePath.slice(srcPrefix.length);
        await fs.writeFile(`${destPrefix}${subPath}`, content);
      }
    }

    const updated = [...novels, duplicated];
    setNovels(updated);
    setActiveNovelId(uniqueId);
    await db.saveNovels(updated);
    await db.setActiveNovelId(uniqueId);

    return duplicated;
  }, [novels]);

  const importNovelCrafter = useCallback(async (
    parsed: NovelCrafterParseResult,
    options: NovelCrafterImportOptions
  ): Promise<{ novel: Novel; firstScenePath: string; summary: NovelCrafterImportSummary }> => {
    const result = await executeNovelCrafterImport(parsed, options, novels, activeNovelId);
    setNovels(result.updatedNovels);
    setActiveNovelId(result.novel.id);
    return {
      novel: result.novel,
      firstScenePath: result.summary.firstScenePath,
      summary: result.summary,
    };
  }, [novels, activeNovelId]);

  return {
    novels,
    activeNovelId,
    activeNovel,
    isLoadingNovels,
    selectNovel,
    createNovel,
    updateNovel,
    deleteNovel,
    duplicateNovel,
    importNovelCrafter,
  };
}
