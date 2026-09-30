import * as z from 'zod';

import { ZPublicApiCourseLessonParam } from './course-lesson';

export const ZPublicApiCourseLessonCommentParam = ZPublicApiCourseLessonParam.extend({
  commentId: z.coerce.number().int().positive()
});
export type TPublicApiCourseLessonCommentParam = z.infer<typeof ZPublicApiCourseLessonCommentParam>;

export const ZPublicApiCourseLessonCommentsQuery = z.object({
  cursor: z.string().max(100).regex(/^\d+$/, 'cursor must be a nextCursor value').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
export type TPublicApiCourseLessonCommentsQuery = z.infer<typeof ZPublicApiCourseLessonCommentsQuery>;

export const ZPublicApiCreateCourseLessonComment = z.object({
  comment: z.string().min(1)
});
export type TPublicApiCreateCourseLessonComment = z.infer<typeof ZPublicApiCreateCourseLessonComment>;

export const ZPublicApiUpdateCourseLessonComment = z.object({
  comment: z.string().min(1)
});
export type TPublicApiUpdateCourseLessonComment = z.infer<typeof ZPublicApiUpdateCourseLessonComment>;
