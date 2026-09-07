import { useState, useEffect, useRef } from 'react';
import { fs, FileItem } from '../storage/fs.ts';
import { sanitizeFilename } from '../engine/markdown/index.ts';

export function useProjectFiles(activeNovelId: string = 'default') {
  const [sceneFiles, setSceneFiles] = useState<FileItem[]>([]);
  const [bibleFiles, setBibleFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('scenes/01-prologue.md');
  const [activeFileName, setActiveFileName] = useState<string>('01-prologue.md');

  const getPaths = (novelId: string) => {
    if (novelId === 'default') {
      return {
        scenesDir: 'scenes',
        bibleCharsDir: 'bible/characters',
        bibleWorldDir: 'bible/world',
      };
    }
    return {
      scenesDir: `novels/${novelId}/scenes`,
      bibleCharsDir: `novels/${novelId}/bible/characters`,
      bibleWorldDir: `novels/${novelId}/bible/world`,
    };
  };

  const refreshFileList = async (targetNovelId: string = activeNovelId) => {
    const { scenesDir, bibleCharsDir, bibleWorldDir } = getPaths(targetNovelId);
    const scenes = await fs.listFiles(scenesDir);
    const bibleChars = await fs.listFiles(bibleCharsDir);
    const bibleWorld = await fs.listFiles(bibleWorldDir);
    setSceneFiles(scenes);
    setBibleFiles([...bibleChars, ...bibleWorld]);
    return { scenes, bible: [...bibleChars, ...bibleWorld] };
  };

  useEffect(() => {
    let isMounted = true;
    async function loadNovelFiles() {
      const { scenes } = await refreshFileList(activeNovelId);
      if (!isMounted) return;
      if (scenes.length > 0) {
        setActiveFilePath(scenes[0].path);
        setActiveFileName(scenes[0].name);
      } else {
        const defaultPath = activeNovelId === 'default'
          ? 'scenes/01-prologue.md'
          : `novels/${activeNovelId}/scenes/01-chapter-1.md`;
        const defaultTitle = activeNovelId === 'default' ? 'Prologue' : 'Chapter 1';
        try {
          await fs.readFile(defaultPath);
        } catch {
          await fs.writeFile(defaultPath, `# ${defaultTitle}\n\nBegin your novel here...`);
        }
        const refreshed = await refreshFileList(activeNovelId);
        if (!isMounted) return;
        if (refreshed.scenes.length > 0) {
          setActiveFilePath(refreshed.scenes[0].path);
          setActiveFileName(refreshed.scenes[0].name);
        } else {
          setActiveFilePath(defaultPath);
          setActiveFileName(defaultPath.split('/').pop() || '');
        }
      }
    }
    loadNovelFiles();
    return () => {
      isMounted = false;
    };
  }, [activeNovelId]);

  const createScene = async (title: string) => {
    const clean = sanitizeFilename(title.toLowerCase());
    const count = sceneFiles.length + 1;
    const { scenesDir } = getPaths(activeNovelId);
    const path = `${scenesDir}/${count.toString().padStart(2, '0')}-${clean}.md`;
    await fs.writeFile(path, `# ${title}\n\nWrite your scene here...`);
    await refreshFileList();
    return path;
  };

  const createBibleEntry = async (name: string, type: 'character' | 'world') => {
    const clean = sanitizeFilename(name.toLowerCase());
    const { bibleCharsDir, bibleWorldDir } = getPaths(activeNovelId);
    const dir = type === 'character' ? bibleCharsDir : bibleWorldDir;
    const path = `${dir}/${clean}.md`;
    await fs.writeFile(path, `# ${name}\n\n- Role:\n- Description:`);
    await refreshFileList();
    return path;
  };

  const deleteFile = async (path: string) => {
    await fs.deleteFile(path);
    await refreshFileList();
  };

  const getTotalWordCount = async (): Promise<number> => {
    let total = 0;
    for (const f of sceneFiles) {
      try {
        const text = await fs.readFile(f.path);
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        total += words;
      } catch {
        // ignore
      }
    }
    return total;
  };

  return {
    sceneFiles,
    bibleFiles,
    activeFilePath,
    setActiveFilePath,
    activeFileName,
    setActiveFileName,
    refreshFileList,
    createScene,
    createBibleEntry,
    deleteFile,
    getTotalWordCount,
  };
}
