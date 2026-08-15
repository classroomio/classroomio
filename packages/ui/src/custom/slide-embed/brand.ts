import type { SlidePlatformId } from '@cio/utils/functions';

export type SlidePlatformBrand = {
  color: string;
  glyph: string;
};

export const SLIDE_PLATFORM_BRAND: Record<SlidePlatformId, SlidePlatformBrand> = {
  'google-slides': { color: '#F4B400', glyph: 'G' },
  canva: { color: '#00C4CC', glyph: 'C' },
  powerpoint: { color: '#D24726', glyph: 'P' },
  keynote: { color: '#0071E3', glyph: 'K' },
  figma: { color: '#F24E1E', glyph: 'F' },
  prezi: { color: '#3181FF', glyph: 'P' },
  pitch: { color: '#1A1A1A', glyph: '✦' },
  gamma: { color: '#7C3AED', glyph: 'G' },
  slideshare: { color: '#0077B5', glyph: 'S' },
  beautiful: { color: '#FF6B3D', glyph: 'b' }
};
