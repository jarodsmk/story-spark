import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { AppLogo } from './AppLogo.tsx';

export interface FullScreenLoaderProps {
  activeNovelTitle?: string;
  activeSceneName?: string;
  isLoadingNovels?: boolean;
  isLoadingScenes?: boolean;
  isLoadingCurrentScene?: boolean;
  isFadingOut?: boolean;
  isLightMode?: boolean;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  activeNovelTitle,
  activeSceneName,
  isLoadingNovels = true,
  isLoadingScenes = true,
  isLoadingCurrentScene = true,
  isFadingOut = false,
  isLightMode = false,
}) => {
  const statusMessage = useMemo(() => {
    if (isLoadingNovels) {
      return 'Loading author library...';
    }
    if (isLoadingScenes) {
      return activeNovelTitle ? `Opening ${activeNovelTitle}...` : 'Loading novel scenes...';
    }
    if (isLoadingCurrentScene) {
      if (activeSceneName) {
        const cleanName = activeSceneName
          .replace(/\.md$/, '')
          .replace(/^\d+-/, '')
          .replace(/-/g, ' ');
        const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        return `Loading scene: ${formatted}...`;
      }
      return 'Loading manuscript scene...';
    }
    return 'Finalizing manuscript workspace...';
  }, [isLoadingNovels, isLoadingScenes, isLoadingCurrentScene, activeNovelTitle, activeSceneName]);

  return (
    <div
      id="initial-fullscreen-loader"
      role="status"
      aria-label="Loading workspace"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none transition-opacity duration-300 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isLightMode
          ? 'bg-stone-100 text-stone-900'
          : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isLightMode
            ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/30 via-stone-100/80 to-stone-100'
            : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-stone-950/70 to-stone-950'
        }`}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo with Radiant Frame */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle Ambient Pulse behind logo */}
          <div
            className={`absolute -inset-3 rounded-3xl blur-xl animate-pulse ${
              isLightMode ? 'bg-amber-400/25' : 'bg-amber-500/20'
            }`}
          />

          <div
            id="fullscreen-loader-logo-frame"
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-300 ${
              isLightMode
                ? 'bg-white/95 border border-amber-500/30 shadow-amber-900/10'
                : 'bg-stone-900/90 border border-amber-500/35 shadow-black/80'
            }`}
          >
            <AppLogo
              id="fullscreen-loader-app-logo"
              className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500 transition-colors drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
            />
          </div>
        </div>

        {/* Brand Titles */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
            StorySpark
          </h1>
          <p
            className={`text-xs sm:text-sm font-medium tracking-wide ${
              isLightMode ? 'text-stone-600' : 'text-stone-400'
            }`}
          >
            Author Studio &amp; Manuscript Workspace
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div
          id="fullscreen-loader-progress-track"
          className={`w-48 sm:w-56 h-1 rounded-full overflow-hidden relative mb-4 ${
            isLightMode ? 'bg-stone-200' : 'bg-stone-800'
          }`}
        >
          <div
            id="fullscreen-loader-progress-bar"
            className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 rounded-full animate-loader-progress w-1/2"
          />
        </div>

        {/* Dynamic Status Message */}
        <div
          id="fullscreen-loader-status"
          className={`flex items-center justify-center gap-2 text-xs font-medium ${
            isLightMode ? 'text-amber-800' : 'text-amber-300/90'
          }`}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          <span className="truncate max-w-[240px]">{statusMessage}</span>
        </div>

        {/* Novel Context Pill if known */}
        {activeNovelTitle && !isLoadingNovels && (
          <div
            id="fullscreen-loader-novel-pill"
            className={`mt-3.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-tight max-w-[260px] truncate border ${
              isLightMode
                ? 'bg-white/80 border-stone-200 text-stone-600 shadow-xs'
                : 'bg-stone-900/80 border-stone-800 text-stone-400'
            }`}
          >
            Novel: {activeNovelTitle}
          </div>
        )}
      </div>
    </div>
  );
};
