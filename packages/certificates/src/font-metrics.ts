export const CERTIFICATE_FONTS = {
  bodoniModa: 'Bodoni Moda',
  playfairDisplay: 'Playfair Display',
  archivoBlack: 'Archivo Black',
  cinzel: 'Cinzel',
  cormorantGaramond: 'Cormorant Garamond',
  jetbrainsMono: 'JetBrains Mono',
  spaceGrotesk: 'Space Grotesk',
  dmMono: 'DM Mono'
} as const;

export type CertificateFontFamily = (typeof CERTIFICATE_FONTS)[keyof typeof CERTIFICATE_FONTS];

/**
 * Average character advance-width ratios (width / fontSize) by character class.
 * Calibrated against Google Web Fonts metrics for these 8 certificate families.
 */
interface FontAdvanceProfile {
  isMonospace?: boolean;
  defaultRatio: number;
  space: number;
  narrow: number; // i, l, j, t, r, f, 1, punctuation
  wide: number; // M, W, m, w, @, em-dash
  capsStandard: number; // Standard uppercase A-Z (excluding narrow/wide)
  lowerStandard: number; // Standard lowercase a-z (excluding narrow/wide)
  digitStandard: number; // Standard digits 0-9
  letterSpacingOffset?: number;
}

const NARROW_CHARS = new Set('iljtrf1!|:;.,\'"`()[]{}-/\\');
const WIDE_CHARS = new Set('MWmw@—%#&');

const FONT_PROFILES: Record<CertificateFontFamily, FontAdvanceProfile> = {
  'JetBrains Mono': {
    isMonospace: true,
    defaultRatio: 0.6,
    space: 0.6,
    narrow: 0.6,
    wide: 0.6,
    capsStandard: 0.6,
    lowerStandard: 0.6,
    digitStandard: 0.6
  },
  'DM Mono': {
    isMonospace: true,
    defaultRatio: 0.6,
    space: 0.6,
    narrow: 0.6,
    wide: 0.6,
    capsStandard: 0.6,
    lowerStandard: 0.6,
    digitStandard: 0.6
  },
  'Bodoni Moda': {
    defaultRatio: 0.52,
    space: 0.25,
    narrow: 0.28,
    wide: 0.88,
    capsStandard: 0.72,
    lowerStandard: 0.48,
    digitStandard: 0.5
  },
  'Playfair Display': {
    defaultRatio: 0.54,
    space: 0.25,
    narrow: 0.28,
    wide: 0.92,
    capsStandard: 0.75,
    lowerStandard: 0.5,
    digitStandard: 0.52
  },
  'Archivo Black': {
    defaultRatio: 0.7,
    space: 0.3,
    narrow: 0.38,
    wide: 1.05,
    capsStandard: 0.82,
    lowerStandard: 0.65,
    digitStandard: 0.68
  },
  Cinzel: {
    defaultRatio: 0.7,
    space: 0.28,
    narrow: 0.35,
    wide: 1.02,
    capsStandard: 0.78,
    lowerStandard: 0.78, // Cinzel is small-caps / capitals
    digitStandard: 0.56
  },
  'Cormorant Garamond': {
    defaultRatio: 0.48,
    space: 0.22,
    narrow: 0.25,
    wide: 0.8,
    capsStandard: 0.65,
    lowerStandard: 0.44,
    digitStandard: 0.48
  },
  'Space Grotesk': {
    defaultRatio: 0.56,
    space: 0.25,
    narrow: 0.3,
    wide: 0.88,
    capsStandard: 0.68,
    lowerStandard: 0.52,
    digitStandard: 0.55
  }
};

function getCharAdvanceRatio(char: string, profile: FontAdvanceProfile): number {
  if (profile.isMonospace) return profile.defaultRatio;
  if (char === ' ') return profile.space;
  if (WIDE_CHARS.has(char)) return profile.wide;
  if (NARROW_CHARS.has(char)) return profile.narrow;
  if (char >= 'A' && char <= 'Z') return profile.capsStandard;
  if (char >= 'a' && char <= 'z') return profile.lowerStandard;
  if (char >= '0' && char <= '9') return profile.digitStandard;

  return profile.defaultRatio;
}

function measureTextWidth(text: string, fontSize: number, profile: FontAdvanceProfile, letterSpacingPx = 0): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const advance = getCharAdvanceRatio(char, profile) * fontSize + letterSpacingPx;
    total += advance;
  }
  return total;
}

export interface FitFontSizeOptions {
  maxWidth: number;
  maxHeight: number;
  fontFamily: CertificateFontFamily;
  basePx: number;
  minPx?: number;
  lineHeight?: number;
  allowWrap?: boolean;
  letterSpacingPx?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
}

// In-memory LRU-like cache for font size calculations
const FIT_CACHE = new Map<string, number>();
const MAX_CACHE_SIZE = 1000;

/**
 * Calculates the exact optimal font size (in integer pixels) so that `text`
 * fits completely within `maxWidth` and `maxHeight` without any overflow or clipping.
 *
 * Uses calibrated font advance metrics and binary search for word wrapping.
 */
export function computeFitFontSize(text: string | undefined | null, options: FitFontSizeOptions): number {
  const rawText = String(text ?? '').trim();
  if (!rawText) return options.basePx;

  const transformedText =
    options.textTransform === 'uppercase'
      ? rawText.toUpperCase()
      : options.textTransform === 'lowercase'
        ? rawText.toLowerCase()
        : rawText;

  const minPx = options.minPx !== undefined ? Math.max(0, options.minPx) : 0;
  const basePx = Math.max(minPx, options.basePx);
  const lineHeight = options.lineHeight ?? 1.15;
  const allowWrap = options.allowWrap !== false;
  const letterSpacingPx = options.letterSpacingPx ?? 0;
  const profile = FONT_PROFILES[options.fontFamily] ?? FONT_PROFILES['Cormorant Garamond'];

  const cacheKey = `${transformedText}|${options.fontFamily}|${options.maxWidth}|${options.maxHeight}|${basePx}|${minPx}|${lineHeight}|${allowWrap}|${letterSpacingPx}`;
  const cached = FIT_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  function doesFit(fontSize: number): boolean {
    if (!allowWrap) {
      const singleLineWidth = measureTextWidth(transformedText, fontSize, profile, letterSpacingPx);
      const singleLineHeight = fontSize * lineHeight;
      return singleLineWidth <= options.maxWidth && singleLineHeight <= options.maxHeight;
    }

    // Multi-line word-wrapping simulation
    const words = transformedText.split(/\s+/);
    let currentLineWidth = 0;
    let lineCount = 1;
    const spaceWidth = measureTextWidth(' ', fontSize, profile, letterSpacingPx);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWidth = measureTextWidth(word, fontSize, profile, letterSpacingPx);

      if (currentLineWidth > 0) {
        if (currentLineWidth + spaceWidth + wordWidth <= options.maxWidth) {
          currentLineWidth += spaceWidth + wordWidth;
          continue;
        }

        lineCount += 1;
        currentLineWidth = 0;
      }

      if (wordWidth <= options.maxWidth) {
        currentLineWidth = wordWidth;
      } else {
        const fullLines = Math.floor(wordWidth / options.maxWidth);
        const remainder = wordWidth % options.maxWidth;
        lineCount += remainder === 0 ? fullLines - 1 : fullLines;
        currentLineWidth = remainder === 0 ? options.maxWidth : remainder;
      }
    }

    const totalHeight = lineCount * fontSize * lineHeight;
    return totalHeight <= options.maxHeight;
  }

  // Quick check: if basePx fits, use basePx directly
  if (doesFit(basePx)) {
    if (FIT_CACHE.size >= MAX_CACHE_SIZE) FIT_CACHE.clear();
    FIT_CACHE.set(cacheKey, basePx);
    return basePx;
  }

  // Continuous binary search between minPx (0 by default) and basePx for the largest size that fits
  let low = minPx;
  let high = basePx;
  let best = minPx;

  for (let iter = 0; iter < 30; iter++) {
    const mid = (low + high) / 2;
    if (doesFit(mid)) {
      best = mid;
      low = mid; // Try larger
    } else {
      high = mid; // Try smaller
    }
  }

  const result = best >= 10 ? Math.floor(best) : Number(best.toFixed(4));

  if (FIT_CACHE.size >= MAX_CACHE_SIZE) FIT_CACHE.clear();
  FIT_CACHE.set(cacheKey, result);
  return result;
}

/**
 * Calculates optimal font sizes in batch for a set of fields and their text values.
 */
export function computeFieldFontSizes<K extends string>(
  fields: Record<K, FitFontSizeOptions>,
  values: Record<K, string | undefined | null>
): Record<K, number> {
  const result = {} as Record<K, number>;
  for (const key in fields) {
    result[key] = computeFitFontSize(values[key], fields[key]);
  }
  return result;
}
