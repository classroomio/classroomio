import { AppError, ErrorCodes } from '@api/utils/errors';
import { isPushConfigured } from '@cio/core/services/notification/push-config';
import { db } from '@cio/db/drizzle';
import { getOrganizationEmailNotificationSettings } from '@cio/db/queries/notifications/email-preferences-org';
import {
  deleteQuietHours,
  listNotificationPreferences,
  listQuietHours,
  upsertNotificationPreferences,
  upsertQuietHours
} from '@cio/db/queries/notifications/notification-preferences';
import {
  getOrganizationMemberEmailNotificationsForApi,
  upsertOrganizationMemberEmailNotifications
} from '@cio/db/queries/notifications/organizationmember-email-notifications';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_CONFIG,
  type TNotificationCategory
} from '@cio/utils/constants/notifications';
import type { PersonalEmailNotificationSettings } from '@cio/utils/notifications';
import type { TNotificationPreferencesUpdate } from '@cio/utils/validation/notifications';

function isKnownTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });

    return true;
  } catch {
    return false;
  }
}

/**
 * Per-category push, in-app and email switches plus quiet hours. Push, in-app and quiet hours belong to the
 * profile. Email reads and writes the member's existing per-organization email toggles, so the web settings and
 * the app share one source; `email` is null when the category sends no email or the organization turned it off.
 */
export async function getNotificationPreferences(profileId: string, organizationId: string) {
  const [preferences, quietHoursRows, emailToggles, orgEmailSettings] = await Promise.all([
    listNotificationPreferences([profileId]),
    listQuietHours([profileId]),
    getOrganizationMemberEmailNotificationsForApi(profileId, organizationId),
    getOrganizationEmailNotificationSettings(organizationId)
  ]);
  const preferenceByCategory = new Map(preferences.map((row) => [row.category, row]));
  const quietHours = quietHoursRows[0];

  const categories = NOTIFICATION_CATEGORIES.map((category) => {
    const config = NOTIFICATION_CATEGORY_CONFIG[category];
    const preference = preferenceByCategory.get(category);
    const emailToggle = config.emailToggle;
    const emailOffForOrg = emailToggle ? orgEmailSettings?.[emailToggle] === false : true;

    return {
      category,
      locked: config.locked,
      push: config.locked || (preference?.push ?? true),
      inApp: config.locked || (preference?.inApp ?? true),
      email: emailToggle && !emailOffForOrg ? emailToggles[emailToggle] : null
    };
  });

  return {
    categories,
    quietHours: quietHours
      ? { startMinute: quietHours.startMinute, endMinute: quietHours.endMinute, timezone: quietHours.timezone }
      : null,
    pushAvailable: isPushConfigured()
  };
}

export async function updateNotificationPreferences(
  profileId: string,
  organizationId: string,
  update: TNotificationPreferencesUpdate
) {
  if (update.quietHours && !isKnownTimezone(update.quietHours.timezone)) {
    throw new AppError('Unknown time zone', ErrorCodes.VALIDATION_ERROR, 400, 'quietHours.timezone');
  }

  const changes = update.categories ?? [];
  const existing = await listNotificationPreferences([profileId]);
  const existingByCategory = new Map(existing.map((row) => [row.category, row]));

  const channelRows = changes
    .filter((change) => change.push !== undefined || change.inApp !== undefined)
    .map((change) => {
      const locked = NOTIFICATION_CATEGORY_CONFIG[change.category].locked;
      const current = existingByCategory.get(change.category);

      return {
        profileId,
        category: change.category,
        push: locked || (change.push ?? current?.push ?? true),
        inApp: locked || (change.inApp ?? current?.inApp ?? true)
      };
    });

  const emailChanges: PersonalEmailNotificationSettings = {};
  for (const change of changes) {
    const emailToggle = NOTIFICATION_CATEGORY_CONFIG[change.category as TNotificationCategory].emailToggle;
    if (emailToggle && change.email !== undefined) emailChanges[emailToggle] = change.email;
  }

  await db.transaction(async (tx) => {
    await upsertNotificationPreferences(channelRows, tx);

    if (update.quietHours === null) {
      await deleteQuietHours(profileId, tx);
    } else if (update.quietHours) {
      await upsertQuietHours({ profileId, ...update.quietHours }, tx);
    }
  });

  if (Object.keys(emailChanges).length > 0) {
    try {
      await upsertOrganizationMemberEmailNotifications(profileId, organizationId, emailChanges);
    } catch (error) {
      if (error instanceof Error && error.message === 'Organization member not found') {
        throw new AppError('Organization member not found', ErrorCodes.NOT_FOUND, 404);
      }

      throw error;
    }
  }

  return getNotificationPreferences(profileId, organizationId);
}
