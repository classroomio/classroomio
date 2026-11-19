import * as z from 'zod';

import { defineBlock } from '../definition';

export const HTML_BLOCK_MAX_LENGTH = 500_000;
export const HTML_BLOCK_NAME_MAX_LENGTH = 200;
export const HTML_BLOCK_MIN_WIDTH = 30;
export const HTML_BLOCK_MAX_WIDTH = 100;
export const HTML_BLOCK_MIN_HEIGHT = 160;
export const HTML_BLOCK_MAX_HEIGHT = 2000;
export const HTML_BLOCK_DEFAULT_HEIGHT = 480;

export const ZHtmlBlockData = z.object({
  name: z.string().max(HTML_BLOCK_NAME_MAX_LENGTH),
  html: z.string().min(1).max(HTML_BLOCK_MAX_LENGTH),
  width: z.number().int().min(HTML_BLOCK_MIN_WIDTH).max(HTML_BLOCK_MAX_WIDTH).optional(),
  height: z.number().int().min(HTML_BLOCK_MIN_HEIGHT).max(HTML_BLOCK_MAX_HEIGHT).optional()
});
export type THtmlBlockData = z.infer<typeof ZHtmlBlockData>;

export const htmlBlock = defineBlock({
  key: 'html',
  dataSchema: ZHtmlBlockData,
  localizedContent: false,
  media: null,
  toPublicData: (data) => data,
  agentEditableFields: ['name']
});
