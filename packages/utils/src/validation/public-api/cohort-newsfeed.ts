import * as z from 'zod';

import {
  ZCreateCohortNewsfeed,
  ZCreateCohortNewsfeedComment,
  ZUpdateCohortNewsfeed,
  ZUpdateCohortReaction
} from '../cohort/cohort';
import { ZPublicApiCohortParam } from './cohort';

export const ZPublicApiCohortNewsfeedParam = ZPublicApiCohortParam.extend({
  feedId: z.string().uuid()
});
export type TPublicApiCohortNewsfeedParam = z.infer<typeof ZPublicApiCohortNewsfeedParam>;

export const ZPublicApiCohortNewsfeedCommentParam = ZPublicApiCohortNewsfeedParam.extend({
  commentId: z.coerce.number().int()
});
export type TPublicApiCohortNewsfeedCommentParam = z.infer<typeof ZPublicApiCohortNewsfeedCommentParam>;

export const ZPublicApiCohortNewsfeedQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
export type TPublicApiCohortNewsfeedQuery = z.infer<typeof ZPublicApiCohortNewsfeedQuery>;

export const ZPublicApiCreateCohortNewsfeed = ZCreateCohortNewsfeed;
export type TPublicApiCreateCohortNewsfeed = z.infer<typeof ZPublicApiCreateCohortNewsfeed>;

export const ZPublicApiUpdateCohortNewsfeed = ZUpdateCohortNewsfeed;
export type TPublicApiUpdateCohortNewsfeed = z.infer<typeof ZPublicApiUpdateCohortNewsfeed>;

export const ZPublicApiUpdateCohortReaction = ZUpdateCohortReaction;
export type TPublicApiUpdateCohortReaction = z.infer<typeof ZPublicApiUpdateCohortReaction>;

export const ZPublicApiCreateCohortNewsfeedComment = ZCreateCohortNewsfeedComment;
export type TPublicApiCreateCohortNewsfeedComment = z.infer<typeof ZPublicApiCreateCohortNewsfeedComment>;
