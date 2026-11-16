import * as schema from '@db/schema';

import type { TCourseCommentMention } from '@cio/utils/functions/course-comment-mentions';
import type { TNewNotification, TNotification } from '@db/types';
import { alias } from 'drizzle-orm/pg-core';
import { and, count, db, desc, eq, inArray, isNotNull, isNull, lt, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export interface TNotificationRow {
  id: string;
  kind: string;
  createdAt: string;
  readAt: string | null;
  actorId: string | null;
  actorFullname: string | null;
  actorAvatarUrl: string | null;
  courseId: string | null;
  courseTitle: string | null;
  threadId: string | null;
  threadLessonId: string | null;
  threadExerciseId: string | null;
  commentBody: string | null;
  commentMentions: TCourseCommentMention[] | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function insertNotifications(
  rows: TNewNotification[],
  dbClient: DbOrTxClient = db
): Promise<TNotification[]> {
  if (rows.length === 0) return [];

  try {
    return await dbClient.insert(schema.notification).values(rows).returning();
  } catch (error) {
    console.error('insertNotifications error:', error);
    throw new Error(`Failed to create notifications: ${errorMessage(error)}`);
  }
}

function notificationRowSelect() {
  const actor = alias(schema.profile, 'notification_actor');

  return {
    actor,
    columns: {
      id: schema.notification.id,
      kind: schema.notification.kind,
      createdAt: schema.notification.createdAt,
      readAt: schema.notification.readAt,
      actorId: schema.notification.actorId,
      actorFullname: actor.fullname,
      actorAvatarUrl: actor.avatarUrl,
      courseId: schema.notification.courseId,
      courseTitle: schema.course.title,
      threadId: schema.notification.courseCommentThreadId,
      threadLessonId: schema.courseCommentThread.lessonId,
      threadExerciseId: schema.courseCommentThread.exerciseId,
      commentBody: schema.courseComment.body,
      commentMentions: schema.courseComment.mentions
    }
  };
}

/**
 * One page of a person's notifications in an org, newest first. `cursor` is the `createdAt` of the
 * last row of the previous page.
 */
export async function listNotificationsForRecipient(
  input: { recipientId: string; organizationId: string; limit: number; cursor?: string },
  dbClient: DbOrTxClient = db
): Promise<TNotificationRow[]> {
  const { actor, columns } = notificationRowSelect();

  try {
    return await dbClient
      .select(columns)
      .from(schema.notification)
      .leftJoin(actor, eq(actor.id, schema.notification.actorId))
      .leftJoin(schema.course, eq(schema.course.id, schema.notification.courseId))
      .leftJoin(
        schema.courseCommentThread,
        eq(schema.courseCommentThread.id, schema.notification.courseCommentThreadId)
      )
      .leftJoin(schema.courseComment, eq(schema.courseComment.id, schema.notification.courseCommentId))
      .where(
        and(
          eq(schema.notification.recipientId, input.recipientId),
          eq(schema.notification.organizationId, input.organizationId),
          input.cursor ? lt(schema.notification.createdAt, input.cursor) : undefined
        )
      )
      .orderBy(desc(schema.notification.createdAt), desc(schema.notification.id))
      .limit(input.limit);
  } catch (error) {
    console.error('listNotificationsForRecipient error:', error);
    throw new Error(`Failed to list notifications: ${errorMessage(error)}`);
  }
}

export async function countUnreadNotifications(
  recipientId: string,
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.notification)
      .where(
        and(
          eq(schema.notification.recipientId, recipientId),
          eq(schema.notification.organizationId, organizationId),
          isNull(schema.notification.readAt)
        )
      );

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countUnreadNotifications error:', error);
    throw new Error(`Failed to count notifications: ${errorMessage(error)}`);
  }
}

/**
 * Marks one of the recipient's notifications read.
 * @returns false when the notification does not exist or belongs to someone else.
 */
export async function markNotificationRead(
  notificationId: string,
  recipientId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const rows = await dbClient
      .update(schema.notification)
      .set({ readAt: sql`coalesce(${schema.notification.readAt}, now())` })
      .where(and(eq(schema.notification.id, notificationId), eq(schema.notification.recipientId, recipientId)))
      .returning({ id: schema.notification.id });

    return rows.length > 0;
  } catch (error) {
    console.error('markNotificationRead error:', error);
    throw new Error(`Failed to mark notification read: ${errorMessage(error)}`);
  }
}

export async function markAllNotificationsRead(
  recipientId: string,
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.notification)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(schema.notification.recipientId, recipientId),
          eq(schema.notification.organizationId, organizationId),
          isNull(schema.notification.readAt)
        )
      );
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    throw new Error(`Failed to mark notifications read: ${errorMessage(error)}`);
  }
}

export async function markCourseCommentThreadNotificationsRead(
  threadIds: string[],
  recipientId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (threadIds.length === 0) return;

  try {
    await dbClient
      .update(schema.notification)
      .set({ readAt: sql`now()` })
      .where(
        and(
          inArray(schema.notification.courseCommentThreadId, threadIds),
          eq(schema.notification.recipientId, recipientId),
          isNull(schema.notification.readAt)
        )
      );
  } catch (error) {
    console.error('markCourseCommentThreadNotificationsRead error:', error);
    throw new Error(`Failed to mark thread notifications read: ${errorMessage(error)}`);
  }
}

/** Marks every comment notification of one course read for its recipient. */
export async function markCourseCommentNotificationsReadForCourse(
  courseId: string,
  recipientId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.notification)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(schema.notification.courseId, courseId),
          eq(schema.notification.recipientId, recipientId),
          isNotNull(schema.notification.courseCommentThreadId),
          isNull(schema.notification.readAt)
        )
      );
  } catch (error) {
    console.error('markCourseCommentNotificationsReadForCourse error:', error);
    throw new Error(`Failed to mark course comment notifications read: ${errorMessage(error)}`);
  }
}

/**
 * A recipient's notifications on one thread that are neither read in the app nor emailed yet.
 */
export async function listPendingCourseCommentDigestNotifications(
  threadId: string,
  recipientId: string,
  dbClient: DbOrTxClient = db
): Promise<TNotificationRow[]> {
  const { actor, columns } = notificationRowSelect();

  try {
    return await dbClient
      .select(columns)
      .from(schema.notification)
      .leftJoin(actor, eq(actor.id, schema.notification.actorId))
      .leftJoin(schema.course, eq(schema.course.id, schema.notification.courseId))
      .leftJoin(
        schema.courseCommentThread,
        eq(schema.courseCommentThread.id, schema.notification.courseCommentThreadId)
      )
      .leftJoin(schema.courseComment, eq(schema.courseComment.id, schema.notification.courseCommentId))
      .where(
        and(
          eq(schema.notification.courseCommentThreadId, threadId),
          eq(schema.notification.recipientId, recipientId),
          isNull(schema.notification.emailedAt),
          isNull(schema.notification.readAt)
        )
      )
      .orderBy(desc(schema.notification.createdAt), desc(schema.notification.id));
  } catch (error) {
    console.error('listPendingCourseCommentDigestNotifications error:', error);
    throw new Error(`Failed to list pending digest notifications: ${errorMessage(error)}`);
  }
}

export async function markNotificationsEmailed(notificationIds: string[], dbClient: DbOrTxClient = db): Promise<void> {
  if (notificationIds.length === 0) return;

  try {
    await dbClient
      .update(schema.notification)
      .set({ emailedAt: sql`now()` })
      .where(inArray(schema.notification.id, notificationIds));
  } catch (error) {
    console.error('markNotificationsEmailed error:', error);
    throw new Error(`Failed to mark notifications emailed: ${errorMessage(error)}`);
  }
}
