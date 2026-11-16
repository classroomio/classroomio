import * as schema from '@db/schema';

import type { TCourseCommentAnchorType } from '@cio/utils/constants/course-comment';
import { and, db, eq, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export interface TCourseCommentSummaryRow {
  threadId: string;
  anchorType: TCourseCommentAnchorType;
  lessonId: string | null;
  exerciseId: string | null;
  blockId: string | null;
  questionId: number | null;
  blockPlaced: boolean;
  unread: boolean;
}

/**
 * One row per open thread of a course with what the counts need, including whether the viewer has
 * unread comments on it. Kept per thread because anchor fallbacks decide where a thread counts.
 */
export async function listOpenCourseCommentSummaryRows(
  courseId: string,
  viewerId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentSummaryRow[]> {
  const thread = schema.courseCommentThread;

  try {
    const rows = await dbClient
      .select({
        threadId: thread.id,
        anchorType: thread.anchorType,
        lessonId: thread.lessonId,
        exerciseId: thread.exerciseId,
        blockId: thread.blockId,
        questionId: thread.questionId,
        blockPlaced: sql<boolean>`exists (
          select 1 from ${schema.blockPlacement} placement
          where placement.lesson_id = ${thread}.lesson_id and placement.block_id = ${thread}.block_id
        )`,
        unread: sql<boolean>`exists (
          select 1
          from ${schema.courseComment} unread_comment
          left join ${schema.courseCommentThreadRead} viewer_read
            on viewer_read.thread_id = unread_comment.thread_id and viewer_read.profile_id = ${viewerId}
          where unread_comment.thread_id = ${thread}.id
            and unread_comment.created_at > coalesce(viewer_read.last_read_at, '-infinity'::timestamptz)
            and unread_comment.author_id is distinct from ${viewerId}
        )`
      })
      .from(thread)
      .where(and(eq(thread.courseId, courseId), eq(thread.status, 'open')));

    return rows.map((row) => ({ ...row, blockPlaced: Boolean(row.blockPlaced), unread: Boolean(row.unread) }));
  } catch (error) {
    console.error('listOpenCourseCommentSummaryRows error:', error);
    throw new Error(
      `Failed to summarize comments of course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
