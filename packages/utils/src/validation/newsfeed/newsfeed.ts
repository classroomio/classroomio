import * as z from 'zod';

export const ZNewsfeedCreate = z.object({
  courseId: z.string().min(1),
  content: z.string().min(1),
  isPinned: z.boolean().optional()
});
export type TNewsfeedCreate = z.infer<typeof ZNewsfeedCreate>;

export const ZNewsfeedUpdate = z.object({
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional()
});
export type TNewsfeedUpdate = z.infer<typeof ZNewsfeedUpdate>;

export const ZNewsfeedReactionUpdate = z.object({
  reaction: z.record(z.enum(['clap', 'smile', 'thumbsup', 'thumbsdown']), z.array(z.string()))
});
export type TNewsfeedReactionUpdate = z.infer<typeof ZNewsfeedReactionUpdate>;

export const ZNewsfeedGetParam = z.object({
  feedId: z.string().min(1)
});
export type TNewsfeedGetParam = z.infer<typeof ZNewsfeedGetParam>;

export const ZNewsfeedListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10)
});
export type TNewsfeedListQuery = z.infer<typeof ZNewsfeedListQuery>;

// Newsfeed Comment Schemas
export const ZNewsfeedCommentCreate = z.object({
  courseNewsfeedId: z.string().min(1),
  content: z.string().min(1),
  parentId: z.number().int().positive().optional()
});
export type TNewsfeedCommentCreate = z.infer<typeof ZNewsfeedCommentCreate>;

export const ZNewsfeedCommentGetParam = z.object({
  commentId: z.string().min(1)
});
export type TNewsfeedCommentGetParam = z.infer<typeof ZNewsfeedCommentGetParam>;

export const ZNewsfeedCommentUpdate = z.object({
  content: z.string().min(1)
});
export type TNewsfeedCommentUpdate = z.infer<typeof ZNewsfeedCommentUpdate>;

export const ZNewsfeedCommentThreadQuery = z.object({
  /** Fetch the subtree rooted at this comment. Omit for the feed's top-level comments. */
  rootId: z.coerce.number().int().positive().optional(),
  /** Keyset cursor over top-level comments. */
  cursor: z.string().optional(),
  /** Keyset cursor over the direct children of `rootId`. */
  childCursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(5),
  childLimit: z.coerce.number().int().min(1).max(20).optional().default(3),
  /** Levels fetched below the root. Bounds worst-case fan-out per request. */
  maxDepth: z.coerce.number().int().min(0).max(6).optional().default(3)
});
export type TNewsfeedCommentThreadQuery = z.infer<typeof ZNewsfeedCommentThreadQuery>;
