import React from 'react';
import { fs, FileItem } from '../../storage/fs.ts';
import { ImportModal } from './ImportModal.tsx';
import { ExportModal } from './ExportModal.tsx';
import { NovelModal } from './NovelModal.tsx';
import { CoverUploadModal } from './CoverUploadModal.tsx';
import { Novel, CoverTheme } from '../../types/index.ts';
import { NovelCrafterParseResult } from '../../engine/novelcrafter/index.ts';
import { NovelCrafterImportOptions, NovelCrafterImportSummary } from '../../engine/novelcrafter/importer.ts';

interface ModalsProps {
  isImportOpen: boolean;
  setIsImportOpen: (v: boolean) => void;
  isExportOpen: boolean;
  setIsExportOpen: (v: boolean) => void;
  isNovelOpen: boolean;
  setIsNovelOpen: (v: boolean) => void;
  initialNovelModalTab?: 'list' | 'create' | 'edit' | 'import' | 'prompts';
  initialNovelModalNovelId?: string;
  isCoverUploadOpen?: boolean;
  setIsCoverUploadOpen?: (v: boolean) => void;
  coverUploadNovel?: Novel | null;
  onOpenCoverUpload?: (novel: Novel) => void;
  onSaveCover?: (novelId: string, coverDataUrl: string | undefined, theme?: CoverTheme) => Promise<void>;
  compiledPreview: string;
  createScene: (title: string) => Promise<string>;
  createBibleEntry: (name: string, type: 'character' | 'world') => Promise<string>;
  loadFile: (path: string) => Promise<void>;
  refreshFileList: (novelId?: string) => Promise<any>;
  novels: Novel[];
  activeNovelId: string;
  activeNovel: Novel;
  onSelectNovel: (id: string) => Promise<void>;
  onCreateNovel: (data: {
    title: string;
    genre?: string;
    description?: string;
    targetWordCount?: number;
    template?: 'standard' | 'blank' | 'rich';
    coverImage?: string;
    coverTheme?: CoverTheme;
  }) => Promise<{ novel: Novel; initialScenePath: string }>;
  onUpdateNovel: (id: string, updates: Partial<Omit<Novel, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteNovel: (id: string) => Promise<string>;
  onDuplicateNovel: (id: string) => Promise<Novel>;
  onImportNovelCrafter: (
    parsed: NovelCrafterParseResult,
    options: NovelCrafterImportOptions
  ) => Promise<{ novel: Novel; firstScenePath: string; summary: NovelCrafterImportSummary }>;
  novelTitle?: string;
  activeWordCount?: number;
  sceneFiles?: FileItem[];
  bibleFiles?: FileItem[];
  activeFilePath?: string;
  currentEditorContent?: string;
}

export const ModalsContainer: React.FC<ModalsProps> = ({
  isImportOpen,
  setIsImportOpen,
  isExportOpen,
  setIsExportOpen,
  isNovelOpen,
  setIsNovelOpen,
  initialNovelModalTab,
  initialNovelModalNovelId,
  isCoverUploadOpen = false,
  setIsCoverUploadOpen,
  coverUploadNovel = null,
  onOpenCoverUpload,
  onSaveCover,
  compiledPreview,
  createScene,
  createBibleEntry,
  loadFile,
  refreshFileList,
  novels,
  activeNovelId,
  activeNovel,
  onSelectNovel,
  onCreateNovel,
  onUpdateNovel,
  onDeleteNovel,
  onDuplicateNovel,
  onImportNovelCrafter,
  novelTitle = 'Novel',
  activeWordCount = 0,
  sceneFiles = [],
  bibleFiles = [],
  activeFilePath,
  currentEditorContent,
}) => {
  const handleNovelCrafterImport = async (
    parsed: NovelCrafterParseResult,
    options: NovelCrafterImportOptions
  ) => {
    const res = await onImportNovelCrafter(parsed, options);
    await refreshFileList(res.novel.id);
    return res;
  };

  const handleOpenSceneAfterImport = async (scenePath: string) => {
    await loadFile(scenePath);
  };

  return (
    <>
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        currentNovels={novels}
        activeNovel={activeNovel}
        onExecuteImportNovelCrafter={handleNovelCrafterImport}
        onOpenScene={handleOpenSceneAfterImport}
        onImport={async (title: string, content: string, type: 'scene' | 'character' | 'world') => {
          const path = type === 'scene' ? await createScene(title) : await createBibleEntry(title, type);
          await fs.writeFile(path, `# ${title}\n\n${content}`);
          await loadFile(path);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        compiledMarkdown={compiledPreview}
        novelTitle={novelTitle}
        genre={activeNovel?.genre}
        sceneFiles={sceneFiles}
        bibleFiles={bibleFiles}
        activeFilePath={activeFilePath}
        currentEditorContent={currentEditorContent}
      />

      <NovelModal
        isOpen={isNovelOpen}
        onClose={() => setIsNovelOpen(false)}
        novels={novels}
        activeNovelId={activeNovelId}
        initialTab={initialNovelModalTab}
        initialNovelId={initialNovelModalNovelId}
        onSelectNovel={async (id) => {
          await onSelectNovel(id);
        }}
        onCreateNovel={async (data) => {
          const res = await onCreateNovel(data);
          await loadFile(res.initialScenePath);
          return res;
        }}
        onUpdateNovel={onUpdateNovel}
        onDeleteNovel={onDeleteNovel}
        onDuplicateNovel={onDuplicateNovel}
        onExecuteImportNovelCrafter={handleNovelCrafterImport}
        onOpenScene={handleOpenSceneAfterImport}
        activeWordCount={activeWordCount}
        onOpenCoverUpload={onOpenCoverUpload}
      />

      <CoverUploadModal
        isOpen={isCoverUploadOpen}
        onClose={() => setIsCoverUploadOpen?.(false)}
        novel={coverUploadNovel || activeNovel || null}
        onSaveCover={async (novelId, coverDataUrl, theme) => {
          if (onSaveCover) {
            await onSaveCover(novelId, coverDataUrl, theme);
          } else {
            await onUpdateNovel(novelId, { coverImage: coverDataUrl, coverTheme: theme });
          }
        }}
      />
    </>
  );
};
