import React, { useState } from 'react';
import { X, BookCheck, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  compiledMarkdown: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  compiledMarkdown,
}) => {
  if (!isOpen) return null;

  const downloadFile = (format: 'markdown' | 'text') => {
    const filename = `StorySpark-Novel-Manuscript.${format === 'markdown' ? 'md' : 'txt'}`;
    const blob = new Blob([compiledMarkdown], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-xs">
        <div className="h-11 border-b border-stone-800 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium text-stone-200">
            <BookCheck className="w-4 h-4 text-amber-500" />
            <span>Compiled Novel Manuscript Preview</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <pre className="bg-stone-950 p-3 rounded border border-stone-800 text-stone-300 font-mono text-[11px] whitespace-pre-wrap select-text max-h-96 overflow-y-auto">
            {compiledMarkdown}
          </pre>
        </div>

        <div className="p-3 border-t border-stone-800 flex justify-end gap-2 bg-stone-950/40">
          <button
            onClick={() => downloadFile('markdown')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Save .md Manuscript
          </button>
          <button
            onClick={() => downloadFile('text')}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Save .txt Manuscript
          </button>
        </div>
      </div>
    </div>
  );
};
