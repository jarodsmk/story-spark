import { useState, useEffect, useRef } from 'react';
import { Novel, CoverTheme } from '../types/index.ts';
import { extractCoverTheme, applyThemeToDocument } from '../engine/theme/coverTheme.ts';

interface UseCoverThemeOptions {
  onSaveTheme?: (novelId: string, theme: CoverTheme) => Promise<void>;
}

export function useCoverTheme(activeNovel?: Novel | null, options?: UseCoverThemeOptions) {
  const [currentTheme, setCurrentTheme] = useState<CoverTheme | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const lastProcessedCoverRef = useRef<string | null>(null);
  const lastNovelIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!activeNovel || !activeNovel.coverImage) {
      // Currently selected novel does NOT have cover art.
      // Reset theme back to default StorySpark theme.
      lastProcessedCoverRef.current = null;
      lastNovelIdRef.current = activeNovel?.id || null;
      setCurrentTheme(null);
      applyThemeToDocument(null);
      return;
    }

    const novelId = activeNovel.id;
    const coverImage = activeNovel.coverImage;

    // If novel has coverTheme stored and the coverImage hasn't changed
    if (activeNovel.coverTheme && lastProcessedCoverRef.current === coverImage && lastNovelIdRef.current === novelId) {
      setCurrentTheme(activeNovel.coverTheme);
      applyThemeToDocument(activeNovel.coverTheme);
      return;
    }

    // If novel has a saved coverTheme and we just switched to this novel
    if (activeNovel.coverTheme && lastProcessedCoverRef.current !== coverImage) {
      lastProcessedCoverRef.current = coverImage;
      lastNovelIdRef.current = novelId;
      setCurrentTheme(activeNovel.coverTheme);
      applyThemeToDocument(activeNovel.coverTheme);
      return;
    }

    // Otherwise, extract theme from the cover picture
    lastProcessedCoverRef.current = coverImage;
    lastNovelIdRef.current = novelId;
    setIsExtracting(true);

    extractCoverTheme(coverImage)
      .then((theme) => {
        if (!isMounted) return;
        setCurrentTheme(theme);
        applyThemeToDocument(theme);
        // Persist theme to database for instant future switches
        if (options?.onSaveTheme) {
          options.onSaveTheme(novelId, theme).catch((err) => {
            console.warn('Failed to save extracted cover theme:', err);
          });
        }
      })
      .catch((err) => {
        console.warn('Theme extraction failed:', err);
        if (isMounted) {
          setCurrentTheme(null);
          applyThemeToDocument(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsExtracting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeNovel?.id, activeNovel?.coverImage, activeNovel?.coverTheme]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      applyThemeToDocument(null);
    };
  }, []);

  return {
    currentTheme,
    isThemeActive: Boolean(activeNovel?.coverImage && currentTheme),
    isExtracting,
  };
}
