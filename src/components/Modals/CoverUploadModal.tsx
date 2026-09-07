import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  BookOpen,
  Sparkles,
  AlertCircle,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { Novel, CoverTheme } from '../../types/index.ts';
import {
  processCoverImageFile,
  isValidImageFile,
  formatFileSize,
  estimateDataUrlSize,
} from '../../utils/imageUtils.ts';
import { extractCoverTheme } from '../../engine/theme/coverTheme.ts';

interface CoverUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel | null;
  onSaveCover: (novelId: string, coverDataUrl: string | undefined, theme?: CoverTheme) => Promise<void>;
}

export const CoverUploadModal: React.FC<CoverUploadModalProps> = ({
  isOpen,
  onClose,
  novel,
  onSaveCover,
}) => {
  const [stagedCover, setStagedCover] = useState<string | undefined>(undefined);
  const [stagedTheme, setStagedTheme] = useState<CoverTheme | null>(null);
  const [isExtractingTheme, setIsExtractingTheme] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    originalSize: number;
    optimizedSize: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync stagedCover when novel changes or modal opens
  useEffect(() => {
    if (novel && isOpen) {
      setStagedCover(novel.coverImage);
      setStagedTheme(novel.coverTheme || null);
      setErrorMessage(null);
      setFileDetails(null);
      setIsDragging(false);

      if (novel.coverImage && !novel.coverTheme) {
        setIsExtractingTheme(true);
        extractCoverTheme(novel.coverImage).then((thm) => {
          setStagedTheme(thm);
          setIsExtractingTheme(false);
        });
      }
    }
  }, [novel, isOpen]);

  // Extract theme whenever a new cover is staged
  useEffect(() => {
    if (stagedCover) {
      setIsExtractingTheme(true);
      extractCoverTheme(stagedCover)
        .then((thm) => {
          setStagedTheme(thm);
        })
        .finally(() => {
          setIsExtractingTheme(false);
        });
    } else {
      setStagedTheme(null);
    }
  }, [stagedCover]);

  // Support paste (Ctrl+V / Cmd+V) of image data
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  if (!isOpen || !novel) return null;

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    if (!isValidImageFile(file)) {
      setErrorMessage('Unsupported file format. Please upload a JPG, PNG, WEBP, or GIF image.');
      return;
    }

    setIsProcessing(true);
    try {
      const originalSize = file.size;
      const optimizedDataUrl = await processCoverImageFile(file, 900, 1350, 0.88);
      const optimizedSize = estimateDataUrlSize(optimizedDataUrl);

      setStagedCover(optimizedDataUrl);
      setFileDetails({
        name: file.name,
        originalSize,
        optimizedSize,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process cover picture.');
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
    // reset input so the same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setStagedCover(undefined);
    setFileDetails(null);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!novel) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSaveCover(novel.id, stagedCover, stagedTheme || undefined);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save cover picture.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = stagedCover !== novel.coverImage;

  return (
    <div
      id="cover-upload-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="cover-upload-modal-container"
        className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden text-xs"
      >
        {/* Header */}
        <div className="h-14 border-b border-stone-800 px-5 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-stone-100 text-sm">Cover Picture</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
                  {novel.title}
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Upload book jacket artwork for your manuscript & novel library
              </p>
            </div>
          </div>

          <button
            id="cover-upload-close-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 overflow-y-auto max-h-[75vh]">
          {/* Left Column: Book Preview Mockup */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider mb-2 self-start flex items-center gap-1.5">
              <span>Cover Preview</span>
              {stagedCover && (
                <span className="text-[9px] text-emerald-400 font-mono lowercase">
                  ({stagedCover === novel.coverImage ? 'current' : 'staged'})
                </span>
              )}
            </div>

            {/* Realistic Book Cover Frame (Aspect Ratio ~2:3) */}
            <div className="relative w-44 aspect-[2/3] rounded-r-md rounded-l-sm bg-gradient-to-r from-stone-950 via-stone-900 to-stone-900 border border-stone-700 shadow-2xl overflow-hidden flex flex-col group">
              {/* Subtle Book Spine Highlight */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 via-white/10 to-transparent z-10 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-3 w-px bg-white/10 z-10 pointer-events-none" />

              {stagedCover ? (
                <>
                  <img
                    src={stagedCover}
                    alt={`${novel.title} Cover`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle top edge gloss */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
                </>
              ) : (
                /* Dynamic Typographic Cover Placeholder */
                <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-stone-800/80 text-center select-none">
                  <div className="pt-2">
                    <span className="text-[9px] uppercase tracking-widest text-amber-500/90 font-mono font-medium block mb-1">
                      {novel.genre || 'Novel'}
                    </span>
                    <div className="w-8 h-px bg-amber-500/40 mx-auto" />
                  </div>

                  <div className="my-auto px-1">
                    <h3 className="font-serif font-bold text-stone-100 text-sm leading-tight tracking-wide line-clamp-3">
                      {novel.title}
                    </h3>
                  </div>

                  <div className="pb-1">
                    <div className="w-6 h-px bg-stone-700 mx-auto mb-1.5" />
                    <span className="text-[9px] text-stone-400 font-serif italic block">
                      Author Manuscript
                    </span>
                  </div>
                </div>
              )}

              {/* Hover Quick Action Badge */}
              {stagedCover && (
                <div className="absolute bottom-2 right-2 z-20">
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    title="Remove Cover"
                    className="p-1.5 bg-rose-950/90 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded shadow-md transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* File info pill */}
            {stagedCover && (
              <div className="mt-3 text-center w-full">
                {fileDetails ? (
                  <div className="text-[10px] text-stone-400 space-y-0.5">
                    <div className="text-stone-300 font-medium truncate max-w-[180px] mx-auto">
                      {fileDetails.name}
                    </div>
                    <div className="text-[9px] text-emerald-400 font-mono">
                      Optimized: {formatFileSize(fileDetails.optimizedSize)}
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-stone-500 font-mono">
                    ~{formatFileSize(estimateDataUrlSize(stagedCover))} cover art loaded
                  </div>
                )}

                {/* Extracted Theme Palette Card */}
                {stagedTheme && (
                  <div
                    id="cover-extracted-theme-card"
                    className="mt-3.5 w-full p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-2 text-left shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-300 font-medium text-[10px]">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Prominent Colors</span>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-mono">
                        Theme Ready
                      </span>
                    </div>

                    {/* Swatches bar */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {stagedTheme.prominentColors.slice(0, 5).map((col, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-5 rounded border border-white/10 shadow-xs relative cursor-default"
                          style={{ backgroundColor: col }}
                          title={`Extracted Color: ${col}`}
                        />
                      ))}
                    </div>

                    {/* Key tokens */}
                    <div className="grid grid-cols-2 gap-1 text-[9px] pt-1 border-t border-stone-800/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
                          style={{ backgroundColor: stagedTheme.primaryHex }}
                        />
                        <span className="text-stone-400">Primary:</span>
                        <span className="font-mono text-stone-200">{stagedTheme.primaryHex}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
                          style={{ backgroundColor: stagedTheme.secondaryHex }}
                        />
                        <span className="text-stone-400">Accent:</span>
                        <span className="font-mono text-stone-200">{stagedTheme.secondaryHex}</span>
                      </div>
                    </div>

                    <p className="text-[9px] text-stone-500 leading-tight">
                      Studio theme will dynamically update to match this picture when active.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Dropzone & File Upload Selection */}
          <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider flex items-center justify-between">
                <span>Upload Cover Picture</span>
                <span className="text-stone-500 text-[9px] font-normal">Supports Drag & Drop</span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                id="cover-dropzone"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                  isDragging
                    ? 'border-amber-500 bg-amber-950/25 scale-[0.99] shadow-inner'
                    : 'border-stone-700/80 bg-stone-950/50 hover:border-amber-600/70 hover:bg-stone-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="novel-cover-file-input"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onFileInputChange}
                  className="hidden"
                />

                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-2 py-4 text-amber-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
                    <span className="text-stone-300 font-medium text-xs">
                      Optimizing cover image...
                    </span>
                    <span className="text-[10px] text-stone-500">Resizing for high-DPI display</span>
                  </div>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-stone-200 font-medium text-xs mb-1">
                      Drag and drop cover image here
                    </div>
                    <p className="text-stone-400 text-[11px] mb-3">
                      or <span className="text-amber-400 underline font-medium">browse local files</span>
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-900/80 px-2.5 py-1 rounded-full border border-stone-800">
                      <FileImage className="w-3 h-3 text-stone-400" />
                      <span>PNG, JPG, WEBP, or GIF up to 10MB</span>
                    </div>
                  </>
                )}
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-[11px]">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Cover Art Guidance */}
              <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg space-y-1.5 text-[11px] text-stone-400">
                <div className="text-stone-300 font-medium flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tips for best results:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-stone-400 text-[10px] pl-1">
                  <li>
                    Portrait aspect ratio around <strong className="text-stone-300">2:3</strong> or{' '}
                    <strong className="text-stone-300">1:1.5</strong> (e.g. 800×1200 or 1200×1800 px).
                  </li>
                  <li>Images are automatically optimized and compressed for rapid local persistence.</li>
                  <li>You can also paste an image directly using <kbd className="px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200 font-mono">Ctrl+V</kbd> or <kbd className="px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200 font-mono">Cmd+V</kbd>.</li>
                </ul>
              </div>
            </div>

            {/* Quick Actions if staged */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
              {stagedCover ? (
                <button
                  type="button"
                  id="cover-remove-btn"
                  onClick={handleRemoveCover}
                  className="px-3 py-1.5 bg-stone-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-stone-300 rounded font-medium flex items-center gap-1.5 transition-colors border border-stone-700 hover:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Picture</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="cover-cancel-btn"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="cover-save-btn"
                  onClick={handleSave}
                  disabled={isSaving || isProcessing || !hasChanges}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white rounded font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Apply Cover'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
