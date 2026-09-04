import { useState, useEffect, useRef } from 'react';
import { fs, FileItem } from '../storage/fs.ts';
import { sanitizeFilename } from '../engine/markdown/index.ts';

export function useProjectFiles() {
  const [sceneFiles, setSceneFiles] = useState<FileItem[]>([]);
  const [bibleFiles, setBibleFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('scenes/01-prologue.md');
  const [activeFileName, setActiveFileName] = useState<string>('01-prologue.md');

  const refreshFileList = async () => {
    const scenes = await fs.listFiles('scenes');
    const bibleChars = await fs.listFiles('bible/characters');
    const bibleWorld = await fs.listFiles('bible/world');
    setSceneFiles(scenes);
    setBibleFiles([...bibleChars, ...bibleWorld]);
  };

  const createScene = async (title: string) => {
    const clean = sanitizeFilename(title.toLowerCase());
    const count = sceneFiles.length + 1;
    const path = `scenes/${count.toString().padStart(2, '0')}-${clean}.md`;
    await fs.writeFile(path, `# ${title}\n\nWrite your scene here...`);
    await refreshFileList();
    return path;
  };

  const createBibleEntry = async (name: string, type: 'character' | 'world') => {
    const clean = sanitizeFilename(name.toLowerCase());
    const path = `bible/${type === 'character' ? 'characters' : 'world'}/${clean}.md`;
    await fs.writeFile(path, `# ${name}\n\n- Role:\n- Description:`);
    await refreshFileList();
    return path;
  };

  const deleteFile = async (path: string) => {
    await fs.deleteFile(path);
    await refreshFileList();
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
  };
}
