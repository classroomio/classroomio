import { z } from 'zod';

export const MAX_SYNC_INTENTS = 200;

export const ZCourseOfflineParam = z.object({
  courseId: z.string().uuid()
});
export type TCourseOfflineParam = z.infer<typeof ZCourseOfflineParam>;

export const ZCourseOfflineManifestQuery = z.object({
  lessonId: z.string().uuid().optional()
});
export type TCourseOfflineManifestQuery = z.infer<typeof ZCourseOfflineManifestQuery>;

const ZSyncIntentBase = z.object({
  key: z.string().trim().min(8).max(128),
  lessonId: z.string().uuid(),
  recordedAt: z.string().datetime()
});

export const ZLessonCompleteIntent = ZSyncIntentBase.extend({
  type: z.literal('lesson.complete')
});
export type TLessonCompleteIntent = z.infer<typeof ZLessonCompleteIntent>;

export const ZPlaybackPositionIntent = ZSyncIntentBase.extend({
  type: z.literal('playback.position'),
  assetId: z.string().min(1),
  positionSeconds: z.number().min(0),
  playedDeltaSeconds: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.number().min(0).max(120)),
  durationSeconds: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.int().min(1))
});
export type TPlaybackPositionIntent = z.infer<typeof ZPlaybackPositionIntent>;

export const ZSyncIntent = z.discriminatedUnion('type', [ZLessonCompleteIntent, ZPlaybackPositionIntent]);
export type TSyncIntent = z.infer<typeof ZSyncIntent>;

export const ZCourseSyncRequest = z.object({
  intents: z.array(ZSyncIntent).min(1).max(MAX_SYNC_INTENTS)
});
export type TCourseSyncRequest = z.infer<typeof ZCourseSyncRequest>;

export const ZOfflineVideoQuery = z.object({
  t: z.string().min(1),
  rendition: z
    .string()
    .regex(/^[a-z0-9_-]{1,32}$/i)
    .optional()
});
export type TOfflineVideoQuery = z.infer<typeof ZOfflineVideoQuery>;
