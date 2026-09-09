import { ThemeMode } from '../../types/index.ts';

export const THEME_STORAGE_KEY = 'story_spark_theme_mode';

export interface PaletteTokens {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  850: string;
  900: string;
  950: string;
}

/**
 * Default Dark-Stone Palette (Tailwind default RGB tokens)
 */
export const DARK_STONE_PALETTE: PaletteTokens = {
  50: '250 250 249',
  100: '245 245 244',
  200: '231 229 228',
  300: '214 211 209',
  400: '168 162 158',
  500: '120 113 108',
  600: '87 83 78',
  700: '68 64 60',
  800: '41 37 36',
  850: '33 30 28',
  900: '28 25 23',
  950: '12 10 9',
};

/**
 * High-Contrast Inverted Stone Palette
 * Inverts dark backgrounds to clean, crisp light surfaces and dark high-contrast text:
 * - 950: Subtly shaded surface for sidebars and headers (245 245 244)
 * - 900: Crisp white main canvas & card backgrounds (255 255 255)
 * - 850: Soft light elevated surface (245 244 242)
 * - 800: Hover and active card background (236 234 232)
 * - 700: Defined border & divider line (214 211 209)
 * - 600: Medium divider (168 162 158)
 * - 500: Neutral midtone (115 108 103)
 * - 400: High-contrast secondary text (87 83 78, >6.5:1 ratio)
 * - 300: High-contrast body text (68 64 60, >9:1 ratio)
 * - 200: Deep dark text (41 37 36, >13:1 ratio)
 * - 100: Deepest primary heading text (28 25 23, >15:1 ratio)
 * - 50: Max-contrast black text (12 10 9, >19:1 ratio)
 */
export const LIGHT_STONE_PALETTE: PaletteTokens = {
  50: '12 10 9',
  100: '28 25 23',
  200: '41 37 36',
  300: '68 64 60',
  400: '87 83 78',
  500: '115 108 103',
  600: '168 162 158',
  700: '214 211 209',
  800: '236 234 232',
  850: '245 244 242',
  900: '255 255 255',
  950: '245 245 244',
};

export const DARK_THEME_TOKENS = {
  ambientBg: '#1c1917',
  textColor: '#f5f5f4',
  scrollbarTrack: 'rgba(0, 0, 0, 0.2)',
  scrollbarThumb: 'rgba(255, 255, 255, 0.15)',
  scrollbarThumbHover: 'rgba(255, 255, 255, 0.3)',
  selectionBg: '#d97706',
  selectionColor: '#ffffff',
  colorScheme: 'dark',
};

export const LIGHT_THEME_TOKENS = {
  ambientBg: '#fafaf9',
  textColor: '#1c1917',
  scrollbarTrack: 'rgba(0, 0, 0, 0.05)',
  scrollbarThumb: 'rgba(0, 0, 0, 0.18)',
  scrollbarThumbHover: 'rgba(0, 0, 0, 0.35)',
  selectionBg: '#f59e0b',
  selectionColor: '#ffffff',
  colorScheme: 'light',
};

/**
 * Retrieves the stored theme mode from localStorage, falling back to system preference or defaultMode.
 */
export function getStoredThemeMode(defaultMode: ThemeMode = 'dark'): ThemeMode {
  if (typeof localStorage === 'undefined') return defaultMode;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // ignore storage access errors
  }
  return defaultMode;
}

/**
 * Applies the selected theme mode ('dark' | 'light') to the document root,
 * setting data attributes and CSS variables.
 */
export function applyThemeModeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (root.dataset) {
    root.dataset.theme = mode;
  }
  root.setAttribute('data-theme', mode);

  if (mode === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  const palette = mode === 'light' ? LIGHT_STONE_PALETTE : DARK_STONE_PALETTE;
  const tokens = mode === 'light' ? LIGHT_THEME_TOKENS : DARK_THEME_TOKENS;

  // Set all stone palette steps as CSS variables
  (Object.keys(palette) as unknown as Array<keyof PaletteTokens>).forEach((step) => {
    root.style.setProperty(`--theme-stone-${step}`, palette[step]);
  });

  root.style.setProperty('--theme-ambient-bg', tokens.ambientBg);
  root.style.setProperty('--theme-text-color', tokens.textColor);
  root.style.setProperty('--theme-scrollbar-track', tokens.scrollbarTrack);
  root.style.setProperty('--theme-scrollbar-thumb', tokens.scrollbarThumb);
  root.style.setProperty('--theme-scrollbar-thumb-hover', tokens.scrollbarThumbHover);
  root.style.setProperty('--theme-selection-bg', tokens.selectionBg);
  root.style.setProperty('--theme-selection-color', tokens.selectionColor);
  root.style.colorScheme = tokens.colorScheme;
}
