import React, { useState, useEffect, useRef } from 'react';
import {
  FilePlus,
  BookText,
  Settings,
  FolderDown,
  Sparkles,
  Library,
  PanelLeftClose,
  Lightbulb,
  Loader2,
  BookOpen,
  X,
} from 'lucide-react';
import { FileItem } from '../../storage/fs.ts';
import { Novel, SceneSummary, CoverTheme, AuthorProfile } from '../../types/index.ts';
import { AppLogo } from '../Common/AppLogo.tsx';
import { SidebarNavContent } from './SidebarNavContent.tsx';
import { PWAInstallButton } from '../Common/PWAInstallButton.tsx';

interface SidebarProps {
  sceneFiles: FileItem[];
  bibleFiles: FileItem[];
  scratchpadFiles?: FileItem[];
  activeFilePath: string;
  summaries?: Record<string, SceneSummary>;
  isLoadingScenes?: boolean;
  isLoadingCurrentScene?: boolean;
  onSelectFile: (path: string) => void;
  onNewScene: () => void;
  onNewBibleEntry: (type: 'character' | 'world') => void;
  onNewScratchpadIdea?: () => void;
  onDeleteFile: (path: string) => void;
  onOpenSettings: () => void;
  onImportFile: () => void;
  onExportCompiled: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeNovel?: Novel;
  novels?: Novel[];
  authorProfile?: AuthorProfile;
  onSelectNovel?: (id: string) => void;
  onOpenNovelManager?: () => void;
  onUploadCover?: (novel: Novel) => void;
  onOpenNovelPrompts?: (novel: Novel) => void;
  onOpenSceneSummaries?: (scenePath?: string) => void;
  currentTheme?: CoverTheme | null;
  isThemeActive?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  sidebarWidth?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  isCollapsed = false,
  onToggleCollapse,
  activeNovel,
  novels = [],
  authorProfile,
  onSelectNovel,
  onOpenNovelManager,
  onUploadCover,
  onOpenNovelPrompts,
  onOpenSceneSummaries,
  currentTheme,
  isThemeActive = false,
  isMobileOpen = false,
  onCloseMobile,
  sidebarWidth = 240,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const renderMobileDrawer = () => (
    <div
      id="mobile-sidebar-drawer"
      className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-xs flex animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCloseMobile) {
          onCloseMobile();
        }
      }}
    >
      <div
        id="mobile-sidebar-drawer-panel"
        className="w-72 max-w-[85vw] bg-stone-950 border-r border-stone-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200 text-xs select-none"
      >
        {/* Drawer Header */}
        <div className="h-12 border-b border-stone-800 px-3.5 flex items-center justify-between bg-stone-950 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center flex-shrink-0 shadow-xs">
              <AppLogo className="w-5 h-5 text-stone-100" />
            </div>
            <div>
              <div className="font-semibold text-stone-100 text-sm tracking-tight leading-none">StorySpark</div>
              <div className="text-[10px] text-stone-500 mt-0.5">Multi-Novel Studio</div>
            </div>
          </div>
          <button
            type="button"
            id="mobile-sidebar-close-btn"
            onClick={onCloseMobile}
            className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-900 transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <SidebarNavContent
          isMobile={true}
          activeNovel={activeNovel}
          novels={novels}
          authorProfile={authorProfile}
          currentTheme={currentTheme}
          isThemeActive={isThemeActive}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          dropdownRef={dropdownRef}
          sceneFiles={sceneFiles}
          bibleFiles={bibleFiles}
          scratchpadFiles={scratchpadFiles}
          activeFilePath={activeFilePath}
          summaries={summaries}
          isLoadingScenes={isLoadingScenes}
          isLoadingCurrentScene={isLoadingCurrentScene}
          onSelectFile={onSelectFile}
          onNewScene={onNewScene}
          onNewBibleEntry={onNewBibleEntry}
          onNewScratchpadIdea={onNewScratchpadIdea}
          onDeleteFile={onDeleteFile}
          onOpenSettings={onOpenSettings}
          onImportFile={onImportFile}
          onExportCompiled={onExportCompiled}
          onSelectNovel={onSelectNovel}
          onOpenNovelManager={onOpenNovelManager}
          onUploadCover={onUploadCover}
          onOpenNovelPrompts={onOpenNovelPrompts}
          onOpenSceneSummaries={onOpenSceneSummaries}
          onCloseMobile={onCloseMobile}
        />
      </div>
    </div>
  );

  if (isCollapsed) {
    return (
      <>
        {isMobileOpen && renderMobileDrawer()}
        <aside
          aria-label="Left Menu (Collapsed)"
          className="hidden md:flex w-12 bg-stone-950 border-r border-stone-800 flex-col h-full flex-shrink-0 text-xs select-none items-center py-2.5 justify-between transition-all duration-150"
        >
          <div className="flex flex-col items-center space-y-2 w-full px-1">
            {/* Logo / Expand toggle */}
            <button
              type="button"
              id="sidebar-expand-toggle-btn"
              onClick={onToggleCollapse}
              title="StorySpark - Expand Left Menu (Ctrl+B)"
              className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-500/60 flex items-center justify-center text-stone-200 hover:text-amber-400 transition-colors group cursor-pointer"
            >
              <AppLogo className="w-5 h-5 text-stone-200 group-hover:text-amber-400 transition-colors" />
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

            {/* Collapsed Scene Loader */}
            {(isLoadingScenes || isLoadingCurrentScene) && (
              <div
                id="sidebar-collapsed-loader"
                title={isLoadingScenes ? 'Loading scenes...' : 'Loading scene...'}
                className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 my-1 animate-pulse"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
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
            <PWAInstallButton variant="collapsed" />
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
      </>
    );
  }

  return (
    <>
      {isMobileOpen && renderMobileDrawer()}
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="hidden md:flex bg-stone-950 border-r border-stone-800 flex-col h-full flex-shrink-0 text-xs select-none"
      >
        {/* Brand Header */}
        <div className="h-12 border-b border-stone-800 px-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center flex-shrink-0 shadow-xs group">
              <AppLogo className="w-5 h-5 text-stone-100 group-hover:text-amber-400 transition-colors" />
            </div>
            <div>
              <div className="font-semibold text-stone-200 tracking-tight leading-none">StorySpark</div>
              <div className="text-[10px] text-stone-500 mt-0.5">Multi-Novel Studio</div>
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

        {/* Navigation Content */}
        <SidebarNavContent
          isMobile={false}
          activeNovel={activeNovel}
          novels={novels}
          authorProfile={authorProfile}
          currentTheme={currentTheme}
          isThemeActive={isThemeActive}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          dropdownRef={dropdownRef}
          sceneFiles={sceneFiles}
          bibleFiles={bibleFiles}
          scratchpadFiles={scratchpadFiles}
          activeFilePath={activeFilePath}
          summaries={summaries}
          isLoadingScenes={isLoadingScenes}
          isLoadingCurrentScene={isLoadingCurrentScene}
          onSelectFile={onSelectFile}
          onNewScene={onNewScene}
          onNewBibleEntry={onNewBibleEntry}
          onNewScratchpadIdea={onNewScratchpadIdea}
          onDeleteFile={onDeleteFile}
          onOpenSettings={onOpenSettings}
          onImportFile={onImportFile}
          onExportCompiled={onExportCompiled}
          onSelectNovel={onSelectNovel}
          onOpenNovelManager={onOpenNovelManager}
          onUploadCover={onUploadCover}
          onOpenNovelPrompts={onOpenNovelPrompts}
          onOpenSceneSummaries={onOpenSceneSummaries}
          onCloseMobile={onCloseMobile}
        />
      </div>
    </>
  );
};
