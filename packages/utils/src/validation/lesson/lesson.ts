import * as z from 'zod';

import { ALLOWED_CONTENT_TYPES } from '../constants';
import { getSlidePlatformByHost, isAllowedSlideEmbedSrc, SLIDE_PLATFORM_IDS } from '../../functions/slide-embed';
import { isAllowedHref } from '../shared/safe-href';
import { ZSlug } from '../shared/slug';

/** Uploaded videos are served through the HLS proxy as a root-relative path. */
const HLS_PROXY_PATH = /^\/hls\/[\w./-]+$/;

export const ZLessonVideoItem = z.object({
  type: z.enum(['youtube', 'vimeo', 'generic', 'upload', 'google_drive']),
  link: z.string().refine((value) => HLS_PROXY_PATH.test(value) || isAllowedHref(value), {
    message: 'Video link scheme is not allowed'
  }),
  key: z.string().optional(),
  assetId: z.string().uuid().optional(),
  watchEnforced: z.boolean().optional(),
  fileName: z.string().optional(),
  metadata: z
    .object({
      svid: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      duration: z.number().optional(),
      aspectRatio: z.string().optional(),
      createdAt: z.string().optional(),
      videoId: z.string().optional(),
      hash: z.string().optional()
    })
    .catchall(z.unknown())
    .optional()
});
export type TLessonVideoItem = z.infer<typeof ZLessonVideoItem>;

export const ZLessonSlide = z
  .object({
    id: z.string().min(1),
    src: z
      .url()
      .refine((src) => isAllowedSlideEmbedSrc(src), { message: 'Slide embed source is not from a supported platform' }),
    platform: z.enum(SLIDE_PLATFORM_IDS)
  })
  .refine(
    (slide) => {
      try {
        const hostname = new URL(slide.src).hostname.replace(/^www\./i, '').toLowerCase();
        const platform = getSlidePlatformByHost(hostname);

        return platform?.id === slide.platform;
      } catch {
        return false;
      }
    },
    { message: 'Slide platform does not match embed source', path: ['platform'] }
  );
export type TLessonSlide = z.infer<typeof ZLessonSlide>;

// Lesson Schemas
export const ZLessonCreate = z.object({
  title: z.string().min(1),
  note: z.string().optional(),
  courseId: z.string().min(1),
  sectionId: z.string().optional(),
  order: z.number().int().min(1),
  lessonAt: z.string().optional(),
  teacherId: z.string().optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  slug: ZSlug.optional(),
  videos: z.array(ZLessonVideoItem).optional()
});
export type TLessonCreate = z.infer<typeof ZLessonCreate>;

export const ZLessonUpdate = z.object({
  title: z.string().min(1).optional(),
  note: z.string().optional(),
  sectionId: z.string().optional(),
  order: z.number().int().min(1).optional(),
  callUrl: z.string().nullable().optional(),
  lessonAt: z.string().nullable().optional(),
  teacherId: z.string().optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  slug: ZSlug.optional(),
  isComplete: z.boolean().optional(),
  completionPolicy: z.enum(['manual', 'video_watch', 'none']).optional(),
  videoWatchThreshold: z.number().int().min(1).max(100).optional(),
  commentsEnabled: z.boolean().optional(),
  videoUrl: z.url().optional(),
  slideUrl: z.string().optional(),
  slides: z.array(ZLessonSlide).optional(),
  videos: z.array(ZLessonVideoItem).optional(),
  documents: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        link: z.string(),
        size: z.number().optional(),
        key: z.string(),
        assetId: z.string().uuid().optional()
      })
    )
    .optional()
});
export type TLessonUpdate = z.infer<typeof ZLessonUpdate>;

export const ZLessonGetParam = z.object({
  lessonId: z.string().min(1)
});
export type TLessonGetParam = z.infer<typeof ZLessonGetParam>;

/**
 * The playback URL is derived from `fileKey` server-side; a caller-supplied one
 * would be stored as the lesson video's link and is never trusted.
 */
export const ZAttachLessonVideo = z.object({
  fileKey: z
    .string()
    .min(1)
    .refine((value) => !value.includes('..') && !value.startsWith('/'), {
      message: 'fileKey is not a valid storage key'
    }),
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_CONTENT_TYPES),
  fileSize: z.number().int().min(0).optional()
});
export type TAttachLessonVideo = z.infer<typeof ZAttachLessonVideo>;

export const ZLessonListQuery = z.object({
  sectionId: z.string().optional(),
  courseId: z.string().min(1)
});

export const ZLessonHistoryParam = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1)
});
export type TLessonHistoryParam = z.infer<typeof ZLessonHistoryParam>;

export const ZLessonHistoryQuery = z.object({
  locale: z.string().min(1),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).default(10),
  /** Keyset cursor from the previous page, formatted `<iso timestamp>|<id>`. */
  cursor: z.string().min(1).optional()
});
export type TLessonHistoryQuery = z.infer<typeof ZLessonHistoryQuery>;
export type TLessonListQuery = z.infer<typeof ZLessonListQuery>;

export const ZLessonCommentCreate = z.object({
  lessonId: z.string().min(1),
  comment: z.string().min(1)
});
export type TLessonCommentCreate = z.infer<typeof ZLessonCommentCreate>;

export const ZLessonCommentGetParam = z.object({
  commentId: z.string().min(1)
});
export type TLessonCommentGetParam = z.infer<typeof ZLessonCommentGetParam>;

export const ZLessonCommentUpdate = z.object({
  comment: z.string().min(1)
});
export type TLessonCommentUpdate = z.infer<typeof ZLessonCommentUpdate>;

export const ZLessonCommentsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(10)
});
export type TLessonCommentsQuery = z.infer<typeof ZLessonCommentsQuery>;

// Lesson Completion Schemas
export const ZLessonCompletionCreate = z.object({
  lessonId: z.string().min(1),
  isComplete: z.boolean()
});
export type TLessonCompletionCreate = z.infer<typeof ZLessonCompletionCreate>;

export const ZLessonCompletionUpdate = z.object({
  isComplete: z.boolean()
});
export type TLessonCompletionUpdate = z.infer<typeof ZLessonCompletionUpdate>;

export const ZUpdateLessonWatchProgress = z.object({
  positionSeconds: z.number().min(0),
  playedDeltaSeconds: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.number().min(0).max(120)),
  durationSeconds: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.int().min(1)),
  assetId: z.string().optional()
});
export type TUpdateLessonWatchProgress = z.infer<typeof ZUpdateLessonWatchProgress>;
