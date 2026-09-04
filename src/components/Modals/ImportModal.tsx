import React, { useState } from 'react';
import { X, FileUp } from 'lucide-react';
import { parseImportedDocument } from '../../engine/markdown/index.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (title: string, content: string, type: 'scene' | 'character' | 'world') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [docType, setDocType] = useState<'scene' | 'character' | 'world'>('scene');
  const [filename, setFilename] = useState('');
  const [rawText, setRawText] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const parsed = parseImportedDocument(rawText, filename || 'Imported Document');
    onImport(parsed.title, parsed.body, docType);
    setRawText('');
    setFilename('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg w-full max-w-md p-4 text-xs space-y-3">
        <div className="flex justify-between items-center border-b border-stone-800 pb-2">
          <span className="font-medium text-stone-200">Import Markdown or Text</span>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-stone-400">Import As</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 mt-1"
            >
              <option value="scene">Scene</option>
              <option value="character">Character</option>
              <option value="world">World / Lore Note</option>
            </select>
          </div>

          <div>
            <label className="text-stone-400">Choose .md or .txt file</label>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleFileUpload}
              className="w-full text-stone-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700 mt-1"
            />
          </div>

          <div>
            <label className="text-stone-400">Or Paste Content Directly</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste Markdown / Text here..."
              rows={6}
              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-stone-200 mt-1 font-mono text-[11px]"
            />
          </div>

          <button
            type="submit"
            disabled={!rawText.trim()}
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-white font-medium rounded transition"
          >
            Import Document
          </button>
        </form>
      </div>
    </div>
  );
};
