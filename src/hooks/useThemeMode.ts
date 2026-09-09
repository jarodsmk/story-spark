import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '../types/index.ts';
import {
  THEME_STORAGE_KEY,
  getStoredThemeMode,
  applyThemeModeToDocument,
} from '../engine/theme/themeMode.ts';

export interface UseThemeModeReturn {
  themeMode: ThemeMode;
  isLightMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export function useThemeMode(): UseThemeModeReturn {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredThemeMode('dark'));

  useEffect(() => {
    applyThemeModeToDocument(themeMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {}
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    themeMode,
    isLightMode: themeMode === 'light',
    setThemeMode,
    toggleThemeMode,
  };
}
