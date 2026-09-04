import React from 'react';
import { BookText, Users, Globe, FilePlus, Settings, FolderDown, Trash2 } from 'lucide-react';
import { FileItem } from '../../storage/fs.ts';

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
}) => {
  const characters = bibleFiles.filter(f => f.path.includes('characters'));
  const world = bibleFiles.filter(f => f.path.includes('world'));

  return (
    <div className="w-60 bg-stone-950 border-r border-stone-800 flex flex-col h-full flex-shrink-0 text-xs">
      <div className="h-12 border-b border-stone-800 px-3 flex items-center space-x-2">
        <span className="text-amber-500 font-bold text-lg">⚡</span>
        <div>
          <div className="font-semibold text-stone-200">StorySpark</div>
          <div className="text-[10px] text-stone-500">Local Author Studio</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Scenes */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1 text-stone-400">
            <span className="flex items-center gap-1 font-medium text-[10px] uppercase">
              <BookText className="w-3 h-3 text-amber-500" /> Scenes
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
