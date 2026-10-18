import * as z from 'zod';

import { ZPublicApiCourseLessonParam } from './course-lesson';

export const ZPublicApiCourseLessonCommentParam = ZPublicApiCourseLessonParam.extend({
  commentId: z.coerce.number().int().positive()
});
export type TPublicApiCourseLessonCommentParam = z.infer<typeof ZPublicApiCourseLessonCommentParam>;

const COMMENT_CURSOR_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:?\d{2})?)\|\d+$/;

// Date.parse rolls Feb 31 over to March; Postgres rejects it.
function isRealTimestamp(value: string): boolean {
  if (Number.isNaN(Date.parse(value))) return false;

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const ZPublicApiCourseLessonCommentsQuery = z.object({
  cursor: z
    .string()
    .max(100)
    .regex(COMMENT_CURSOR_PATTERN, 'cursor must be a nextCursor value')
    .refine((cursor) => isRealTimestamp(cursor.slice(0, cursor.lastIndexOf('|'))), {
      message: 'cursor must be a nextCursor value'
    })
    .optional(),
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
