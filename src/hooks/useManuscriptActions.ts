import { useState, useCallback } from 'react';
import { fs } from '../storage/fs.ts';
import { compileNovelManuscript, sanitizeFilename } from '../engine/markdown/index.ts';
import { FileItem } from '../storage/fs.ts';

export function useManuscriptActions(
  activeFileName: string,
  editorContent: string,
  sceneFiles: FileItem[],
  bibleFiles: FileItem[]
) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [compiledPreview, setCompiledPreview] = useState('');

  const handleExport = useCallback((format: 'markdown' | 'text') => {
    const ext = format === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(activeFileName.replace(/\.md$/, ''))}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeFileName, editorContent]);

  const handleCompile = useCallback(async () => {
    const scenes = [];
    let ord = 1;
    for (const f of sceneFiles) {
      scenes.push({ id: f.path, title: f.name.replace(/\.md$/, ''), filename: f.name, content: await fs.readFile(f.path), order: ord++ });
    }
    const bibles = [];
    for (const f of bibleFiles) {
      bibles.push({ id: f.path, name: f.name.replace(/\.md$/, ''), filename: f.name, content: await fs.readFile(f.path), type: 'note' as any });
    }
    setCompiledPreview(compileNovelManuscript(scenes, bibles, true));
    setIsExportOpen(true);
  }, [sceneFiles, bibleFiles]);

  return { isExportOpen, setIsExportOpen, compiledPreview, handleExport, handleCompile };
}
