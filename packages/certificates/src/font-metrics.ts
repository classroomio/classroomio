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

interface GraphemeSegment {
  segment: string;
}

interface GraphemeSegmenter {
  segment(input: string): Iterable<GraphemeSegment>;
}

const graphemeSegmenter: GraphemeSegmenter | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new (
        Intl as unknown as {
          Segmenter: new (locales?: string | string[], options?: { granularity: string }) => GraphemeSegmenter;
        }
      ).Segmenter(undefined, { granularity: 'grapheme' })
    : null;

function splitGraphemes(text: string): string[] {
  if (!text) return [];
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function getCharAdvanceRatio(char: string, profile: FontAdvanceProfile): number {
  const codePoint = char.codePointAt(0) ?? 0;
  if (codePoint > 127) {
    // Non-ASCII characters (e.g. CJK ideographs, fullwidth symbols, emojis) are rendered via fallback
    // fonts where characters typically occupy ~1.0em (square em-box).
    return Math.max(profile.defaultRatio, 1.0);
  }

  if (profile.isMonospace) return profile.defaultRatio;
  if (char === ' ') return profile.space;
  if (WIDE_CHARS.has(char)) return profile.wide;
  if (NARROW_CHARS.has(char)) return profile.narrow;
  if (char >= 'A' && char <= 'Z') return profile.capsStandard;
  if (char >= 'a' && char <= 'z') return profile.lowerStandard;
  if (char >= '0' && char <= '9') return profile.digitStandard;

  return profile.defaultRatio;
}

function measureTextWidth(
  text: string,
  fontSize: number,
  profile: FontAdvanceProfile,
  letterSpacingEm = 0,
  advanceMultiplier = 1.0
): number {
  if (!text) return 0;

  const chars = splitGraphemes(text);
  if (chars.length === 0) return 0;

  let total = 0;
  for (const char of chars) {
    total += getCharAdvanceRatio(char, profile) * advanceMultiplier * fontSize;
  }

  const trackingPerGap = letterSpacingEm * fontSize;
  const totalTracking = Math.max(0, chars.length - 1) * trackingPerGap;

  return total + totalTracking;
}

export interface FitFontSizeOptions {
  maxWidth: number;
  maxHeight: number;
  fontFamily: CertificateFontFamily;
  basePx: number;
  minPx?: number;
  lineHeight?: number;
  allowWrap?: boolean;
  letterSpacingEm?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  fontWeight?: number | 'normal' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
}

function getWeightAdvanceMultiplier(fontWeight?: number | string): number {
  if (!fontWeight) return 1.0;
  if (fontWeight === 'black' || (typeof fontWeight === 'number' && fontWeight >= 900)) {
    return 1.3;
  }
  if (fontWeight === 'bold' || (typeof fontWeight === 'number' && fontWeight >= 700)) {
    return 1.12;
  }
  if (typeof fontWeight === 'number' && fontWeight >= 600) {
    return 1.06;
  }
  return 1.0;
}

function getStyleAdvanceMultiplier(fontStyle?: string): number {
  if (fontStyle === 'italic') return 1.1;
  return 1.0;
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
  const letterSpacingEm = options.letterSpacingEm ?? 0;
  const profile = FONT_PROFILES[options.fontFamily] ?? FONT_PROFILES['Cormorant Garamond'];
  const advanceMultiplier =
    getWeightAdvanceMultiplier(options.fontWeight) * getStyleAdvanceMultiplier(options.fontStyle);

  const cacheKey = `${transformedText}|${options.fontFamily}|${options.maxWidth}|${options.maxHeight}|${basePx}|${minPx}|${lineHeight}|${allowWrap}|${letterSpacingEm}|${options.fontWeight}|${options.fontStyle}`;
  const cached = FIT_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  function doesFit(fontSize: number): boolean {
    const descenderSlack = lineHeight < 1.25 ? Math.ceil(fontSize * (1.25 - lineHeight)) : 0;

    if (!allowWrap) {
      const singleLineWidth = measureTextWidth(transformedText, fontSize, profile, letterSpacingEm, advanceMultiplier);
      const singleLineHeight = fontSize * lineHeight + descenderSlack;
      return singleLineWidth <= options.maxWidth && singleLineHeight <= options.maxHeight;
    }

    // Multi-line word-wrapping simulation
    const words = transformedText.split(/\s+/);
    let currentLineWidth = 0;
    let lineCount = 1;
    const trackingPerGap = letterSpacingEm * fontSize;
    const spaceWidth = measureTextWidth(' ', fontSize, profile, letterSpacingEm, advanceMultiplier);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWidth = measureTextWidth(word, fontSize, profile, letterSpacingEm, advanceMultiplier);

      if (currentLineWidth > 0) {
        // Between words on the same line, account for tracking gaps around the space
        const effectiveSpaceWidth = spaceWidth + 2 * trackingPerGap;
        if (currentLineWidth + effectiveSpaceWidth + wordWidth <= options.maxWidth) {
          currentLineWidth += effectiveSpaceWidth + wordWidth;
          continue;
        }

        lineCount += 1;
        currentLineWidth = 0;
      }

      if (wordWidth <= options.maxWidth) {
        currentLineWidth = wordWidth;
      } else {
        // Character-level wrapping simulation for long breakable words (overflow-wrap: break-word)
        const chars = splitGraphemes(word);
        let charLineWidth = 0;
        for (let j = 0; j < chars.length; j++) {
          const char = chars[j];
          const charAdvance = getCharAdvanceRatio(char, profile) * advanceMultiplier * fontSize;
          const charGap = charLineWidth > 0 ? trackingPerGap : 0;
          if (charLineWidth > 0 && charLineWidth + charGap + charAdvance > options.maxWidth) {
            lineCount += 1;
            charLineWidth = charAdvance;
          } else {
            charLineWidth += charGap + charAdvance;
          }
        }
        currentLineWidth = charLineWidth;
      }
    }

    const totalHeight = lineCount * fontSize * lineHeight + descenderSlack;
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

  if (!doesFit(minPx)) {
    // If even minPx does not fit, search downwards to 0 so we always return a fit-safe size
    low = 0;
    high = minPx;
    best = 0;
  }

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
