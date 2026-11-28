import * as z from 'zod';

import { defineBlock } from '../definition';

export const HTML_PAGE_MAX_BYTES = 2_000_000;
export const HTML_BLOCK_NAME_MAX_LENGTH = 200;
export const HTML_PAGE_PROMPT_MAX_LENGTH = 4000;
export const HTML_BLOCK_MIN_WIDTH = 30;
export const HTML_BLOCK_MAX_WIDTH = 100;
export const HTML_BLOCK_MIN_HEIGHT = 160;
export const HTML_BLOCK_MAX_HEIGHT = 2000;

/** A stored HTML page: the page itself lives in object storage as an asset. */
export const ZHtmlPage = z.object({
  name: z.string().max(HTML_BLOCK_NAME_MAX_LENGTH),
  assetId: z.uuid(),
  size: z.number().int().min(1).max(HTML_PAGE_MAX_BYTES)
});
export type THtmlPage = z.infer<typeof ZHtmlPage>;

export const ZHtmlBlockData = ZHtmlPage.extend({
  width: z.number().int().min(HTML_BLOCK_MIN_WIDTH).max(HTML_BLOCK_MAX_WIDTH).optional(),
  height: z.number().int().min(HTML_BLOCK_MIN_HEIGHT).max(HTML_BLOCK_MAX_HEIGHT).optional()
});
export type THtmlBlockData = z.infer<typeof ZHtmlBlockData>;

export const ZHtmlPageCreate = z.object({
  name: z.string().trim().min(1).max(HTML_BLOCK_NAME_MAX_LENGTH),
  html: z.string().min(1).max(HTML_PAGE_MAX_BYTES)
});
export type THtmlPageCreate = z.infer<typeof ZHtmlPageCreate>;

export const ZHtmlPageGenerate = z.object({
  prompt: z.string().trim().min(1).max(HTML_PAGE_PROMPT_MAX_LENGTH),
  assetId: z.uuid().optional()
});
export type THtmlPageGenerate = z.infer<typeof ZHtmlPageGenerate>;

export const htmlBlock = defineBlock({
  key: 'html',
  dataSchema: ZHtmlBlockData,
  localizedContent: false,
  media: 'html',
  toPublicData: (data) => data,
  agentEditableFields: ['name']
});
