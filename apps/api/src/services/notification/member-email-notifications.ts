import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getOrganizationMemberEmailNotificationsForApi,
  upsertOrganizationMemberEmailNotifications
} from '@cio/db/queries/notifications';
import { memberEmailNotificationRowToApiResponse } from '@cio/utils/notifications';
import type { TMemberEmailNotificationPreferencesUpdate } from '@cio/utils/validation/notifications';

export async function getMemberEmailNotificationPreferences(profileId: string, organizationId: string) {
  return getOrganizationMemberEmailNotificationsForApi(profileId, organizationId);
}

export async function updateMemberEmailNotificationPreferences(
  profileId: string,
  organizationId: string,
  preferences: TMemberEmailNotificationPreferencesUpdate
) {
  try {
    const updated = await upsertOrganizationMemberEmailNotifications(profileId, organizationId, preferences);

    return memberEmailNotificationRowToApiResponse(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'Organization member not found') {
      throw new AppError('Organization member not found', ErrorCodes.NOT_FOUND, 404);
    }

    throw error;
  }
}
