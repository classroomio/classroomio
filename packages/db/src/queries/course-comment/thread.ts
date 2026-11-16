import * as schema from '@db/schema';

import type { TCourseCommentThreadStatus } from '@cio/utils/constants/course-comment';
import type { TCourseCommentThread, TNewCourseCommentThread, TNewCourseCommentThreadEvent } from '@db/types';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, db, desc, eq, inArray, ne, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export interface TCourseCommentThreadRow {
  thread: TCourseCommentThread;
  lessonTitle: string | null;
  exerciseTitle: string | null;
  blockType: string | null;
  blockData: Record<string, unknown> | null;
  blockDeletedAt: string | null;
  /** Whether the thread's block is still placed in its lesson. */
  blockPlaced: boolean;
  questionTitle: string | null;
  resolverFullname: string | null;
  resolverAvatarUrl: string | null;
  /** Comments by others the viewer has not read; always 0 for resolved threads. */
  unreadCount: number;
}

export interface TCourseCommentRow {
  id: string;
  threadId: string;
  authorId: string | null;
  authorFullname: string | null;
  authorAvatarUrl: string | null;
  body: string;
  mentions: (typeof schema.courseComment.$inferSelect)['mentions'];
  editedAt: string | null;
  createdAt: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function insertCourseCommentThread(
  values: TNewCourseCommentThread,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentThread> {
  try {
    const [thread] = await dbClient.insert(schema.courseCommentThread).values(values).returning();
    if (!thread) throw new Error('Insert returned no row');

    return thread;
  } catch (error) {
    console.error('insertCourseCommentThread error:', error);
    throw new Error(`Failed to create comment thread: ${errorMessage(error)}`);
  }
}

/**
 * A thread, only when it belongs to the course.
 */
export async function getCourseCommentThread(
  courseId: string,
  threadId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentThread | null> {
  try {
    const [thread] = await dbClient
      .select()
      .from(schema.courseCommentThread)
      .where(and(eq(schema.courseCommentThread.id, threadId), eq(schema.courseCommentThread.courseId, courseId)))
      .limit(1);

    return thread ?? null;
  } catch (error) {
    console.error('getCourseCommentThread error:', error);
    throw new Error(`Failed to get comment thread "${threadId}": ${errorMessage(error)}`);
  }
}

/**
 * Threads of one course with the context needed to describe their anchors, newest activity first.
 */
export async function listCourseCommentThreadRows(
  input: {
    courseId: string;
    viewerId: string;
    status: TCourseCommentThreadStatus | 'all';
    threadIds?: string[];
  },
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentThreadRow[]> {
  const thread = schema.courseCommentThread;
  const resolver = alias(schema.profile, 'resolver');

  try {
    const unreadCount = sql<number>`case when ${thread}.status = 'open' then (
        select count(*)::int
        from ${schema.courseComment} unread_comment
        left join ${schema.courseCommentThreadRead} viewer_read
          on viewer_read.thread_id = unread_comment.thread_id and viewer_read.profile_id = ${input.viewerId}
        where unread_comment.thread_id = ${thread}.id
          and unread_comment.created_at > coalesce(viewer_read.last_read_at, '-infinity'::timestamptz)
          and unread_comment.author_id is distinct from ${input.viewerId}
      ) else 0 end`;
    const blockPlaced = sql<boolean>`exists (
        select 1 from ${schema.blockPlacement} placement
        where placement.lesson_id = ${thread}.lesson_id and placement.block_id = ${thread}.block_id
      )`;

    const rows = await dbClient
      .select({
        thread,
        lessonTitle: schema.lesson.title,
        exerciseTitle: schema.exercise.title,
        blockType: schema.block.type,
        blockData: schema.block.data,
        blockDeletedAt: schema.block.deletedAt,
        blockPlaced,
        questionTitle: schema.question.title,
        resolverFullname: resolver.fullname,
        resolverAvatarUrl: resolver.avatarUrl,
        unreadCount
      })
      .from(thread)
      .leftJoin(schema.lesson, eq(schema.lesson.id, thread.lessonId))
      .leftJoin(schema.exercise, eq(schema.exercise.id, thread.exerciseId))
      .leftJoin(schema.block, eq(schema.block.id, thread.blockId))
      .leftJoin(schema.question, eq(schema.question.id, thread.questionId))
      .leftJoin(resolver, eq(resolver.id, thread.resolvedBy))
      .where(
        and(
          eq(thread.courseId, input.courseId),
          input.status === 'all' ? undefined : eq(thread.status, input.status),
          input.threadIds ? inArray(thread.id, input.threadIds) : undefined
        )
      )
      .orderBy(desc(thread.lastActivityAt), desc(thread.id));

    return rows.map((row) => ({ ...row, blockPlaced: Boolean(row.blockPlaced), unreadCount: Number(row.unreadCount) }));
  } catch (error) {
    console.error('listCourseCommentThreadRows error:', error);
    throw new Error(`Failed to list comment threads: ${errorMessage(error)}`);
  }
}

/**
 * Comments of the given threads, oldest first, with their authors' current profile.
 */
export async function listCourseCommentsForThreads(
  threadIds: string[],
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentRow[]> {
  if (threadIds.length === 0) return [];

  try {
    return await dbClient
      .select({
        id: schema.courseComment.id,
        threadId: schema.courseComment.threadId,
        authorId: schema.courseComment.authorId,
        authorFullname: schema.profile.fullname,
        authorAvatarUrl: schema.profile.avatarUrl,
        body: schema.courseComment.body,
        mentions: schema.courseComment.mentions,
        editedAt: schema.courseComment.editedAt,
        createdAt: schema.courseComment.createdAt
      })
      .from(schema.courseComment)
      .leftJoin(schema.profile, eq(schema.profile.id, schema.courseComment.authorId))
      .where(inArray(schema.courseComment.threadId, threadIds))
      .orderBy(asc(schema.courseComment.threadId), asc(schema.courseComment.createdAt), asc(schema.courseComment.id));
  } catch (error) {
    console.error('listCourseCommentsForThreads error:', error);
    throw new Error(`Failed to list comments: ${errorMessage(error)}`);
  }
}

/**
 * Moves a thread to `status`, recording who resolved it. Leaves a thread already in that state alone.
 * @returns the updated thread, or null when nothing changed.
 */
export async function setCourseCommentThreadStatus(
  input: { threadId: string; status: TCourseCommentThreadStatus; actorId: string },
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentThread | null> {
  const now = new Date().toISOString();
  const isResolving = input.status === 'resolved';

  try {
    const [thread] = await dbClient
      .update(schema.courseCommentThread)
      .set({
        status: input.status,
        resolvedBy: isResolving ? input.actorId : null,
        resolvedByDeletedName: null,
        resolvedAt: isResolving ? now : null,
        lastActivityAt: now,
        updatedAt: now
      })
      .where(
        and(eq(schema.courseCommentThread.id, input.threadId), ne(schema.courseCommentThread.status, input.status))
      )
      .returning();

    return thread ?? null;
  } catch (error) {
    console.error('setCourseCommentThreadStatus error:', error);
    throw new Error(`Failed to update comment thread "${input.threadId}": ${errorMessage(error)}`);
  }
}

export async function touchCourseCommentThread(threadId: string, dbClient: DbOrTxClient = db): Promise<void> {
  const now = new Date().toISOString();

  try {
    await dbClient
      .update(schema.courseCommentThread)
      .set({ lastActivityAt: now, updatedAt: now })
      .where(eq(schema.courseCommentThread.id, threadId));
  } catch (error) {
    console.error('touchCourseCommentThread error:', error);
    throw new Error(`Failed to touch comment thread "${threadId}": ${errorMessage(error)}`);
  }
}

export async function deleteCourseCommentThread(threadId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await dbClient.delete(schema.courseCommentThread).where(eq(schema.courseCommentThread.id, threadId));
  } catch (error) {
    console.error('deleteCourseCommentThread error:', error);
    throw new Error(`Failed to delete comment thread "${threadId}": ${errorMessage(error)}`);
  }
}

/**
 * Moves a lesson's threads from one block to the copy that replaced it in that lesson, so they keep
 * pointing at the content the lesson shows.
 */
export async function moveCourseCommentThreadsToBlock(
  input: { lessonId: string; fromBlockId: string; toBlockId: string },
  dbClient: DbOrTxClient = db
): Promise<Array<{ id: string; courseId: string }>> {
  try {
    return await dbClient
      .update(schema.courseCommentThread)
      .set({ blockId: input.toBlockId, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.courseCommentThread.lessonId, input.lessonId),
          eq(schema.courseCommentThread.blockId, input.fromBlockId)
        )
      )
      .returning({ id: schema.courseCommentThread.id, courseId: schema.courseCommentThread.courseId });
  } catch (error) {
    console.error('moveCourseCommentThreadsToBlock error:', error);
    throw new Error(`Failed to move comment threads to block "${input.toBlockId}": ${errorMessage(error)}`);
  }
}

export async function insertCourseCommentThreadEvent(
  values: TNewCourseCommentThreadEvent,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient.insert(schema.courseCommentThreadEvent).values(values);
  } catch (error) {
    console.error('insertCourseCommentThreadEvent error:', error);
    throw new Error(`Failed to record comment thread event: ${errorMessage(error)}`);
  }
}

/**
 * Keeps a deleted account's name on its comments and threads for the audit trail. Run before the
 * profile row is deleted; the foreign keys then null the ids.
 */
export async function snapshotDeletedProfileInComments(
  profileId: string,
  displayName: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.courseComment)
      .set({ authorDeletedName: displayName })
      .where(eq(schema.courseComment.authorId, profileId));
    await dbClient
      .update(schema.courseCommentThread)
      .set({ createdByDeletedName: displayName })
      .where(eq(schema.courseCommentThread.createdBy, profileId));
    await dbClient
      .update(schema.courseCommentThread)
      .set({ resolvedByDeletedName: displayName })
      .where(eq(schema.courseCommentThread.resolvedBy, profileId));
  } catch (error) {
    console.error('snapshotDeletedProfileInComments error:', error);
    throw new Error(`Failed to snapshot deleted profile in comments: ${errorMessage(error)}`);
  }
}
