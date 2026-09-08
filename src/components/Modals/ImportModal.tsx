import React, { useState } from 'react';
import { X, FileUp, FileArchive, FileText, Loader2 } from 'lucide-react';
import { parseImportedDocument } from '../../engine/markdown/index.ts';
import { Novel } from '../../types/index.ts';
import { NovelCrafterParseResult } from '../../engine/novelcrafter/index.ts';
import { NovelCrafterImportOptions, NovelCrafterImportSummary } from '../../engine/novelcrafter/importer.ts';
import { NovelCrafterImportView } from './NovelCrafterImportView.tsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (title: string, content: string, type: 'scene' | 'character' | 'world') => void | Promise<void>;
  currentNovels: Novel[];
  activeNovel: Novel;
  onExecuteImportNovelCrafter: (
    parsed: NovelCrafterParseResult,
    options: NovelCrafterImportOptions
  ) => Promise<{ novel: Novel; firstScenePath: string; summary: NovelCrafterImportSummary }>;
  onOpenScene: (scenePath: string) => Promise<void>;
  initialTab?: 'novelcrafter' | 'single';
  isImporting?: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentNovels,
  activeNovel,
  onExecuteImportNovelCrafter,
  onOpenScene,
  initialTab = 'novelcrafter',
  isImporting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'novelcrafter' | 'single'>(initialTab);
  const [docType, setDocType] = useState<'scene' | 'character' | 'world'>('scene');
  const [filename, setFilename] = useState('');
  const [rawText, setRawText] = useState('');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      setActiveTab('novelcrafter');
      return;
    }

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content || '');
    };
    reader.readAsText(file);
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || isSubmittingSingle || isImporting) return;

    setIsSubmittingSingle(true);
    try {
      const parsed = parseImportedDocument(rawText, filename || 'Imported Document');
      await onImport(parsed.title, parsed.body, docType);
      setRawText('');
      setFilename('');
      onClose();
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 text-xs space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-100 text-sm">Import into StorySpark</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition p-1 rounded hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('novelcrafter')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'novelcrafter'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>NovelCrafter ZIP Export</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'single'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-stone-300" />
            <span>Single Markdown / Text File</span>
          </button>
        </div>

        {/* Tab 1: NovelCrafter ZIP Import */}
        {activeTab === 'novelcrafter' && (
          <NovelCrafterImportView
            currentNovels={currentNovels}
            activeNovel={activeNovel}
            onExecuteImport={onExecuteImportNovelCrafter}
            onSuccess={async (scenePath) => {
              await onOpenScene(scenePath);
              onClose();
            }}
            onCancel={onClose}
          />
        )}

        {/* Tab 2: Single Document Import */}
        {activeTab === 'single' && (
          <form onSubmit={handleSubmitSingle} className="space-y-3.5">
            <div>
              <label className="text-stone-300 font-medium block mb-1">Import As</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="scene">Scene (Manuscript)</option>
                <option value="character">Character (Story Bible)</option>
                <option value="world">World / Lore Note (Story Bible)</option>
              </select>
            </div>

            <div>
              <label className="text-stone-300 font-medium block mb-1">Choose .md or .txt file</label>
              <input
                type="file"
                accept=".md,.markdown,.txt,.zip"
                onChange={handleFileUpload}
                className="w-full text-stone-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700"
              />
            </div>

            <div>
              <label className="text-stone-300 font-medium block mb-1">Or Paste Content Directly</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste Markdown or text here..."
                rows={7}
                className="w-full bg-stone-950 border border-stone-800 rounded p-2.5 text-stone-200 font-mono text-[11px] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmittingSingle || isImporting}
                className="px-3 py-1.5 rounded text-xs text-stone-400 hover:text-stone-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="import-single-submit-btn"
                disabled={!rawText.trim() || isSubmittingSingle || isImporting}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white font-medium rounded transition flex items-center gap-1.5"
              >
                {isSubmittingSingle || isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Import Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
