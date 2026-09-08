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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const novelId = activeNovel?.id || null;
  const coverImage = activeNovel?.coverImage || null;
  const coverThemeKey = activeNovel?.coverTheme
    ? `${activeNovel.coverTheme.primaryHex}_${activeNovel.coverTheme.accentHex}`
    : '';

  useEffect(() => {
    let isMounted = true;

    if (!activeNovel || !activeNovel.coverImage) {
      // Currently selected novel does NOT have cover art.
      // Reset theme back to default StorySpark theme.
      lastProcessedCoverRef.current = null;
      lastNovelIdRef.current = activeNovel?.id || null;
      setCurrentTheme((prev) => (prev !== null ? null : prev));
      applyThemeToDocument(null);
      return;
    }

    const currentNovelId = activeNovel.id;
    const currentCoverImage = activeNovel.coverImage;

    // If novel has coverTheme stored and the coverImage hasn't changed
    if (activeNovel.coverTheme && lastProcessedCoverRef.current === currentCoverImage && lastNovelIdRef.current === currentNovelId) {
      setCurrentTheme((prev) => (prev?.primaryHex === activeNovel.coverTheme?.primaryHex ? prev : activeNovel.coverTheme!));
      applyThemeToDocument(activeNovel.coverTheme);
      return;
    }

    // If novel has a saved coverTheme and we just switched to this novel
    if (activeNovel.coverTheme && lastProcessedCoverRef.current !== currentCoverImage) {
      lastProcessedCoverRef.current = currentCoverImage;
      lastNovelIdRef.current = currentNovelId;
      setCurrentTheme((prev) => (prev?.primaryHex === activeNovel.coverTheme?.primaryHex ? prev : activeNovel.coverTheme!));
      applyThemeToDocument(activeNovel.coverTheme);
      return;
    }

    // Otherwise, extract theme from the cover picture
    lastProcessedCoverRef.current = currentCoverImage;
    lastNovelIdRef.current = currentNovelId;
    setIsExtracting(true);

    extractCoverTheme(currentCoverImage)
      .then((theme) => {
        if (!isMounted) return;
        setCurrentTheme(theme);
        applyThemeToDocument(theme);
        // Persist theme to database for instant future switches
        if (optionsRef.current?.onSaveTheme) {
          optionsRef.current.onSaveTheme(currentNovelId, theme).catch((err) => {
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
  }, [novelId, coverImage, coverThemeKey]);

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
