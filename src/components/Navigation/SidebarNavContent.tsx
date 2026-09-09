import React from 'react';
import {
  BookText,
  Users,
  Globe,
  FilePlus,
  Settings,
  FolderDown,
  Trash2,
  ChevronDown,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Lightbulb,
  Loader2,
  Plus,
  Check,
} from 'lucide-react';
import { FileItem } from '../../storage/fs.ts';
import { Novel, SceneSummary, CoverTheme, AuthorProfile } from '../../types/index.ts';
import { PWAInstallButton } from '../Common/PWAInstallButton.tsx';

export interface SidebarNavContentProps {
  isMobile?: boolean;
  activeNovel?: Novel;
  novels: Novel[];
  authorProfile?: AuthorProfile;
  currentTheme?: CoverTheme | null;
  isThemeActive?: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  dropdownRef?: React.RefObject<HTMLDivElement | null>;
  sceneFiles: FileItem[];
  bibleFiles: FileItem[];
  scratchpadFiles: FileItem[];
  activeFilePath: string;
  summaries: Record<string, SceneSummary>;
  isLoadingScenes: boolean;
  isLoadingCurrentScene: boolean;
  onSelectFile: (path: string) => void;
  onNewScene: () => void;
  onNewBibleEntry: (type: 'character' | 'world') => void;
  onNewScratchpadIdea?: () => void;
  onDeleteFile: (path: string) => void;
  onOpenSettings: () => void;
  onImportFile: () => void;
  onExportCompiled: () => void;
  onSelectNovel?: (id: string) => void;
  onOpenNovelManager?: () => void;
  onUploadCover?: (novel: Novel) => void;
  onOpenNovelPrompts?: (novel: Novel) => void;
  onOpenSceneSummaries?: (scenePath?: string) => void;
  onCloseMobile?: () => void;
}

export const SidebarNavContent: React.FC<SidebarNavContentProps> = ({
  isMobile = false,
  activeNovel,
  novels,
  authorProfile,
  currentTheme,
  isThemeActive = false,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  sceneFiles,
  bibleFiles,
  scratchpadFiles = [],
  activeFilePath,
  summaries = {},
  isLoadingScenes = false,
  isLoadingCurrentScene = false,
  onSelectFile,
  onNewScene,
  onNewBibleEntry,
  onNewScratchpadIdea,
  onDeleteFile,
  onOpenSettings,
  onImportFile,
  onExportCompiled,
  onSelectNovel,
  onOpenNovelManager,
  onUploadCover,
  onOpenNovelPrompts,
  onOpenSceneSummaries,
  onCloseMobile,
}) => {
  const characters = bibleFiles.filter((f) => f.path.includes('characters'));
  const world = bibleFiles.filter((f) => f.path.includes('world'));

  const authorDisplayName = authorProfile?.penName || authorProfile?.name;

  const currentTotalWords = Object.values(summaries).reduce(
    (acc, s) => acc + (s.wordCount || 0),
    0
  );

  const handleAction = (cb?: () => void) => {
    cb?.();
    if (isMobile) {
      onCloseMobile?.();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Novel Selector Banner */}
      {activeNovel && (
        <div className="p-2 border-b border-stone-800/80 relative" ref={isMobile ? undefined : dropdownRef}>
          <div className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold px-1 mb-1.5 flex items-center justify-between">
            <span>Active Novel</span>
            <div className="flex items-center gap-1.5">
              {onOpenNovelPrompts && (
                <button
                  type="button"
                  id={isMobile ? 'mobile-sidebar-quick-prompts-btn' : 'sidebar-quick-prompts-btn'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onOpenNovelPrompts(activeNovel));
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
                    id={isMobile ? 'mobile-sidebar-upload-cover-btn' : 'sidebar-upload-cover-btn'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(() => onUploadCover(activeNovel));
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
              id={isMobile ? 'mobile-sidebar-novel-cover-thumbnail' : 'sidebar-novel-cover-thumbnail'}
              onClick={() => handleAction(() => onUploadCover?.(activeNovel))}
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
              id={isMobile ? 'mobile-sidebar-novel-dropdown-btn' : 'sidebar-novel-dropdown-btn'}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex-1 min-w-0 text-left bg-stone-900 hover:bg-stone-800/90 border border-stone-800 hover:border-stone-700 p-1.5 rounded transition-colors flex items-center justify-between gap-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-stone-100 truncate text-[11px] leading-tight flex-1">
                    {activeNovel.title}
                  </span>
                  {isThemeActive && currentTheme && (
                    <span
                      className="flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-stone-950/90 border border-stone-800 shadow-2xs"
                      title={`Artwork theme active: Primary ${currentTheme.primaryHex}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.primaryHex }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.secondaryHex }}
                      />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-amber-400/80 truncate mt-0.5 font-medium">
                  {activeNovel.genre && <span>{activeNovel.genre}</span>}
                  {authorDisplayName && (
                    <>
                      {activeNovel.genre && <span className="text-stone-600 font-mono">·</span>}
                      <span className="text-stone-400 font-normal">by {authorDisplayName}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 flex-shrink-0 transition-transform ${
                  isDropdownOpen ? 'rotate-180 text-amber-500' : ''
                }`}
              />
            </button>
          </div>

          {/* Target Word Count Progress Bar */}
          {activeNovel.targetWordCount && activeNovel.targetWordCount > 0 && (
            <div className="mt-2 px-1 space-y-1" id={isMobile ? 'mobile-novel-progress-bar-container' : 'novel-progress-bar-container'}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-stone-400">Target Progress</span>
                <span className="font-mono text-amber-400 font-semibold" id={isMobile ? 'mobile-novel-progress-pct-badge' : 'novel-progress-pct-badge'}>
                  {Math.min(
                    100,
                    Math.round(
                      (currentTotalWords / activeNovel.targetWordCount) * 100
                    )
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  id={isMobile ? 'mobile-novel-progress-bar-fill' : 'novel-progress-bar-fill'}
                  className="bg-amber-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                    100,
                    Math.round(
                      (currentTotalWords / activeNovel.targetWordCount) * 100
                    )
                  )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono" id={isMobile ? 'mobile-novel-progress-words-detail' : 'novel-progress-words-detail'}>
                <span>{currentTotalWords.toLocaleString()}w written</span>
                <span>{activeNovel.targetWordCount.toLocaleString()}w goal</span>
              </div>
            </div>
          )}

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-2 right-2 mt-1 bg-stone-900 border border-stone-800 rounded shadow-xl z-50 max-h-56 overflow-y-auto">
              <div className="p-1 space-y-0.5">
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold px-2 py-1">
                  Switch Novel
                </div>
                {novels.map((novel) => {
                  const isSelected = novel.id === activeNovel.id;
                  return (
                    <button
                      key={novel.id}
                      onClick={() => {
                        handleAction(() => onSelectNovel && onSelectNovel(novel.id));
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-amber-950/60 text-amber-200 font-medium'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <div className="truncate font-medium">{novel.title}</div>
                        <div className="text-[9px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                          {novel.genre && <span>{novel.genre}</span>}
                          {authorDisplayName && (
                            <>
                              {novel.genre && <span className="text-stone-600 font-mono">·</span>}
                              <span className="text-stone-400">by {authorDisplayName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {onOpenNovelManager && (
                <div className="p-1 border-t border-stone-800 bg-stone-950/50">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleAction(onOpenNovelManager);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-amber-400 hover:text-amber-300 hover:bg-stone-800 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage & Create Novels...</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manuscript Scenes */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 px-1 mb-1">
            <span className="flex items-center gap-1.5">
              <BookText className="w-3.5 h-3.5 text-amber-400" />
              <span>Manuscript ({sceneFiles.length})</span>
              {isLoadingScenes && (
                <Loader2 className="w-2.5 h-2.5 text-amber-400 animate-spin" />
              )}
            </span>
            <button
              type="button"
              id={isMobile ? 'mobile-sidebar-new-scene-btn' : 'sidebar-new-scene-btn'}
              onClick={() => handleAction(onNewScene)}
              title="Add New Scene"
              className="p-1 hover:text-stone-200 text-stone-400 hover:bg-stone-900 rounded transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {sceneFiles.map((f) => {
              const isSelected = activeFilePath === f.path;
              const summary = summaries[f.path];
              const isCurrentSceneLoading = isSelected && isLoadingCurrentScene;

              return (
                <div
                  key={f.path}
                  onClick={() => handleAction(() => onSelectFile(f.path))}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-950/60 text-amber-200 border border-amber-800/60 shadow-xs'
                      : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate flex-1 min-w-0 mr-1">
                    <span className="truncate">
                      {f.name.replace(/\.md$/, '').replace(/^\d+-/, '')}
                    </span>
                    {isCurrentSceneLoading && (
                      <Loader2 className="w-2.5 h-2.5 text-amber-400 animate-spin flex-shrink-0" />
                    )}
                    {summary && (
                      <span
                        title={`Scene Summary (${summary.wordCount} words): ${summary.summary.slice(0, 100)}...`}
                        className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[9px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex-shrink-0"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span className="hidden xl:inline">sum</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 opacity-80 group-hover:opacity-100">
                    {onOpenSceneSummaries && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(() => onOpenSceneSummaries(f.path));
                        }}
                        title={summary ? 'View Scene Summary' : 'Generate Scene Summary'}
                        className={`p-1 rounded transition-colors ${
                          summary
                            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/80'
                            : 'text-stone-500 hover:text-amber-400 hover:bg-stone-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(f.path);
                      }}
                      className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Story Bible */}
        <div>
          <div className="text-[11px] font-semibold text-stone-400 px-1 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Characters ({characters.length})</span>
            </span>
            <button
              type="button"
              id={isMobile ? 'mobile-sidebar-new-character-btn' : 'sidebar-new-character-btn'}
              onClick={() => handleAction(() => onNewBibleEntry('character'))}
              title="Add New Character"
              className="p-1 hover:text-stone-200 text-stone-400 hover:bg-stone-900 rounded transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {characters.map((f) => {
              const isSelected = activeFilePath === f.path;
              return (
                <div
                  key={f.path}
                  onClick={() => handleAction(() => onSelectFile(f.path))}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-950/60 text-blue-200 border border-blue-800/60 shadow-xs'
                      : 'text-stone-400 hover:bg-stone-900'
                  }`}
                >
                  <span className="truncate">{f.name.replace(/\.md$/, '')}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(f.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-stone-400 px-1 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>World & Lore ({world.length})</span>
            </span>
            <button
              type="button"
              id={isMobile ? 'mobile-sidebar-new-world-btn' : 'sidebar-new-world-btn'}
              onClick={() => handleAction(() => onNewBibleEntry('world'))}
              title="Add World / Setting Entry"
              className="p-1 hover:text-stone-200 text-stone-400 hover:bg-stone-900 rounded transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {world.map((f) => {
              const isSelected = activeFilePath === f.path;
              return (
                <div
                  key={f.path}
                  onClick={() => handleAction(() => onSelectFile(f.path))}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/60 shadow-xs'
                      : 'text-stone-400 hover:bg-stone-900'
                  }`}
                >
                  <span className="truncate">{f.name.replace(/\.md$/, '')}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(f.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scratchpad Ideas */}
        <div>
          <div className="text-[11px] font-semibold text-stone-400 px-1 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
              <span>Scratchpad ({scratchpadFiles.length})</span>
            </span>
            <button
              type="button"
              id={isMobile ? 'mobile-sidebar-new-scratchpad-idea-btn' : 'sidebar-new-scratchpad-idea-btn'}
              onClick={() => handleAction(onNewScratchpadIdea)}
              title="New Scratchpad Idea (Ad-hoc note)"
              className="p-1 hover:text-purple-300 text-stone-400 hover:bg-stone-900 rounded transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {scratchpadFiles.length === 0 ? (
            <button
              type="button"
              id={isMobile ? 'mobile-sidebar-empty-scratchpad-btn' : 'sidebar-empty-scratchpad-btn'}
              onClick={() => handleAction(onNewScratchpadIdea)}
              className="w-full text-left px-2 py-1.5 rounded border border-dashed border-stone-800 hover:border-purple-600/60 text-[11px] text-stone-500 hover:text-purple-300 hover:bg-purple-950/20 transition-all flex items-center gap-1.5 group"
            >
              <Plus className="w-3 h-3 text-stone-600 group-hover:text-purple-400 flex-shrink-0" />
              <span className="truncate">Jot down an ad-hoc idea...</span>
            </button>
          ) : (
            scratchpadFiles.map((f) => {
              const isSelected = activeFilePath === f.path;
              const displayName = f.name
                .replace(/\.md$/, '')
                .replace(/^idea-/, '')
                .replace(/[-_]/g, ' ');

              return (
                <div
                  key={f.path}
                  onClick={() => handleAction(() => onSelectFile(f.path))}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-950/60 text-purple-200 border border-purple-800/50 shadow-xs'
                      : 'text-stone-400 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
                    <Lightbulb
                      className={`w-3 h-3 flex-shrink-0 ${
                        isSelected
                          ? 'text-purple-300'
                          : 'text-stone-600 group-hover:text-purple-400'
                      }`}
                    />
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

      {/* Footer Actions */}
      <div className="p-2 border-t border-stone-800 space-y-1 bg-stone-950 flex-shrink-0">
        <PWAInstallButton variant="sidebar" className="mb-1" />
        {onOpenNovelManager && (
          <button
            onClick={() => handleAction(onOpenNovelManager)}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-amber-400 hover:text-amber-300 rounded hover:bg-stone-900 transition-colors font-medium text-xs"
          >
            <BookOpen className="w-4 h-4" /> Novels Library
          </button>
        )}
        <button
          onClick={() => handleAction(onImportFile)}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-900 text-xs"
        >
          <FolderDown className="w-4 h-4" /> Import File
        </button>
        <button
          onClick={() => handleAction(onExportCompiled)}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-900 text-xs"
        >
          <BookText className="w-4 h-4" /> Compile Novel
        </button>
        <button
          onClick={() => handleAction(onOpenSettings)}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-900 text-xs"
        >
          <Settings className="w-4 h-4" /> Settings & Rules
        </button>
      </div>
    </div>
  );
};
