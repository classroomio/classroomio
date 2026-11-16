import * as schema from '@db/schema';

import type { TCourseCommentMention } from '@cio/utils/functions/course-comment-mentions';
import type { TCourseComment, TNewCourseComment } from '@db/types';
import { and, asc, db, eq, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function insertCourseComment(
  values: TNewCourseComment,
  dbClient: DbOrTxClient = db
): Promise<TCourseComment> {
  try {
    const [comment] = await dbClient.insert(schema.courseComment).values(values).returning();
    if (!comment) throw new Error('Insert returned no row');

    return comment;
  } catch (error) {
    console.error('insertCourseComment error:', error);
    throw new Error(`Failed to create comment: ${errorMessage(error)}`);
  }
}

/**
 * A comment, only when it belongs to the thread.
 */
export async function getCourseComment(
  threadId: string,
  commentId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseComment | null> {
  try {
    const [comment] = await dbClient
      .select()
      .from(schema.courseComment)
      .where(and(eq(schema.courseComment.id, commentId), eq(schema.courseComment.threadId, threadId)))
      .limit(1);

    return comment ?? null;
  } catch (error) {
    console.error('getCourseComment error:', error);
    throw new Error(`Failed to get comment "${commentId}": ${errorMessage(error)}`);
  }
}

export async function updateCourseCommentBody(
  commentId: string,
  values: { body: string; mentions: TCourseCommentMention[] },
  dbClient: DbOrTxClient = db
): Promise<TCourseComment | null> {
  try {
    const [comment] = await dbClient
      .update(schema.courseComment)
      .set({ body: values.body, mentions: values.mentions, editedAt: new Date().toISOString() })
      .where(eq(schema.courseComment.id, commentId))
      .returning();

    return comment ?? null;
  } catch (error) {
    console.error('updateCourseCommentBody error:', error);
    throw new Error(`Failed to update comment "${commentId}": ${errorMessage(error)}`);
  }
}

export async function deleteCourseCommentRow(commentId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await dbClient.delete(schema.courseComment).where(eq(schema.courseComment.id, commentId));
  } catch (error) {
    console.error('deleteCourseCommentRow error:', error);
    throw new Error(`Failed to delete comment "${commentId}": ${errorMessage(error)}`);
  }
}

/**
 * The comment that started the thread.
 */
export async function getFirstCourseCommentId(threadId: string, dbClient: DbOrTxClient = db): Promise<string | null> {
  try {
    const [comment] = await dbClient
      .select({ id: schema.courseComment.id })
      .from(schema.courseComment)
      .where(eq(schema.courseComment.threadId, threadId))
      .orderBy(asc(schema.courseComment.createdAt), asc(schema.courseComment.id))
      .limit(1);

    return comment?.id ?? null;
  } catch (error) {
    console.error('getFirstCourseCommentId error:', error);
    throw new Error(`Failed to get first comment of thread "${threadId}": ${errorMessage(error)}`);
  }
}

/**
 * Everyone who took part in a thread: its creator, every comment author and everyone mentioned.
 */
export async function listCourseCommentThreadParticipantIds(
  threadId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  try {
    const result = await dbClient.execute<{ profile_id: string }>(sql`
      select created_by as profile_id from ${schema.courseCommentThread} where id = ${threadId} and created_by is not null
      union
      select author_id from ${schema.courseComment} where thread_id = ${threadId} and author_id is not null
      union
      select (mention ->> 'profileId')::uuid
      from ${schema.courseComment}, jsonb_array_elements(mentions) as mention
      where thread_id = ${threadId}
    `);

    return result.map((row) => row.profile_id).filter(Boolean);
  } catch (error) {
    console.error('listCourseCommentThreadParticipantIds error:', error);
    throw new Error(`Failed to list participants of thread "${threadId}": ${errorMessage(error)}`);
  }
}
