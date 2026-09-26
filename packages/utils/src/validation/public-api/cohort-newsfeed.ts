import * as z from 'zod';

import { ZPublicApiCohortParam } from './cohort';

export const PUBLIC_API_COHORT_REACTION_TYPES = ['clap', 'smile', 'thumbsup', 'thumbsdown'] as const;
export type TPublicApiCohortReactionType = (typeof PUBLIC_API_COHORT_REACTION_TYPES)[number];

const NEWSFEED_CURSOR_PATTERN =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:?\d{2})?)(\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i;

export const ZPublicApiCohortNewsfeedParam = ZPublicApiCohortParam.extend({
  feedId: z.string().uuid()
});
export type TPublicApiCohortNewsfeedParam = z.infer<typeof ZPublicApiCohortNewsfeedParam>;

export const ZPublicApiCohortNewsfeedCommentParam = ZPublicApiCohortNewsfeedParam.extend({
  commentId: z.coerce.number().int()
});
export type TPublicApiCohortNewsfeedCommentParam = z.infer<typeof ZPublicApiCohortNewsfeedCommentParam>;

export const ZPublicApiCohortNewsfeedQuery = z.object({
  cursor: z
    .string()
    .refine((cursor) => NEWSFEED_CURSOR_PATTERN.test(cursor) && !Number.isNaN(Date.parse(cursor.split('|')[0]!)), {
      message: 'Invalid cursor'
    })
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
export type TPublicApiCohortNewsfeedQuery = z.infer<typeof ZPublicApiCohortNewsfeedQuery>;

export const ZPublicApiCreateCohortNewsfeed = z.object({
  content: z.string().min(1),
  isPinned: z.boolean().optional()
});
export type TPublicApiCreateCohortNewsfeed = z.infer<typeof ZPublicApiCreateCohortNewsfeed>;

export const ZPublicApiUpdateCohortNewsfeed = z
  .object({
    content: z.string().min(1).optional(),
    isPinned: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TPublicApiUpdateCohortNewsfeed = z.infer<typeof ZPublicApiUpdateCohortNewsfeed>;

export const ZPublicApiSetCohortReaction = z.object({
  reaction: z.enum(PUBLIC_API_COHORT_REACTION_TYPES).nullable()
});
export type TPublicApiSetCohortReaction = z.infer<typeof ZPublicApiSetCohortReaction>;

export const ZPublicApiCreateCohortNewsfeedComment = z.object({
  content: z.string().min(1)
});
export type TPublicApiCreateCohortNewsfeedComment = z.infer<typeof ZPublicApiCreateCohortNewsfeedComment>;
