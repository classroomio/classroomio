import type { LandingPageFontFamily, LandingPageTheme } from './types';
import { MODERN_DOCUMENT } from './templates/modern';

export const DEFAULT_LANDING_PAGE_DOCUMENT = MODERN_DOCUMENT;

export const DEFAULT_THEME: LandingPageTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#3b82f6',
  backgroundColor: '#f8fafc',
  fontFamily: 'inter'
};

export const FONT_STACK_MAP: Record<LandingPageFontFamily, string> = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  roboto: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  outfit: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  playfair: "'Playfair Display', Georgia, Cambria, serif",
  'plus-jakarta-sans': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  'space-grotesk': "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
};

export const GOOGLE_FONTS_MAP: Record<LandingPageFontFamily, string | null> = {
  inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
  outfit: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap',
  playfair: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&display=swap',
  'plus-jakarta-sans':
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'space-grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
  system: null
};

export function getFontGoogleUrl(fontFamily: LandingPageFontFamily): string | undefined {
  return GOOGLE_FONTS_MAP[fontFamily] ?? undefined;
}
