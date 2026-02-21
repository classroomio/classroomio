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
  content: z.string().min(1)
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

export const ZNewsfeedCommentsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(5)
});
export type TNewsfeedCommentsQuery = z.infer<typeof ZNewsfeedCommentsQuery>;
