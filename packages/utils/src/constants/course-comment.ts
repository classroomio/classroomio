/**
 * Postgres `COURSE_COMMENT_ANCHOR_TYPE` values, shared by the Drizzle schema and Zod validation.
 * `page` is a lesson or exercise page; `block`, `text`, `time`, `slide` and `point` pin to a block.
 */
export const COURSE_COMMENT_ANCHOR_TYPES = [
  'course',
  'page',
  'block',
  'text',
  'time',
  'slide',
  'point',
  'question'
] as const;

export type TCourseCommentAnchorType = (typeof COURSE_COMMENT_ANCHOR_TYPES)[number];

export const COURSE_COMMENT_BLOCK_ANCHOR_TYPES = ['block', 'text', 'time', 'slide', 'point'] as const;

export type TCourseCommentBlockAnchorType = (typeof COURSE_COMMENT_BLOCK_ANCHOR_TYPES)[number];

export const COURSE_COMMENT_THREAD_STATUSES = ['open', 'resolved'] as const;

export type TCourseCommentThreadStatus = (typeof COURSE_COMMENT_THREAD_STATUSES)[number];

export const COURSE_COMMENT_THREAD_EVENT_TYPES = ['resolved', 'reopened'] as const;

export type TCourseCommentThreadEventType = (typeof COURSE_COMMENT_THREAD_EVENT_TYPES)[number];

/** Derived on read: whether the spot a thread points at still exists as it was. */
export const COURSE_COMMENT_ANCHOR_STATES = [
  'ok',
  'text_removed',
  'media_changed',
  'question_removed',
  'block_removed'
] as const;

export type TCourseCommentAnchorState = (typeof COURSE_COMMENT_ANCHOR_STATES)[number];

export const COURSE_COMMENT_BODY_MAX_LENGTH = 5000;
export const COURSE_COMMENT_MAX_MENTIONS = 50;
export const COURSE_COMMENT_QUOTE_MAX_LENGTH = 1000;
/** Characters of surrounding text stored on each side of a quote to tell duplicates apart. */
export const COURSE_COMMENT_CONTEXT_LENGTH = 32;
export const COURSE_COMMENT_MAX_VIDEO_SECONDS = 86_400;
export const COURSE_COMMENT_MAX_SLIDE_NUMBER = 10_000;

export const COURSE_COMMENT_DIGEST_DELAY_MS = 5 * 60 * 1000;
export const COURSE_COMMENT_DIGEST_MAX_ITEMS = 5;

export const COURSE_COMMENT_PRESENCE_COLOR_COUNT = 8;
