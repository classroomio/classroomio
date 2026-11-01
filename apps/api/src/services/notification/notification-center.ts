import { AppError, ErrorCodes } from '@api/utils/errors';
import { buildNotificationDeepLink } from '@cio/core/services/notification/deep-link';
import {
  countUnreadNotifications,
  listNotificationsForProfile,
  markAllNotificationsRead,
  markNotificationRead
} from '@cio/db/queries/notifications/notification';
import { listNotificationPreferences } from '@cio/db/queries/notifications/notification-preferences';
import { loadNotificationSubjects } from '@cio/db/queries/notifications/notification-subjects';
import {
  NOTIFICATION_CATEGORY_CONFIG,
  notificationCategoryOf,
  notificationTypesInCategories,
  type TNotificationCategory
} from '@cio/utils/constants/notifications';
import type { TNotificationListQuery } from '@cio/utils/validation/notifications';

/** Notification types the profile turned off in-app. Locked categories always show. */
export async function hiddenNotificationTypes(profileId: string) {
  const preferences = await listNotificationPreferences([profileId]);
  const hiddenCategories = preferences
    .filter((row) => !row.inApp && !NOTIFICATION_CATEGORY_CONFIG[row.category as TNotificationCategory]?.locked)
    .map((row) => row.category);

  return notificationTypesInCategories(hiddenCategories);
}

/**
 * The profile's notifications in one organization, newest first, with the live display data each one refers to and
 * the path it opens. Copy is rendered by the client from these fields.
 */
export async function listNotifications(profileId: string, organizationId: string, query: TNotificationListQuery) {
  const hiddenTypes = await hiddenNotificationTypes(profileId);
  const rows = await listNotificationsForProfile({
    profileId,
    organizationId,
    hiddenTypes,
    cursor: query.cursor,
    limit: query.limit + 1
  });
  const page = rows.slice(0, query.limit);
  const hasMore = rows.length > query.limit;

  const [subjects, unreadCount] = await Promise.all([
    loadNotificationSubjects(page),
    countUnreadNotifications({ profileId, organizationId, hiddenTypes })
  ]);

  const items = page.map((row) => {
    const subject = subjects.get(row.id);
    const subjectSlug = subject?.subjectSlug ?? null;
    const deepLink = buildNotificationDeepLink({
      type: row.type,
      entityId: row.entityId,
      courseId: row.courseId,
      subjectSlug
    });

    return {
      id: row.id,
      type: row.type,
      category: notificationCategoryOf(row.type),
      entityType: row.entityType,
      entityId: row.entityId,
      courseId: row.courseId,
      deepLink,
      readAt: row.readAt,
      createdAt: row.createdAt,
      courseTitle: subject?.courseTitle ?? null,
      actorName: subject?.actorName ?? null,
      actorAvatarUrl: subject?.actorAvatarUrl ?? null,
      subjectTitle: subject?.subjectTitle ?? null,
      dueAt: subject?.dueAt ?? null,
      startsAt: subject?.startsAt ?? null,
      completedCount: subject?.completedCount ?? null,
      requiredCount: subject?.requiredCount ?? null
    };
  });

  return {
    items,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    unreadCount
  };
}

export async function readNotification(profileId: string, organizationId: string, notificationId: string) {
  const row = await markNotificationRead({ notificationId, profileId, organizationId });
  if (!row) {
    throw new AppError('Notification not found', ErrorCodes.NOT_FOUND, 404);
  }

  const hiddenTypes = await hiddenNotificationTypes(profileId);
  const unreadCount = await countUnreadNotifications({ profileId, organizationId, hiddenTypes });

  return { id: row.id, readAt: row.readAt, unreadCount };
}

export async function readAllNotifications(profileId: string, organizationId: string) {
  const updated = await markAllNotificationsRead({ profileId, organizationId });

  return { updated, unreadCount: 0 };
}
