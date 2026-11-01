import { renderNotificationCopy, type NotificationCopy } from '@cio/utils/functions/notification-copy';

import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import {
  FALLBACK_CATEGORY_DISPLAY,
  NOTIFICATION_CATEGORY_DISPLAY,
  type NotificationCategoryDisplay
} from '@/feature/notifications/constants/notifications';
import type { NotificationItem } from '@/feature/notifications/types/notifications';

/** A Postgres or ISO timestamp as an ISO string Hermes can parse, or null when it cannot be read. */
export function toIsoTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;

  const time = parseTimestamp(value);

  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function notificationDisplay(item: NotificationItem): NotificationCategoryDisplay {
  return NOTIFICATION_CATEGORY_DISPLAY[item.category] ?? FALLBACK_CATEGORY_DISPLAY;
}

/** Title and body in `locale`; a type this app version does not know renders with an empty title instead of throwing. */
export function notificationCopy(item: NotificationItem, now: Date, locale: string): NotificationCopy {
  const copy: NotificationCopy | undefined = renderNotificationCopy(
    { ...item, dueAt: toIsoTimestamp(item.dueAt), startsAt: toIsoTimestamp(item.startsAt) },
    now,
    locale
  );

  return copy ?? { title: item.subjectTitle ?? item.courseTitle ?? '', body: null };
}
