import * as z from 'zod';

import { defineBlock } from '../definition';

export const ZDocumentBlockData = z.object({
  type: z.string(),
  name: z.string(),
  link: z.string(),
  size: z.number().optional(),
  key: z.string(),
  assetId: z.uuid().optional()
});
export type TDocumentBlockData = z.infer<typeof ZDocumentBlockData>;

export const documentBlock = defineBlock({
  key: 'document',
  dataSchema: ZDocumentBlockData,
  localizedContent: false,
  media: 'document',
  toPublicData: null
});
