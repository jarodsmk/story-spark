import React from 'react';
import { fs } from '../../storage/fs.ts';
import { ImportModal } from './ImportModal.tsx';
import { ExportModal } from './ExportModal.tsx';

interface ModalsProps {
  isImportOpen: boolean;
  setIsImportOpen: (v: boolean) => void;
  isExportOpen: boolean;
  setIsExportOpen: (v: boolean) => void;
  compiledPreview: string;
  createScene: (title: string) => Promise<string>;
  createBibleEntry: (name: string, type: 'character' | 'world') => Promise<string>;
  loadFile: (path: string) => Promise<void>;
}

export const ModalsContainer: React.FC<ModalsProps> = ({
  isImportOpen,
  setIsImportOpen,
  isExportOpen,
  setIsExportOpen,
  compiledPreview,
  createScene,
  createBibleEntry,
  loadFile,
}) => {
  return (
    <>
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
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
      />
    </>
  );
};

