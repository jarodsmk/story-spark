import { CoverTheme, TailwindPaletteSteps } from '../../types/index.ts';

// Default StorySpark warm amber theme RGB values
export const DEFAULT_STORYSPARK_PALETTE_RGB: Record<TailwindPaletteSteps, string> = {
  50: '255 251 235',
  100: '254 243 199',
  200: '253 230 138',
  300: '252 211 77',
  400: '251 191 36',
  500: '245 158 11',
  600: '217 119 6',
  700: '180 83 9',
  800: '146 64 14',
  900: '120 53 15',
  950: '69 26 3',
};

export const DEFAULT_STORYSPARK_PALETTE_HEX: Record<TailwindPaletteSteps, string> = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

export const DEFAULT_STORYSPARK_THEME: CoverTheme = {
  primaryHex: '#f59e0b',
  secondaryHex: '#cca980',
  accentHex: '#fbbf24',
  ambientBgHex: '#1c1917',
  paletteRgb: DEFAULT_STORYSPARK_PALETTE_RGB,
  paletteHex: DEFAULT_STORYSPARK_PALETTE_HEX,
  prominentColors: ['#f59e0b', '#fbbf24', '#d97706', '#cca980', '#1c1917'],
  isMonochrome: false,
};

/**
 * Converts RGB [0-255] to HSL [0-360, 0-1, 0-1]
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

/**
 * Converts HSL [0-360, 0-1, 0-1] to RGB [0-255]
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Converts RGB to 6-character hex code
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ColorBucket {
  h: number;
  s: number;
  l: number;
  count: number;
  rSum: number;
  gSum: number;
  bSum: number;
  avgR: number;
  avgG: number;
  avgB: number;
  score: number;
}

/**
 * Extracts prominent colors from an HTMLImageElement using canvas analysis
 */
export function extractPaletteFromImage(img: HTMLImageElement): CoverTheme {
  const width = Math.max(30, Math.min(img.naturalWidth || img.width || 80, 80));
  const height = Math.max(45, Math.min(img.naturalHeight || img.height || 120, 120));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return DEFAULT_STORYSPARK_THEME;
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Bucketing parameters
  // 36 hue bins (10 deg each) x 3 saturation bins x 3 lightness bins = 324 buckets
  const buckets: Map<string, ColorBucket> = new Map();
  let maxSaturationFound = 0;
  let totalValidPixels = 0;
  let overallR = 0;
  let overallG = 0;
  let overallB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const [h, s, l] = rgbToHsl(r, g, b);
    if (s > maxSaturationFound) {
      maxSaturationFound = s;
    }

    overallR += r;
    overallG += g;
    overallB += b;
    totalValidPixels++;

    // Filter out extreme near-black or extreme blown-out near-white when finding prominent colors
    if (l < 0.08 || l > 0.94) continue;

    // Quantize
    const hueBin = Math.floor(h / 10);
    const satBin = Math.min(2, Math.floor(s * 3));
    const litBin = Math.min(2, Math.floor((l - 0.08) / 0.28));
    const key = `${hueBin}_${satBin}_${litBin}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        h,
        s,
        l,
        count: 0,
        rSum: 0,
        gSum: 0,
        bSum: 0,
        avgR: 0,
        avgG: 0,
        avgB: 0,
        score: 0,
      };
      buckets.set(key, bucket);
    }

    bucket.count++;
    bucket.rSum += r;
    bucket.gSum += g;
    bucket.bSum += b;
  }

  if (buckets.size === 0 || totalValidPixels === 0) {
    return DEFAULT_STORYSPARK_THEME;
  }

  // Calculate averages and scores
  const bucketList: ColorBucket[] = [];
  buckets.forEach((b) => {
    b.avgR = Math.round(b.rSum / b.count);
    b.avgG = Math.round(b.gSum / b.count);
    b.avgB = Math.round(b.bSum / b.count);
    const [h, s, l] = rgbToHsl(b.avgR, b.avgG, b.avgB);
    b.h = h;
    b.s = s;
    b.l = l;

    // Score function balances frequency, saturation, and pleasant lightness (not too dark, not washed out)
    // S-weighting makes colorful elements stand out even if majority is dark/muted background
    const frequencyWeight = Math.min(b.count / (totalValidPixels * 0.2), 1.0);
    const saturationWeight = Math.pow(Math.max(0.15, s), 1.3);
    const lightnessWeight = 1 - Math.abs(l - 0.52) * 1.3;
    b.score = frequencyWeight * 0.35 + saturationWeight * 0.45 + Math.max(0, lightnessWeight) * 0.20;

    bucketList.push(b);
  });

  // Sort by score descending
  bucketList.sort((a, b) => b.score - a.score);

  // Detect if monochrome/noir artwork (very low saturation throughout)
  const isMonochrome = maxSaturationFound < 0.14;

  let primaryH = 38; // fallback to amber
  let primaryS = 0.85;

  if (isMonochrome) {
    // Sleek cool platinum/slate monochrome theme
    primaryH = 215;
    primaryS = 0.12;
  } else if (bucketList.length > 0) {
    primaryH = bucketList[0].h;
    // Boost saturation slightly if below 0.5 for a crisp UI accent, but keep natural feel
    primaryS = Math.min(0.92, Math.max(0.55, bucketList[0].s * 1.15));
  }

  // Secondary prominent color: find candidate with different hue
  let secondaryH = (primaryH + 40) % 360;
  let secondaryS = primaryS * 0.85;
  for (let i = 1; i < bucketList.length; i++) {
    const diff = Math.abs(bucketList[i].h - primaryH);
    const hueDistance = Math.min(diff, 360 - diff);
    if (hueDistance >= 30 && bucketList[i].s > 0.2) {
      secondaryH = bucketList[i].h;
      secondaryS = Math.min(0.9, Math.max(0.4, bucketList[i].s));
      break;
    }
  }

  // Build prominent colors list for preview swatches
  const prominentColors: string[] = [];
  const addedHexes = new Set<string>();

  for (const b of bucketList) {
    const hex = rgbToHex(b.avgR, b.avgG, b.avgB);
    if (!addedHexes.has(hex)) {
      addedHexes.add(hex);
      prominentColors.push(hex);
      if (prominentColors.length >= 5) break;
    }
  }

  // If less than 5 prominent colors found, supplement with generated hues
  if (prominentColors.length < 5) {
    const [pr, pg, pb] = hslToRgb(primaryH, primaryS, 0.5);
    const [sr, sg, sb] = hslToRgb(secondaryH, secondaryS, 0.55);
    const [ar, ag, ab] = hslToRgb(primaryH, primaryS, 0.65);
    [rgbToHex(pr, pg, pb), rgbToHex(sr, sg, sb), rgbToHex(ar, ag, ab)].forEach((h) => {
      if (!addedHexes.has(h)) {
        addedHexes.add(h);
        prominentColors.push(h);
      }
    });
  }

  // Generate complete Tailwind 50-950 scale from the prominent primary color
  const paletteRgb: Record<TailwindPaletteSteps, string> = {} as any;
  const paletteHex: Record<TailwindPaletteSteps, string> = {} as any;

  // Mathematically calibrated lightness and saturation curve matching modern design systems
  const scaleConfig: Record<TailwindPaletteSteps, { l: number; sMult: number }> = {
    50: { l: 0.97, sMult: 0.35 },
    100: { l: 0.93, sMult: 0.45 },
    200: { l: 0.85, sMult: 0.60 },
    300: { l: 0.74, sMult: 0.75 },
    400: { l: 0.62, sMult: 0.95 }, // Bright vibrant accent for dark mode text & icons
    500: { l: 0.50, sMult: 1.00 }, // Main primary brand color
    600: { l: 0.42, sMult: 1.05 }, // Rich button fill & hover state
    700: { l: 0.33, sMult: 0.95 }, // Deep accent for borders
    800: { l: 0.24, sMult: 0.85 }, // Deep tone
    900: { l: 0.16, sMult: 0.75 }, // Shadow tone
    950: { l: 0.09, sMult: 0.70 }, // Ambient deep background tone
  };

  (Object.keys(scaleConfig) as unknown as TailwindPaletteSteps[]).forEach((step) => {
    const conf = scaleConfig[step];
    const s = Math.min(1, primaryS * conf.sMult);
    const [r, g, b] = hslToRgb(primaryH, s, conf.l);
    paletteRgb[step] = `${r} ${g} ${b}`;
    paletteHex[step] = rgbToHex(r, g, b);
  });

  const [pr, pg, pb] = hslToRgb(primaryH, primaryS, 0.50);
  const [sr, sg, sb] = hslToRgb(secondaryH, secondaryS, 0.55);
  const [ar, ag, ab] = hslToRgb(primaryH, primaryS, 0.63);

  // Atmospheric dark ambient background tint (subtle 5-8% hue blended with dark charcoal)
  const [bgR, bgG, bgB] = hslToRgb(primaryH, Math.min(primaryS, 0.3), 0.08);

  return {
    primaryHex: rgbToHex(pr, pg, pb),
    secondaryHex: rgbToHex(sr, sg, sb),
    accentHex: rgbToHex(ar, ag, ab),
    ambientBgHex: rgbToHex(bgR, bgG, bgB),
    paletteRgb,
    paletteHex,
    prominentColors,
    isMonochrome,
  };
}

/**
 * Loads image and extracts theme asynchronously
 */
export function extractCoverTheme(imageSrc?: string): Promise<CoverTheme> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(DEFAULT_STORYSPARK_THEME);
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(DEFAULT_STORYSPARK_THEME);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const theme = extractPaletteFromImage(img);
        resolve(theme);
      } catch (err) {
        console.warn('Cover theme extraction failed, using fallback:', err);
        resolve(DEFAULT_STORYSPARK_THEME);
      }
    };

    img.onerror = (err) => {
      console.warn('Cover image failed to load for theme extraction:', err);
      resolve(DEFAULT_STORYSPARK_THEME);
    };

    img.src = imageSrc;
  });
}

/**
 * Applies the cover theme to the document via CSS custom properties.
 * If theme is null, removes custom properties to restore default StorySpark styling.
 */
export function applyThemeToDocument(theme: CoverTheme | null, isLightMode?: boolean): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const steps: TailwindPaletteSteps[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  if (!theme) {
    // Reset all theme CSS variables back to Tailwind defaults
    steps.forEach((step) => {
      root.style.removeProperty(`--theme-amber-${step}`);
    });
    root.style.removeProperty('--theme-primary-hex');
    root.style.removeProperty('--theme-secondary-hex');
    root.style.removeProperty('--theme-accent-hex');
    root.style.removeProperty('--theme-ambient-bg');
    root.style.removeProperty('--theme-ambient-glow');
    root.style.removeProperty('--theme-ambient-subtle');
    root.style.removeProperty('--theme-border-accent');
    root.style.removeProperty('--theme-selection-bg');
    delete root.dataset.novelThemeActive;
    return;
  }

  // Set Tailwind palette replacement variables
  steps.forEach((step) => {
    root.style.setProperty(`--theme-amber-${step}`, theme.paletteRgb[step]);
  });

  const effectiveLightMode = isLightMode !== undefined ? isLightMode : root.dataset.theme === 'light';

  // Additional atmospheric design tokens
  root.style.setProperty('--theme-primary-hex', theme.primaryHex);
  root.style.setProperty('--theme-secondary-hex', theme.secondaryHex);
  root.style.setProperty('--theme-accent-hex', theme.accentHex);
  root.style.setProperty('--theme-ambient-bg', effectiveLightMode ? '#fafaf9' : theme.ambientBgHex);
  root.style.setProperty('--theme-selection-bg', theme.paletteHex[600]);
  root.style.setProperty(
    '--theme-ambient-glow',
    effectiveLightMode
      ? `radial-gradient(circle at 50% -10%, rgba(${theme.paletteRgb[500]}, 0.08) 0%, transparent 65%)`
      : `radial-gradient(circle at 50% -10%, rgba(${theme.paletteRgb[500]}, 0.14) 0%, transparent 65%)`
  );
  root.style.setProperty(
    '--theme-ambient-subtle',
    effectiveLightMode
      ? `rgba(${theme.paletteRgb[500]}, 0.04)`
      : `rgba(${theme.paletteRgb[500]}, 0.08)`
  );
  root.style.setProperty(
    '--theme-border-accent',
    effectiveLightMode
      ? `rgba(${theme.paletteRgb[500]}, 0.45)`
      : `rgba(${theme.paletteRgb[500]}, 0.35)`
  );

  root.dataset.novelThemeActive = 'true';
}
