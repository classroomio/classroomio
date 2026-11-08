import * as z from 'zod';

import { getSlidePlatformByHost, isAllowedSlideEmbedSrc, SLIDE_PLATFORM_IDS } from '../../../functions/slide-embed';
import { defineBlock } from '../definition';

export const ZSlidesBlockData = z
  .object({
    src: z
      .url()
      .refine((src) => isAllowedSlideEmbedSrc(src), { message: 'Slide embed source is not from a supported platform' }),
    platform: z.enum(SLIDE_PLATFORM_IDS)
  })
  .refine(
    (slide) => {
      try {
        const hostname = new URL(slide.src).hostname.replace(/^www\./i, '').toLowerCase();

        return getSlidePlatformByHost(hostname)?.id === slide.platform;
      } catch {
        return false;
      }
    },
    { message: 'Slide platform does not match embed source', path: ['platform'] }
  );
export type TSlidesBlockData = z.infer<typeof ZSlidesBlockData>;

export const slidesBlock = defineBlock({
  key: 'slides',
  dataSchema: ZSlidesBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => ({ src: data.src, platform: data.platform })
});
