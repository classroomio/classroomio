import {
  countUnreadNotifications,
  listNotificationsForRecipient,
  markAllNotificationsRead,
  markNotificationRead,
  type TNotificationRow
} from '@cio/db/queries/notifications';
import { canUseCourseComments } from '@cio/core/services/course-comment/access';
import type { TNotificationKind } from '@cio/utils/constants/notification';
import { toCourseCommentSnippet } from '@cio/utils/functions/course-comment-mentions';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TNotificationListQuery } from '@cio/utils/validation/course-comment';

export interface TNotificationView {
  id: string;
  kind: TNotificationKind;
  createdAt: string;
  readAt: string | null;
  actor: { profileId: string; fullname: string | null; avatarUrl: string | null } | null;
  course: { id: string; title: string | null } | null;
  thread: { id: string; lessonId: string | null; exerciseId: string | null } | null;
  commentSnippet: string | null;
}

export interface TNotificationPage {
  items: TNotificationView[];
  nextCursor: string | null;
  unreadCount: number;
}

function toView(row: TNotificationRow, canSeeComments: boolean): TNotificationView {
  return {
    id: row.id,
    kind: row.kind as TNotificationKind,
    createdAt: row.createdAt,
    readAt: row.readAt,
    actor: row.actorId ? { profileId: row.actorId, fullname: row.actorFullname, avatarUrl: row.actorAvatarUrl } : null,
    course: row.courseId ? { id: row.courseId, title: row.courseTitle } : null,
    thread:
      canSeeComments && row.threadId
        ? { id: row.threadId, lessonId: row.threadLessonId, exerciseId: row.threadExerciseId }
        : null,
    commentSnippet: canSeeComments ? toCourseCommentSnippet(row.commentBody) : null
  };
}

/**
 * One page of the caller's notifications in an org. Comment details are withheld for courses the
 * caller can no longer open, so a removed teammate keeps the row but never sees the comment.
 */
export async function listMyNotifications(
  recipientId: string,
  organizationId: string,
  query: TNotificationListQuery
): Promise<TNotificationPage> {
  const rows = await listNotificationsForRecipient({
    recipientId,
    organizationId,
    limit: query.limit + 1,
    cursor: query.cursor
  });
  const pageRows = rows.slice(0, query.limit);
  const courseIds = [...new Set(pageRows.map((row) => row.courseId).filter((id): id is string => Boolean(id)))];
  const accessEntries = await Promise.all(
    courseIds.map(async (courseId) => [courseId, await canUseCourseComments(courseId, recipientId)] as const)
  );
  const accessByCourse = new Map(accessEntries);
  const unreadCount = await countUnreadNotifications(recipientId, organizationId);
  const lastRow = pageRows[pageRows.length - 1];

  return {
    items: pageRows.map((row) => toView(row, Boolean(row.courseId && accessByCourse.get(row.courseId)))),
    nextCursor: rows.length > query.limit && lastRow ? lastRow.createdAt : null,
    unreadCount
  };
}

export async function readMyNotification(recipientId: string, notificationId: string): Promise<void> {
  const updated = await markNotificationRead(notificationId, recipientId);
  if (!updated) throw new AppError('Notification not found', ErrorCodes.NOTIFICATION_NOT_FOUND, 404);
}

export async function readAllMyNotifications(recipientId: string, organizationId: string): Promise<void> {
  await markAllNotificationsRead(recipientId, organizationId);
}
