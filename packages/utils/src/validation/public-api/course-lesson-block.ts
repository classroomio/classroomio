import * as z from 'zod';

import { ZBlockLocale, ZBlockType, ZSlidesBlockData } from '../block/block';
import { ZPublicApiCourseLessonParam } from './course-lesson';
import { ZPublicApiLessonVideo } from './lesson';

export const ZPublicApiLessonBlockParam = ZPublicApiCourseLessonParam.extend({
  blockId: z.string().uuid()
});
export type TPublicApiLessonBlockParam = z.infer<typeof ZPublicApiLessonBlockParam>;

export const ZPublicApiLessonBlockLocaleParam = ZPublicApiLessonBlockParam.extend({
  locale: ZBlockLocale
});
export type TPublicApiLessonBlockLocaleParam = z.infer<typeof ZPublicApiLessonBlockLocaleParam>;

export const ZPublicApiLessonPlacementParam = ZPublicApiCourseLessonParam.extend({
  placementId: z.string().uuid()
});
export type TPublicApiLessonPlacementParam = z.infer<typeof ZPublicApiLessonPlacementParam>;

const placementAnchor = {
  beforePlacementId: z
    .string()
    .uuid()
    .optional()
    .describe('Insert before this placement. Omit both anchors to append at the end of the lesson.'),
  afterPlacementId: z
    .string()
    .uuid()
    .optional()
    .describe('Insert after this placement. Not allowed with beforePlacementId.')
};

const placementSettings = {
  required: z
    .boolean()
    .optional()
    .describe('For a video block: learners must watch it to complete the lesson. Applies to this lesson only.'),
  watchThreshold: z
    .number()
    .int()
    .min(1)
    .max(100)
    .nullable()
    .optional()
    .describe('Percent of the video that counts as watched in this lesson; null uses the lesson default.')
};

export const ZPublicApiCreateLessonBlock = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('note'),
    content: z.string().optional().describe('Note HTML; sanitized on save.'),
    locale: ZBlockLocale.optional().describe('Language of content; defaults to en.'),
    ...placementAnchor
  }),
  z.object({
    type: z.literal('video'),
    video: ZPublicApiLessonVideo,
    ...placementAnchor,
    ...placementSettings
  }),
  z.object({
    type: z.literal('slides'),
    slides: ZSlidesBlockData.describe('A supported slide embed URL and its platform.'),
    ...placementAnchor
  })
]);
export type TPublicApiCreateLessonBlock = z.infer<typeof ZPublicApiCreateLessonBlock>;

export const ZPublicApiAttachLessonBlock = z.object({
  blockId: z.string().uuid().describe('A block already used elsewhere in the organization.'),
  ...placementAnchor,
  ...placementSettings
});
export type TPublicApiAttachLessonBlock = z.infer<typeof ZPublicApiAttachLessonBlock>;

export const ZPublicApiUpdateLessonBlock = z
  .object({
    expectedVersion: z.number().int().min(1).describe('The block version you last read; a stale value returns 409.'),
    video: ZPublicApiLessonVideo.optional().describe('New video source, for a video block.'),
    slides: ZSlidesBlockData.optional().describe('New slide embed, for a slides block.')
  })
  .describe('Updates a block everywhere it is used. Notes are saved per language with the locale endpoint.');
export type TPublicApiUpdateLessonBlock = z.infer<typeof ZPublicApiUpdateLessonBlock>;

export const ZPublicApiSetLessonBlockLocale = z.object({
  content: z.string().describe('Note HTML; sanitized on save.'),
  expectedVersion: z.number().int().min(1).describe('The block version you last read; a stale value returns 409.')
});
export type TPublicApiSetLessonBlockLocale = z.infer<typeof ZPublicApiSetLessonBlockLocale>;

export const ZPublicApiUpdateLessonPlacement = z.object(placementSettings);
export type TPublicApiUpdateLessonPlacement = z.infer<typeof ZPublicApiUpdateLessonPlacement>;

export const ZPublicApiMoveLessonPlacement = z.object({
  beforePlacementId: placementAnchor.beforePlacementId,
  afterPlacementId: placementAnchor.afterPlacementId
});
export type TPublicApiMoveLessonPlacement = z.infer<typeof ZPublicApiMoveLessonPlacement>;

export const ZPublicApiDuplicateLessonBlock = z.object({
  replacePlacementId: z
    .string()
    .uuid()
    .optional()
    .describe('Make this lesson use the copy instead of the shared block, leaving other lessons on the original.')
});
export type TPublicApiDuplicateLessonBlock = z.infer<typeof ZPublicApiDuplicateLessonBlock>;

export const ZPublicApiLessonBlockResponse = z.object({
  id: z.string().uuid().describe('Block id; shared by every lesson that reuses the block'),
  placementId: z.string().uuid().describe('This lesson’s use of the block'),
  lessonId: z.string().uuid(),
  type: ZBlockType,
  position: z.string().describe('Sort key; blocks are returned in order'),
  required: z.boolean(),
  watchThreshold: z.number().nullable(),
  version: z.number(),
  data: z.record(z.string(), z.unknown()).describe('Type-specific content. For notes, content is in `contents`.'),
  contents: z.record(z.string(), z.string().nullable()).describe('Note HTML by locale'),
  usageCount: z.number().describe('How many lessons use this block'),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ZPublicApiLessonBlockRemovedResponse = z.object({
  blockId: z.string().uuid(),
  blockDeleted: z.boolean().describe('False when other lessons still use the block')
});
