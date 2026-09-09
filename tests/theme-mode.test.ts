import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DARK_STONE_PALETTE,
  LIGHT_STONE_PALETTE,
  DARK_THEME_TOKENS,
  LIGHT_THEME_TOKENS,
  getStoredThemeMode,
  applyThemeModeToDocument,
  THEME_STORAGE_KEY,
} from '../src/engine/theme/themeMode.ts';

describe('Theme Mode Engine & High-Contrast Light Mode', () => {
  let store: Record<string, string> = {};
  const rootStyles: Record<string, string> = {};
  const rootClasses = new Set<string>();
  const rootAttrs: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    for (const key in rootStyles) delete rootStyles[key];
    rootClasses.clear();
    for (const key in rootAttrs) delete rootAttrs[key];

    // Mock localStorage
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = String(val); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
    (globalThis as any).localStorage = mockStorage;

    // Mock document.documentElement
    (globalThis as any).document = {
      documentElement: {
        dataset: {},
        style: {
          setProperty: (prop: string, val: string) => { rootStyles[prop] = val; },
          getPropertyValue: (prop: string) => rootStyles[prop] || '',
          colorScheme: '',
        },
        classList: {
          add: (cls: string) => rootClasses.add(cls),
          remove: (cls: string) => rootClasses.delete(cls),
          contains: (cls: string) => rootClasses.has(cls),
        },
        setAttribute: (attr: string, val: string) => { rootAttrs[attr] = val; },
        getAttribute: (attr: string) => rootAttrs[attr] || null,
        removeAttribute: (attr: string) => { delete rootAttrs[attr]; },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).document;
  });

  it('inverts the stone palette variables appropriately in light mode vs dark mode', () => {
    // In dark mode: 950 is canvas background (darkest), 100 is primary text (lightest)
    expect(DARK_STONE_PALETTE['950']).toBe('12 10 9');
    expect(DARK_STONE_PALETTE['100']).toBe('245 245 244');

    // In light mode: 950 is canvas background (near-white / crisp paper), 100 is primary text (deep readable stone)
    expect(LIGHT_STONE_PALETTE['950']).toBe('245 245 244');
    expect(LIGHT_STONE_PALETTE['900']).toBe('255 255 255');
    expect(LIGHT_STONE_PALETTE['800']).toBe('236 234 232');
    expect(LIGHT_STONE_PALETTE['100']).toBe('28 25 23');
    expect(LIGHT_STONE_PALETTE['50']).toBe('12 10 9');

    // Verify dark surfaces and borders invert to crisp light surfaces and distinct borders
    expect(LIGHT_STONE_PALETTE['800']).not.toBe(DARK_STONE_PALETTE['800']);
  });

  it('retrieves stored theme mode from localStorage when present', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(getStoredThemeMode()).toBe('light');

    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(getStoredThemeMode()).toBe('dark');
  });

  it('falls back to default mode when no stored theme is present', () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    const mode = getStoredThemeMode();
    expect(['dark', 'light']).toContain(mode);
  });

  it('applies light mode to document element with CSS variables and class attributes', () => {
    applyThemeModeToDocument('light');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Stone variables should match LIGHT_STONE_PALETTE
    const stone950 = document.documentElement.style.getPropertyValue('--theme-stone-950');
    expect(stone950).toBe(LIGHT_STONE_PALETTE['950']);

    const stone100 = document.documentElement.style.getPropertyValue('--theme-stone-100');
    expect(stone100).toBe(LIGHT_STONE_PALETTE['100']);

    const ambientBg = document.documentElement.style.getPropertyValue('--theme-ambient-bg');
    expect(ambientBg).toBe(LIGHT_THEME_TOKENS.ambientBg);

    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('applies dark mode to document element with CSS variables and class attributes', () => {
    applyThemeModeToDocument('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    const stone950 = document.documentElement.style.getPropertyValue('--theme-stone-950');
    expect(stone950).toBe(DARK_STONE_PALETTE['950']);

    const stone100 = document.documentElement.style.getPropertyValue('--theme-stone-100');
    expect(stone100).toBe(DARK_STONE_PALETTE['100']);

    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('toggles seamlessly between light and dark modes', () => {
    applyThemeModeToDocument('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--theme-stone-950')).toBe(LIGHT_STONE_PALETTE['950']);

    applyThemeModeToDocument('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--theme-stone-950')).toBe(DARK_STONE_PALETTE['950']);
  });
});
