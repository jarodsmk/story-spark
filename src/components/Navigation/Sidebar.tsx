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
} from 'lucide-react';
import { FileItem } from '../../storage/fs.ts';
import { Novel } from '../../types/index.ts';

interface SidebarProps {
  sceneFiles: FileItem[];
  bibleFiles: FileItem[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onNewScene: () => void;
  onNewBibleEntry: (type: 'character' | 'world') => void;
  onDeleteFile: (path: string) => void;
  onOpenSettings: () => void;
  onImportFile: () => void;
  onExportCompiled: () => void;
  novels?: Novel[];
  activeNovel?: Novel;
  onSelectNovel?: (id: string) => void;
  onOpenNovelManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sceneFiles,
  bibleFiles,
  activeFilePath,
  onSelectFile,
  onNewScene,
  onNewBibleEntry,
  onDeleteFile,
  onOpenSettings,
  onImportFile,
  onExportCompiled,
  novels = [],
  activeNovel,
  onSelectNovel,
  onOpenNovelManager,
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

        {onOpenNovelManager && (
          <button
            onClick={onOpenNovelManager}
            title="Open Novel Library & Manager"
            className="p-1 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded transition-colors"
          >
            <Library className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Novel Selector Banner */}
      {activeNovel && (
        <div className="p-2 border-b border-stone-800/80 relative" ref={dropdownRef}>
          <div className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold px-1 mb-1 flex items-center justify-between">
            <span>Active Novel</span>
            <span className="font-mono text-[9px] text-amber-500/80">{novels.length} total</span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full text-left bg-stone-900 hover:bg-stone-800/90 border border-stone-800 hover:border-stone-700 p-2 rounded transition-colors flex items-center justify-between gap-2"
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
                      className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-amber-950/40 text-amber-300 font-medium'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate text-[11px]">{n.title}</div>
                        {n.genre && <div className="text-[9px] text-stone-500 truncate">{n.genre}</div>}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {onOpenNovelManager && (
                <div className="p-1 space-y-0.5 bg-stone-950/50">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenNovelManager();
                    }}
                    className="w-full text-left px-2 py-1 text-[11px] text-amber-400 hover:bg-stone-800 rounded flex items-center gap-1.5 font-medium"
                  >
                    <Plus className="w-3 h-3" /> New Novel / Manage All...
                  </button>
                </div>
              )}
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
            <button onClick={onNewScene} className="p-0.5 hover:text-white"><FilePlus className="w-3.5 h-3.5" /></button>
          </div>
          {sceneFiles.map(f => (
            <div
              key={f.path}
              onClick={() => onSelectFile(f.path)}
              className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                activeFilePath === f.path ? 'bg-amber-950/60 text-amber-200 border border-amber-800/50' : 'text-stone-400 hover:bg-stone-900'
              }`}
            >
              <span className="truncate">{f.name.replace(/\.md$/, '').replace(/^\d+-/, '')}</span>
              <button onClick={(e) => { e.stopPropagation(); onDeleteFile(f.path); }} className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
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
