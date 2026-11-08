import * as z from 'zod';

import { defineBlock } from '../definition';

export const IMAGE_BLOCK_FITS = ['cover', 'contain'] as const;

export const ZImageBlockData = z.object({
  url: z.url(),
  alt: z.string().max(300).optional(),
  fit: z.enum(IMAGE_BLOCK_FITS).optional()
});
export type TImageBlockData = z.infer<typeof ZImageBlockData>;

export const imageBlock = defineBlock({
  key: 'image',
  dataSchema: ZImageBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data
});
