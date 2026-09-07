import React, { useState, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import {
  processCoverImageFile,
  isValidImageFile,
  formatFileSize,
  estimateDataUrlSize,
} from '../../utils/imageUtils.ts';

interface CoverImageInputProps {
  value?: string;
  onChange: (coverDataUrl: string | undefined) => void;
  label?: string;
  novelTitle?: string;
}

export const CoverImageInput: React.FC<CoverImageInputProps> = ({
  value,
  onChange,
  label = 'Cover Picture',
  novelTitle = 'Untitled Novel',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!isValidImageFile(file)) {
      setError('Please choose a valid image file (JPG, PNG, WEBP, or GIF).');
      return;
    }
    setIsProcessing(true);
    try {
      const optimized = await processCoverImageFile(file, 800, 1200, 0.86);
      onChange(optimized);
    } catch (err: any) {
      setError(err?.message || 'Failed to process cover image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-stone-300 font-medium text-xs">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Remove Cover
          </button>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Cover Preview Card */}
        <div
          onClick={() => inputRef.current?.click()}
          title="Click to choose or change cover"
          className="relative w-20 aspect-[2/3] rounded bg-stone-950 border border-stone-800 hover:border-amber-500/70 transition-all flex-shrink-0 cursor-pointer overflow-hidden shadow-md group"
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Cover Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-400">
                <Upload className="w-4 h-4" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-stone-600 group-hover:text-amber-400/90 transition-colors bg-gradient-to-br from-stone-900 to-stone-950">
              <BookOpen className="w-5 h-5 mb-1 opacity-70" />
              <span className="text-[8px] font-mono leading-tight">No Cover</span>
            </div>
          )}
        </div>

        {/* Dropzone & Browse button */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex-1 border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[75px] ${
            isDragging
              ? 'border-amber-500 bg-amber-950/20'
              : 'border-stone-800 bg-stone-950/40 hover:border-stone-700 hover:bg-stone-900/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                await handleFile(e.target.files[0]);
              }
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex items-center gap-2 text-amber-400 text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Processing image...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-stone-300 font-medium text-[11px]">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Drag & drop image or browse</span>
              </div>
              <p className="text-[10px] text-stone-500">
                JPG, PNG, WEBP up to 10MB · Aspect ratio ~2:3 recommended
              </p>
              {value && (
                <div className="text-[9px] text-emerald-400/90 font-mono mt-1">
                  Cover saved (~{formatFileSize(estimateDataUrlSize(value))})
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-[10px] text-rose-400 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};
