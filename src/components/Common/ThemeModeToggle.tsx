import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../../types/index.ts';

interface ThemeModeToggleProps {
  themeMode: ThemeMode;
  onToggle: () => void;
  variant?: 'header' | 'sidebar' | 'collapsed' | 'settings' | 'compact';
  id?: string;
  className?: string;
}

export const ThemeModeToggle: React.FC<ThemeModeToggleProps> = ({
  themeMode,
  onToggle,
  variant = 'header',
  id = 'theme-mode-toggle',
  className = '',
}) => {
  const isLight = themeMode === 'light';
  const label = isLight ? 'Switch to Dark Mode' : 'Switch to High-Contrast Light Mode';
  const currentTitle = isLight ? 'Light Mode (High Contrast)' : 'Dark Stone Mode';

  if (variant === 'settings') {
    return (
      <div
        id={id}
        className={`flex items-center justify-between p-3.5 rounded-lg border border-stone-800 bg-stone-950/40 hover:bg-stone-950/70 transition-colors ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLight ? 'bg-amber-500/20 text-amber-600' : 'bg-stone-800 text-stone-300'}`}>
            {isLight ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-medium text-stone-200 flex items-center gap-2">
              <span>Color Scheme Theme</span>
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold ${
                isLight ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-300'
              }`}>
                {currentTitle}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Invert dark-stone surfaces to crisp high-contrast light backgrounds or dark focus palette.
            </p>
          </div>
        </div>

        <button
          type="button"
          id={`${id}-switch-btn`}
          onClick={onToggle}
          aria-label={label}
          aria-pressed={isLight}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900 ${
            isLight ? 'bg-amber-600' : 'bg-stone-700'
          }`}
        >
          <span className="sr-only">{label}</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isLight ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        id={id}
        onClick={onToggle}
        title={label}
        aria-label={label}
        aria-pressed={isLight}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-stone-300 hover:text-stone-100 hover:bg-stone-800/80 transition-colors cursor-pointer group ${className}`}
      >
        <span className="flex items-center gap-2.5">
          {isLight ? (
            <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-stone-400 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
          )}
          <span>{isLight ? 'Light Mode' : 'Dark Mode'}</span>
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
          isLight ? 'bg-amber-600/20 text-amber-700 border border-amber-500/30' : 'bg-stone-800 text-stone-400'
        }`}>
          {isLight ? 'High-Contrast' : 'Stone'}
        </span>
      </button>
    );
  }

  if (variant === 'collapsed') {
    return (
      <button
        type="button"
        id={id}
        onClick={onToggle}
        title={label}
        aria-label={label}
        aria-pressed={isLight}
        className={`p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors cursor-pointer group flex items-center justify-center ${className}`}
      >
        {isLight ? (
          <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-stone-400 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        id={id}
        onClick={onToggle}
        title={label}
        aria-label={label}
        aria-pressed={isLight}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded border border-stone-800 hover:bg-stone-800 text-stone-300 hover:text-stone-100 transition-colors cursor-pointer ${className}`}
      >
        {isLight ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-stone-400" />}
        <span className="text-[11px] font-medium">{isLight ? 'Light' : 'Dark'}</span>
      </button>
    );
  }

  // Default: 'header' icon button
  return (
    <button
      type="button"
      id={id}
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-pressed={isLight}
      className={`p-1.5 rounded-lg border border-stone-800/80 hover:border-stone-700 bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-all flex items-center justify-center cursor-pointer shadow-xs group ${className}`}
    >
      {isLight ? (
        <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-stone-400 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
};
