import type { TWidgetConfig, TWidgetThemePreset } from './widget';

/**
 * Display / editorial serif stack per theme preset (pairs with sans in {@link WIDGET_THEME_GOOGLE_FONT_FAMILIES}).
 */
export const WIDGET_THEME_SERIF_STACK: Record<TWidgetThemePreset, string> = {
  classroomio: "'Lora', Georgia, 'Times New Roman', serif",
  graphite: "'IBM Plex Serif', Georgia, 'Times New Roman', serif",
  linen: "'Libre Baskerville', Georgia, 'Times New Roman', serif",
  spruce: "'Fraunces', Georgia, 'Times New Roman', serif"
};

/** Google Font family names loaded for each widget theme (sans + serif used in layouts). */
export const WIDGET_THEME_GOOGLE_FONT_FAMILIES: Record<TWidgetThemePreset, readonly string[]> = {
  classroomio: ['DM Sans', 'Inter', 'Lora'],
  graphite: ['IBM Plex Sans', 'IBM Plex Serif', 'Inter'],
  linen: ['Source Sans 3', 'Libre Baskerville'],
  spruce: ['Plus Jakarta Sans', 'Fraunces']
};

/**
 * Normalize user-facing font names (from `typography.fontFamily`) to Google family names we can load.
 * Keys are lowercased trimmed strings from single- or double-quoted CSS family tokens.
 */
export const WIDGET_GOOGLE_FONT_CANONICAL_NAMES: Record<string, string> = {
  'dm sans': 'DM Sans',
  inter: 'Inter',
  lora: 'Lora',
  'ibm plex sans': 'IBM Plex Sans',
  'ibm plex serif': 'IBM Plex Serif',
  'source sans 3': 'Source Sans 3',
  'source sans3': 'Source Sans 3',
  'libre baskerville': 'Libre Baskerville',
  'plus jakarta sans': 'Plus Jakarta Sans',
  fraunces: 'Fraunces',
  manrope: 'Manrope',
  'nunito sans': 'Nunito Sans',
  'open sans': 'Open Sans',
  'work sans': 'Work Sans',
  outfit: 'Outfit',
  figtree: 'Figtree',
  'playfair display': 'Playfair Display',
  'space grotesk': 'Space Grotesk'
};

/** CSS2 `family=Name:…` axis fragment; defaults work for most variable fonts we use. */
const FONT_GOOGLE_AXIS: Record<string, string> = {
  'Libre Baskerville': 'wght@400;700',
  Lora: 'wght@400;600;700',
  Fraunces: 'wght@400;600;700'
};

const DEFAULT_AXIS = 'wght@400;500;600;700';

export function getWidgetThemeSerifStack(themePreset: TWidgetThemePreset): string {
  return WIDGET_THEME_SERIF_STACK[themePreset];
}

/** Extract quoted `font-family` names from a CSS font stack string. */
export function extractQuotedFontFamiliesFromStack(fontFamilyCss: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = /'([^']+)'|"([^"]+)"/g;
  while ((m = re.exec(fontFamilyCss)) !== null) {
    const name = (m[1] ?? m[2] ?? '').trim();
    if (name) out.push(name);
  }
  return out;
}

/** Resolve additional Google families declared in config.typography.fontFamily. */
export function collectCustomGoogleFontFamilies(fontFamilyCss: string): Set<string> {
  const set = new Set<string>();
  for (const raw of extractQuotedFontFamiliesFromStack(fontFamilyCss)) {
    const key = raw.trim().toLowerCase();
    const canonical = WIDGET_GOOGLE_FONT_CANONICAL_NAMES[key];
    if (canonical) set.add(canonical);
  }
  return set;
}

export function collectWidgetGoogleFontFamilies(design: TWidgetConfig): string[] {
  const set = new Set<string>(WIDGET_THEME_GOOGLE_FONT_FAMILIES[design.themePreset]);
  for (const f of collectCustomGoogleFontFamilies(design.typography.fontFamily)) {
    set.add(f);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function familyQueryParam(name: string): string {
  const axis = FONT_GOOGLE_AXIS[name] ?? DEFAULT_AXIS;
  const enc = encodeURIComponent(name);
  return `family=${enc}:${axis}`;
}

/**
 * Returns a Google Fonts CSS2 stylesheet URL for all families needed by the widget design, or `''` if none.
 */
export function buildWidgetGoogleFontsStylesheetHref(design: TWidgetConfig): string {
  const families = collectWidgetGoogleFontFamilies(design);
  if (families.length === 0) return '';
  const q = families.map(familyQueryParam).join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}
