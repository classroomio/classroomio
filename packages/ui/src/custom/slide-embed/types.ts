import type { SlideEmbed, SlidePlatformId } from '@cio/utils/functions';

export type { SlideEmbed, SlidePlatformId };

export type SlideEmbedPlatformCopy = {
  hint: string;
  steps: string[];
};

export type SlideEmbedPickerLabels = {
  searchPlaceholder: string;
  emptyPrompt: string;
  embedCodeLabel: string;
  embedCodePlaceholder: string;
  addEmbed: string;
  howToEmbed: string;
  previewLabel: string;
  embedReady: string;
  invalidEmbed: string;
  unsupportedPlatform: string;
  platforms: Record<SlidePlatformId, SlideEmbedPlatformCopy>;
};

export type SlideEmbedCardLabels = {
  remove: string;
  menuAria: string;
};
