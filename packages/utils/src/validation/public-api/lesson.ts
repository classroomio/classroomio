import * as z from 'zod';

import { ZPublicApiCourseParam } from './course';

/**
 * A lesson video on the public API. An upload is referenced by `assetId` only —
 * the storage key never crosses this boundary — and external providers are
 * referenced by URL, which the browser fetches rather than the server.
 */
const ZPublicApiUploadVideo = z.object({
  type: z.literal('upload'),
  assetId: z.string().uuid().describe('From POST /assets, after its bytes have been uploaded.')
});

const ZPublicApiExternalVideo = z.object({
  type: z.enum(['youtube', 'vimeo', 'generic']),
  link: z.url().describe('Public URL. Embedded as-is; never fetched server-side.')
});

export const ZPublicApiLessonVideo = z.discriminatedUnion('type', [ZPublicApiUploadVideo, ZPublicApiExternalVideo]);
export type TPublicApiLessonVideo = z.infer<typeof ZPublicApiLessonVideo>;

export const ZPublicApiLessonParam = ZPublicApiCourseParam.extend({
  lessonId: z.string().uuid()
});
export type TPublicApiLessonParam = z.infer<typeof ZPublicApiLessonParam>;

export const ZPublicApiCreateLesson = z.object({
  title: z.string().min(1).max(255),
  sectionId: z.string().uuid().optional(),
  order: z.number().int().min(1),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  videos: z.array(ZPublicApiLessonVideo).max(20).optional()
});
export type TPublicApiCreateLesson = z.infer<typeof ZPublicApiCreateLesson>;

export const ZPublicApiUpdateLesson = z.object({
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().min(1).optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  videos: z
    .array(ZPublicApiLessonVideo)
    .max(20)
    .optional()
    .describe('Replaces the lesson videos entirely. Omit to leave them unchanged.')
});
export type TPublicApiUpdateLesson = z.infer<typeof ZPublicApiUpdateLesson>;

export const ZPublicApiLessonResponse = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().nullable(),
  order: z.number().nullable(),
  sectionId: z.string().nullable(),
  isUnlocked: z.boolean().nullable(),
  public: z.boolean().nullable(),
  videos: z
    .array(
      z.object({
        type: z.string(),
        assetId: z.string().optional(),
        link: z.string().optional()
      })
    )
    .nullable()
});
export type TPublicApiLessonResponse = z.infer<typeof ZPublicApiLessonResponse>;
