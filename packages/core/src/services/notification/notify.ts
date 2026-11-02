import { insertNotifications } from '@cio/db/queries/notifications/notification';
import { filterActiveOrganizationMembers } from '@cio/db/queries/notifications/notification-recipients';
import type { TNewNotification } from '@cio/db/types';
import { enqueueSendPush } from '@cio/jobs';
import { NOTIFICATION_TYPE_CONFIG, type TNotificationType } from '@cio/utils/constants/notifications';

import { isPushConfigured } from './push-config';

export type NotifyInput = {
  organizationId: string;
  recipientProfileIds: string[];
  type: TNotificationType;
  entityId: string;
  courseId?: string | null;
  actorProfileId?: string | null;
  /** Makes the notification idempotent per recipient: a repeat call with the same key writes and pushes nothing. */
  dedupeKey?: string;
};

export type NotifyResult = { notificationIds: string[]; pushJobId: string | null };

const EMPTY_RESULT: NotifyResult = { notificationIds: [], pushJobId: null };

/**
 * Records one in-app notification per recipient who is an active member of the organization, skipping the actor,
 * then queues push delivery when push is configured. Category preferences are applied when the list is read and
 * when the push is sent. Email stays with each event's existing sender. Never throws: failures are logged.
 */
export async function notify(input: NotifyInput): Promise<NotifyResult> {
  try {
    const candidates = [...new Set(input.recipientProfileIds.filter(Boolean))].filter(
      (profileId) => profileId !== input.actorProfileId
    );
    if (candidates.length === 0) return EMPTY_RESULT;

    const members = await filterActiveOrganizationMembers(input.organizationId, candidates);
    if (members.length === 0) return EMPTY_RESULT;

    const { entityType } = NOTIFICATION_TYPE_CONFIG[input.type];
    const rows: TNewNotification[] = members.map((profileId) => ({
      profileId,
      organizationId: input.organizationId,
      type: input.type,
      entityType,
      entityId: input.entityId,
      courseId: input.courseId ?? null,
      actorProfileId: input.actorProfileId ?? null,
      dedupeKey: input.dedupeKey ?? null
    }));

    const inserted = await insertNotifications(rows);
    const notificationIds = inserted.map((row) => row.id);
    if (notificationIds.length === 0 || !isPushConfigured()) return { notificationIds, pushJobId: null };

    const pushJobId = await enqueueSendPush({ notificationIds }).catch((error: unknown) => {
      console.error('notify: failed to enqueue push', { type: input.type, error });

      return undefined;
    });

    return { notificationIds, pushJobId: pushJobId ?? null };
  } catch (error) {
    console.error('notify error:', { type: input.type, entityId: input.entityId, error });

    return EMPTY_RESULT;
  }
}
