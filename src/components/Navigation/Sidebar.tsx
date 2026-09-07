import React, { useState, useRef, useEffect } from 'react';
import {
  BookText,
  Users,
  Globe,
  FilePlus,
  Settings,
  FolderDown,
  Trash2,
  ChevronDown,
  Library,
  Plus,
  Check,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Camera,
  PanelLeftClose,
  PanelLeftOpen,
  Lightbulb,
} from 'lucide-react';
import { FileItem } from '../../storage/fs.ts';
import { Novel, SceneSummary } from '../../types/index.ts';

interface SidebarProps {
  sceneFiles: FileItem[];
  bibleFiles: FileItem[];
  scratchpadFiles?: FileItem[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onNewScene: () => void;
  onNewBibleEntry: (type: 'character' | 'world') => void;
  onNewScratchpadIdea?: () => void;
  onDeleteFile: (path: string) => void;
  onOpenSettings: () => void;
  onImportFile: () => void;
  onExportCompiled: () => void;
  novels?: Novel[];
  activeNovel?: Novel;
  onSelectNovel?: (id: string) => void;
  onOpenNovelManager?: () => void;
  onUploadCover?: (novel: Novel) => void;
  onOpenNovelPrompts?: (novel: Novel) => void;
  summaries?: Record<string, SceneSummary>;
  onOpenSceneSummaries?: (scenePath?: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sceneFiles,
  bibleFiles,
  scratchpadFiles = [],
  activeFilePath,
  onSelectFile,
  onNewScene,
  onNewBibleEntry,
  onNewScratchpadIdea,
  onDeleteFile,
  onOpenSettings,
  onImportFile,
  onExportCompiled,
  novels = [],
  activeNovel,
  onSelectNovel,
  onOpenNovelManager,
  onUploadCover,
  onOpenNovelPrompts,
  summaries = {},
  onOpenSceneSummaries,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const characters = bibleFiles.filter(f => f.path.includes('characters'));
  const world = bibleFiles.filter(f => f.path.includes('world'));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (isCollapsed) {
    return (
      <aside
        aria-label="Left Menu (Collapsed)"
        className="w-12 bg-stone-950 border-r border-stone-800 flex flex-col h-full flex-shrink-0 text-xs select-none items-center py-2.5 justify-between transition-all duration-150"
      >
        <div className="flex flex-col items-center space-y-2 w-full px-1">
          {/* Expand toggle */}
          <button
            type="button"
            id="sidebar-expand-toggle-btn"
            onClick={onToggleCollapse}
            title="Expand Left Menu (Ctrl+B)"
            className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-stone-800 my-1" />

          {/* Active Novel Cover / Thumbnail */}
          {activeNovel && (
            <button
              type="button"
              id="sidebar-collapsed-novel-btn"
              onClick={onOpenNovelManager}
              title={`Active Novel: ${activeNovel.title} (${novels.length} total) - Click to manage`}
              className="w-8 h-11 rounded bg-stone-950 border border-stone-800 hover:border-amber-500 overflow-hidden shadow-sm transition-all group flex items-center justify-center relative my-1 cursor-pointer"
            >
              {activeNovel.coverImage ? (
                <img
                  src={activeNovel.coverImage}
                  alt={activeNovel.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-stone-600 group-hover:text-amber-400 transition-colors">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          )}

          {/* Quick Scene Action: New Scene */}
          <button
            type="button"
            id="sidebar-collapsed-new-scene-btn"
            onClick={onNewScene}
            title="New Scene"
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-900 rounded transition-colors"
          >
            <FilePlus className="w-4 h-4" />
          </button>

          {/* Quick Scratchpad Action */}
          <button
            type="button"
            id="sidebar-collapsed-scratchpad-btn"
            onClick={scratchpadFiles.length > 0 ? () => onSelectFile(scratchpadFiles[0].path) : onNewScratchpadIdea}
            title={`Scratchpad Ideas (${scratchpadFiles.length}) - Click to view or jot idea`}
            className="p-2 text-purple-400 hover:text-purple-300 hover:bg-stone-900 rounded transition-colors relative"
          >
            <Lightbulb className="w-4 h-4" />
            {scratchpadFiles.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-600 text-stone-100 rounded-full text-[9px] font-bold flex items-center justify-center">
                {scratchpadFiles.length}
              </span>
            )}
          </button>

          {/* Scene Summaries Button */}
          {onOpenSceneSummaries && (
            <button
              type="button"
              id="sidebar-collapsed-summaries-btn"
              onClick={() => onOpenSceneSummaries()}
              title="Scene Summaries & Context"
              className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Novel Library */}
          {onOpenNovelManager && (
            <button
              type="button"
              id="sidebar-collapsed-library-btn"
              onClick={onOpenNovelManager}
              title="Novel Library & Manager"
              className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded transition-colors"
            >
              <Library className="w-4 h-4" />
            </button>
          )}

          <div className="w-6 h-px bg-stone-800 my-1" />

          {/* Rotated label to click and expand */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="group py-4 px-1 flex items-center justify-center cursor-pointer transition hover:bg-stone-900/60 rounded my-2"
            title="Click to expand Left Menu"
          >
            <span
              className="text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap text-stone-500 group-hover:text-amber-400 transition"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {activeNovel ? activeNovel.title : 'MANUSCRIPT & LORE'}
            </span>
          </button>
        </div>

        {/* Bottom Utility Icons */}
        <div className="flex flex-col items-center space-y-1.5 w-full px-1 pt-2 border-t border-stone-800">
          <button
            type="button"
            id="sidebar-collapsed-import-btn"
            onClick={onImportFile}
            title="Import File"
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded transition-colors"
          >
            <FolderDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="sidebar-collapsed-compile-btn"
            onClick={onExportCompiled}
            title="Compile Novel"
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded transition-colors"
          >
            <BookText className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="sidebar-collapsed-settings-btn"
            onClick={onOpenSettings}
            title="Settings & Rules"
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <div className="w-60 bg-stone-950 border-r border-stone-800 flex flex-col h-full flex-shrink-0 text-xs select-none">
      {/* Brand Header */}
      <div className="h-12 border-b border-stone-800 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-amber-500 font-bold text-lg">⚡</span>
          <div>
            <div className="font-semibold text-stone-200">StorySpark</div>
            <div className="text-[10px] text-stone-500">Multi-Novel Studio</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onOpenNovelManager && (
            <button
              onClick={onOpenNovelManager}
              title="Open Novel Library & Manager"
              className="p-1 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded transition-colors"
            >
              <Library className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleCollapse && (
            <button
              id="sidebar-collapse-toggle-btn"
              onClick={onToggleCollapse}
              title="Collapse Left Menu (Ctrl+B)"
              className="p-1 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded transition-colors"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Novel Selector Banner */}
      {activeNovel && (
        <div className="p-2 border-b border-stone-800/80 relative" ref={dropdownRef}>
          <div className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold px-1 mb-1.5 flex items-center justify-between">
            <span>Active Novel</span>
            <div className="flex items-center gap-1.5">
              {onOpenNovelPrompts && (
                <button
                  type="button"
                  id="sidebar-quick-prompts-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNovelPrompts(activeNovel);
                  }}
                  title="Customize System AI Prompts for this novel"
                  className="text-[9px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 hover:underline"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>AI Prompts</span>
                </button>
              )}
              {onUploadCover && (
                <>
                  <span className="font-mono text-[9px] text-stone-600">·</span>
                  <button
                    type="button"
                    id="sidebar-upload-cover-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUploadCover(activeNovel);
                    }}
                    title={activeNovel.coverImage ? 'Change Cover Art' : 'Upload Cover Art'}
                    className="text-[9px] text-stone-400 hover:text-stone-300 font-medium flex items-center gap-0.5 hover:underline"
                  >
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>{activeNovel.coverImage ? 'Cover' : '+ Cover'}</span>
                  </button>
                </>
              )}
              <span className="font-mono text-[9px] text-stone-600">·</span>
              <span className="font-mono text-[9px] text-amber-500/80">{novels.length} total</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Book Cover Thumbnail with Quick Upload Overlay */}
            <button
              type="button"
              id="sidebar-novel-cover-thumbnail"
              onClick={() => onUploadCover?.(activeNovel)}
              title={activeNovel.coverImage ? 'Click to change cover picture' : 'Click to upload cover picture'}
              className="relative group flex-shrink-0 w-8 h-11 rounded bg-stone-950 border border-stone-700/80 overflow-hidden shadow-sm hover:border-amber-500 transition-all cursor-pointer text-left"
            >
              {activeNovel.coverImage ? (
                <>
                  <img
                    src={activeNovel.coverImage}
                    alt={`${activeNovel.title} cover`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-400">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-stone-600 group-hover:text-amber-400 transition-colors p-0.5">
                  <BookOpen className="w-3.5 h-3.5 mb-0.5" />
                  <span className="text-[7px] font-mono leading-none tracking-tight opacity-75">+Art</span>
                </div>
              )}
            </button>

            {/* Novel Switcher Dropdown Trigger */}
            <button
              id="sidebar-novel-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex-1 min-w-0 text-left bg-stone-900 hover:bg-stone-800/90 border border-stone-800 hover:border-stone-700 p-1.5 rounded transition-colors flex items-center justify-between gap-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-stone-100 truncate text-[11px] leading-tight">
                  {activeNovel.title}
                </div>
                {activeNovel.genre && (
                  <div className="text-[9px] text-amber-400/80 truncate mt-0.5 font-medium">
                    {activeNovel.genre}
                  </div>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 flex-shrink-0 transition-transform ${
                  isDropdownOpen ? 'rotate-180 text-amber-500' : ''
                }`}
              />
            </button>
          </div>

          {/* Novel Switcher Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-2 right-2 mt-1 z-40 bg-stone-900 border border-stone-700 rounded shadow-xl py-1 divide-y divide-stone-800 text-xs">
              <div className="max-h-48 overflow-y-auto py-0.5">
                {novels.map((n) => {
                  const isSelected = n.id === activeNovel.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        onSelectNovel?.(n.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-amber-950/40 text-amber-300 font-medium'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-5 h-7 rounded-sm bg-stone-950 border border-stone-800 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                          {n.coverImage ? (
                            <img
                              src={n.coverImage}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BookOpen className="w-2.5 h-2.5 text-stone-600" />
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <div className="truncate text-[11px] leading-tight">{n.title}</div>
                          {n.genre && <div className="text-[9px] text-stone-500 truncate">{n.genre}</div>}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-1 space-y-0.5 bg-stone-950/50">
                {onOpenNovelPrompts && (
                  <button
                    type="button"
                    id="sidebar-novel-dropdown-prompts-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenNovelPrompts(activeNovel);
                    }}
                    className="w-full text-left px-2 py-1 text-[11px] text-amber-300 hover:bg-stone-800 rounded flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" /> Customize AI Prompts...
                  </button>
                )}
                {onOpenNovelManager && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenNovelManager();
                    }}
                    className="w-full text-left px-2 py-1 text-[11px] text-stone-300 hover:bg-stone-800 rounded flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" /> New Novel / Manage All...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Scenes */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1 text-stone-400">
            <span className="flex items-center gap-1 font-medium text-[10px] uppercase">
              <BookText className="w-3 h-3 text-amber-500" /> Scenes ({sceneFiles.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                id="sidebar-open-scene-summaries-btn"
                onClick={() => onOpenSceneSummaries?.()}
                title="Scene Summaries & LLM Context Overview"
                className="p-0.5 hover:text-amber-400 text-stone-500 rounded transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button onClick={onNewScene} title="New Scene" className="p-0.5 hover:text-white rounded transition-colors">
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {sceneFiles.map(f => {
            const sumObj = summaries[f.path];
            const hasSummary = Boolean(sumObj?.summary?.trim());
            return (
              <div
                key={f.path}
                onClick={() => onSelectFile(f.path)}
                className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                  activeFilePath === f.path ? 'bg-amber-950/60 text-amber-200 border border-amber-800/50' : 'text-stone-400 hover:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
                  <span className="truncate">{f.name.replace(/\.md$/, '').replace(/^\d+-/, '')}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasSummary ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSceneSummaries?.(f.path);
                      }}
                      title={`Scene Summary (${sumObj.wordCount || 'active'} words) - Click to view`}
                      className="text-amber-400/80 hover:text-amber-300 p-0.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSceneSummaries?.(f.path);
                      }}
                      title="Generate Scene Summary"
                      className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-amber-400 p-0.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(f.path); }}
                    title="Delete Scene"
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Characters */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1 text-stone-400">
            <span className="flex items-center gap-1 font-medium text-[10px] uppercase">
              <Users className="w-3 h-3 text-blue-400" /> Characters
            </span>
            <button onClick={() => onNewBibleEntry('character')} className="p-0.5 hover:text-white"><FilePlus className="w-3.5 h-3.5" /></button>
          </div>
          {characters.map(f => (
            <div
              key={f.path}
              onClick={() => onSelectFile(f.path)}
              className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                activeFilePath === f.path ? 'bg-blue-950/60 text-blue-200 border border-blue-800/50' : 'text-stone-400 hover:bg-stone-900'
              }`}
            >
              <span className="truncate">{f.name.replace(/\.md$/, '')}</span>
              <button onClick={(e) => { e.stopPropagation(); onDeleteFile(f.path); }} className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* World */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1 text-stone-400">
            <span className="flex items-center gap-1 font-medium text-[10px] uppercase">
              <Globe className="w-3 h-3 text-emerald-400" /> World & Lore
            </span>
            <button onClick={() => onNewBibleEntry('world')} className="p-0.5 hover:text-white"><FilePlus className="w-3.5 h-3.5" /></button>
          </div>
          {world.map(f => (
            <div
              key={f.path}
              onClick={() => onSelectFile(f.path)}
              className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                activeFilePath === f.path ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/50' : 'text-stone-400 hover:bg-stone-900'
              }`}
            >
              <span className="truncate">{f.name.replace(/\.md$/, '')}</span>
              <button onClick={(e) => { e.stopPropagation(); onDeleteFile(f.path); }} className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Scratchpad */}
        <div id="sidebar-scratchpad-section">
          <div className="flex items-center justify-between px-1 mb-1 text-stone-400">
            <span className="flex items-center gap-1 font-medium text-[10px] uppercase text-purple-300/90">
              <Lightbulb className="w-3 h-3 text-purple-400" /> Scratchpad ({scratchpadFiles.length})
            </span>
            <button
              type="button"
              id="sidebar-new-scratchpad-idea-btn"
              onClick={onNewScratchpadIdea}
              title="New Scratchpad Idea (Ad-hoc note)"
              className="p-0.5 hover:text-purple-300 text-stone-500 hover:bg-stone-900 rounded transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {scratchpadFiles.length === 0 ? (
            <button
              type="button"
              id="sidebar-empty-scratchpad-btn"
              onClick={onNewScratchpadIdea}
              className="w-full text-left px-2 py-1.5 rounded border border-dashed border-stone-800 hover:border-purple-600/60 text-[11px] text-stone-500 hover:text-purple-300 hover:bg-purple-950/20 transition-all flex items-center gap-1.5 group"
            >
              <Plus className="w-3 h-3 text-stone-600 group-hover:text-purple-400 flex-shrink-0" />
              <span className="truncate">Jot down an ad-hoc idea...</span>
            </button>
          ) : (
            scratchpadFiles.map(f => {
              const isSelected = activeFilePath === f.path;
              const displayName = f.name
                .replace(/\.md$/, '')
                .replace(/^idea-/, '')
                .replace(/[-_]/g, ' ');

              return (
                <div
                  key={f.path}
                  onClick={() => onSelectFile(f.path)}
                  className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-950/60 text-purple-200 border border-purple-800/50 shadow-xs'
                      : 'text-stone-400 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
                    <Lightbulb className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-purple-300' : 'text-stone-600 group-hover:text-purple-400'}`} />
                    <span className="truncate text-[11px]">{displayName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(f.path);
                    }}
                    title="Delete Idea"
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-2 border-t border-stone-800 space-y-1">
        {onOpenNovelManager && (
          <button
            onClick={onOpenNovelManager}
            className="w-full flex items-center gap-2 px-2 py-1 text-amber-400 hover:text-amber-300 rounded hover:bg-stone-900 transition-colors font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" /> Novels Library
          </button>
        )}
        <button onClick={onImportFile} className="w-full flex items-center gap-2 px-2 py-1 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-900">
          <FolderDown className="w-3.5 h-3.5" /> Import File
        </button>
        <button onClick={onExportCompiled} className="w-full flex items-center gap-2 px-2 py-1 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-900">
          <BookText className="w-3.5 h-3.5" /> Compile Novel
        </button>
        <button onClick={onOpenSettings} className="w-full flex items-center gap-2 px-2 py-1 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-900">
          <Settings className="w-3.5 h-3.5" /> Settings & Rules
        </button>
      </div>
    </div>
  );
};
