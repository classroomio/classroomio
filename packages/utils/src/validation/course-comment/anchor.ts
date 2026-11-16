import * as z from 'zod';

import {
  COURSE_COMMENT_CONTEXT_LENGTH,
  COURSE_COMMENT_MAX_SLIDE_NUMBER,
  COURSE_COMMENT_MAX_VIDEO_SECONDS,
  COURSE_COMMENT_QUOTE_MAX_LENGTH
} from '../../constants/course-comment';
import { ZBlockLocale } from '../block/block';

const ZPercent = z.number().min(0).max(100);

const ZBlockTarget = z.object({ lessonId: z.uuid(), blockId: z.uuid() });

export const ZCourseCommentPage = z
  .object({ lessonId: z.uuid().optional(), exerciseId: z.uuid().optional() })
  .refine((page) => Boolean(page.lessonId) !== Boolean(page.exerciseId), {
    message: 'Exactly one of lessonId or exerciseId is required',
    path: ['lessonId']
  });

export const ZCourseCommentTextTarget = z.object({
  quote: z.string().min(1).max(COURSE_COMMENT_QUOTE_MAX_LENGTH),
  prefix: z.string().max(COURSE_COMMENT_CONTEXT_LENGTH),
  suffix: z.string().max(COURSE_COMMENT_CONTEXT_LENGTH),
  start: z.number().int().min(0)
});
export type TCourseCommentTextTarget = z.infer<typeof ZCourseCommentTextTarget>;

/** Where a new thread is attached, as sent by the dashboard. */
export const ZCourseCommentAnchorInput = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('course') }),
    z.object({ type: z.literal('page'), page: ZCourseCommentPage }),
    ZBlockTarget.extend({ type: z.literal('block') }),
    ZBlockTarget.extend(ZCourseCommentTextTarget.shape).extend({ type: z.literal('text'), locale: ZBlockLocale }),
    ZBlockTarget.extend({
      type: z.literal('time'),
      seconds: z.number().min(0).max(COURSE_COMMENT_MAX_VIDEO_SECONDS)
    }),
    ZBlockTarget.extend({
      type: z.literal('slide'),
      slideNumber: z.number().int().min(1).max(COURSE_COMMENT_MAX_SLIDE_NUMBER).nullable()
    }),
    ZBlockTarget.extend({ type: z.literal('point'), x: ZPercent.nullable(), y: ZPercent.nullable() }),
    z.object({ type: z.literal('question'), exerciseId: z.uuid(), questionId: z.number().int().positive() })
  ])
  .refine((anchor) => anchor.type !== 'point' || (anchor.x === null) === (anchor.y === null), {
    message: 'x and y must both be set or both be null',
    path: ['x']
  });
export type TCourseCommentAnchorInput = z.infer<typeof ZCourseCommentAnchorInput>;

/**
 * What `course_comment_thread.anchor` stores. Relationships (lesson, block, question) live in
 * foreign-key columns; this holds only positions and the media fingerprint at comment time.
 */
export const ZCourseCommentAnchorData = z.object({
  locale: ZBlockLocale.optional(),
  quote: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  start: z.number().int().optional(),
  seconds: z.number().optional(),
  slideNumber: z.number().int().nullable().optional(),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  fingerprint: z.string().nullable().optional()
});
export type TCourseCommentAnchorData = z.infer<typeof ZCourseCommentAnchorData>;
