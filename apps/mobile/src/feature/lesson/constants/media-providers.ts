import type { BrandMarkName } from '@/feature/brand/constants/brand-marks';
import type { EmbedProvider, SlidePlatform } from '@/feature/lesson/types/lesson';

type ProviderBrand = { name: string; mark: BrandMarkName | null };

export const EMBED_PROVIDERS: Record<EmbedProvider, ProviderBrand> = {
  youtube: { name: 'YouTube', mark: 'youtube' },
  vimeo: { name: 'Vimeo', mark: 'vimeo' },
  google_drive: { name: 'Google Drive', mark: 'googleDrive' },
  muse: { name: 'Muse', mark: null }
};

export const SLIDE_PLATFORMS: Record<SlidePlatform, ProviderBrand> = {
  'google-slides': { name: 'Google Slides', mark: 'googleSlides' },
  canva: { name: 'Canva', mark: null },
  powerpoint: { name: 'PowerPoint', mark: null },
  keynote: { name: 'Keynote', mark: null },
  figma: { name: 'Figma', mark: 'figma' },
  prezi: { name: 'Prezi', mark: 'prezi' },
  pitch: { name: 'Pitch', mark: null },
  gamma: { name: 'Gamma', mark: null },
  slideshare: { name: 'SlideShare', mark: 'slideshare' },
  beautiful: { name: 'Beautiful.ai', mark: null }
};
