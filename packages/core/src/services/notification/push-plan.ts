import type { NotificationSubject } from '@cio/db/queries/notifications/notification-subjects';
import type { TDeviceToken, TNotification, TNotificationPreference, TProfileQuietHours } from '@cio/db/types';
import { NOTIFICATION_CATEGORY_CONFIG, notificationCategoryOf } from '@cio/utils/constants/notifications';
import { renderNotificationCopy } from '@cio/utils/functions/notification-copy';
import { isWithinQuietHours, millisecondsUntilQuietHoursEnd } from '@cio/utils/functions/quiet-hours';

import { buildNotificationDeepLink } from './deep-link';

const MINUTE_MS = 60_000;

export type PushData = {
  notificationId: string;
  type: TNotification['type'];
  entityId: string;
  deepLink: string;
  orgId: string;
};

export type PushMessage = {
  to: string;
  title: string;
  body?: string;
  data: PushData;
  badge?: number;
  sound: 'default';
  threadId: string;
};

export type PushPlanInput = {
  notifications: TNotification[];
  subjects: Map<string, NotificationSubject>;
  preferences: TNotificationPreference[];
  quietHours: TProfileQuietHours[];
  tokens: TDeviceToken[];
  unreadByProfile: Map<string, number>;
  /** Each recipient's profile language; recipients without one get English. */
  localeByProfile?: Map<string, string>;
  /** True when this run was already deferred once; a second quiet-hours hit drops instead of deferring again. */
  deferred: boolean;
  now: Date;
};

export type PushPlan = {
  messages: PushMessage[];
  deferrals: Array<{ delayMs: number; notificationIds: string[] }>;
  skipped: { read: number; preference: number; quietHours: number; noToken: number };
};

/**
 * Decides who receives a push for each notification: applies the recipient's category push preference (locked
 * categories always send), defers or drops inside quiet hours per category, and renders one message per active
 * device token. Pure, so delivery rules are testable without Expo or a database.
 */
export function planPushDelivery(input: PushPlanInput): PushPlan {
  const preferenceByKey = new Map(input.preferences.map((row) => [`${row.profileId}:${row.category}`, row]));
  const quietHoursByProfile = new Map(input.quietHours.map((row) => [row.profileId, row]));
  const tokensByProfile = new Map<string, TDeviceToken[]>();
  for (const token of input.tokens) {
    tokensByProfile.set(token.profileId, [...(tokensByProfile.get(token.profileId) ?? []), token]);
  }

  const plan: PushPlan = {
    messages: [],
    deferrals: [],
    skipped: { read: 0, preference: 0, quietHours: 0, noToken: 0 }
  };
  const deferralsByDelay = new Map<number, string[]>();

  for (const notification of input.notifications) {
    if (notification.readAt) {
      plan.skipped.read += 1;
      continue;
    }

    const category = notificationCategoryOf(notification.type);
    const config = NOTIFICATION_CATEGORY_CONFIG[category];
    const preference = preferenceByKey.get(`${notification.profileId}:${category}`);
    if (!config.locked && preference?.push === false) {
      plan.skipped.preference += 1;
      continue;
    }

    const quietHours = quietHoursByProfile.get(notification.profileId);
    if (isWithinQuietHours(quietHours, input.now)) {
      const delayMs = millisecondsUntilQuietHoursEnd(quietHours, input.now);
      if (config.quietHours === 'drop' || input.deferred || delayMs <= 0) {
        plan.skipped.quietHours += 1;
        continue;
      }

      const roundedDelay = Math.ceil(delayMs / MINUTE_MS) * MINUTE_MS;
      deferralsByDelay.set(roundedDelay, [...(deferralsByDelay.get(roundedDelay) ?? []), notification.id]);
      continue;
    }

    const tokens = tokensByProfile.get(notification.profileId) ?? [];
    if (tokens.length === 0) {
      plan.skipped.noToken += 1;
      continue;
    }

    const subject = input.subjects.get(notification.id);
    const copy = renderNotificationCopy(
      {
        type: notification.type,
        courseTitle: subject?.courseTitle ?? null,
        actorName: subject?.actorName ?? null,
        subjectTitle: subject?.subjectTitle ?? null,
        dueAt: subject?.dueAt ?? null,
        startsAt: subject?.startsAt ?? null,
        completedCount: subject?.completedCount ?? null,
        requiredCount: subject?.requiredCount ?? null
      },
      input.now,
      input.localeByProfile?.get(notification.profileId)
    );
    const deepLink = buildNotificationDeepLink({
      type: notification.type,
      entityId: notification.entityId,
      courseId: notification.courseId,
      subjectSlug: subject?.subjectSlug ?? null
    });
    const badge = input.unreadByProfile.get(notification.profileId);

    for (const token of tokens) {
      plan.messages.push({
        to: token.token,
        title: copy.title,
        ...(copy.body ? { body: copy.body } : {}),
        data: {
          notificationId: notification.id,
          type: notification.type,
          entityId: notification.entityId,
          deepLink,
          orgId: notification.organizationId
        },
        ...(badge !== undefined ? { badge } : {}),
        sound: 'default',
        threadId: category
      });
    }
  }

  plan.deferrals = [...deferralsByDelay.entries()].map(([delayMs, notificationIds]) => ({ delayMs, notificationIds }));

  return plan;
}
