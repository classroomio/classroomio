import {
  resolveEmailDelivery,
  type EmailNotificationSettings,
  type PersonalEmailNotificationSettings
} from '@cio/utils/notifications';

import { getProfileByEmail, getProfileById } from '../auth/profile';
import { db } from '@db/drizzle';
import * as schema from '@db/schema';
import { eq } from 'drizzle-orm';
import type { EmailId } from '@cio/email';

export async function getOrganizationEmailNotificationSettings(
  orgId: string
): Promise<EmailNotificationSettings | undefined> {
  try {
    const [organization] = await db
      .select({ settings: schema.organization.settings })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    return organization?.settings?.emailNotifications;
  } catch (error) {
    console.error('getOrganizationEmailNotificationSettings error:', error);
    throw new Error('Failed to get organization email notification settings');
  }
}

export async function getProfileEmailNotificationSettingsById(
  profileId: string
): Promise<PersonalEmailNotificationSettings | undefined> {
  try {
    const profile = await getProfileById(profileId);

    return profile?.settings?.emailNotifications;
  } catch (error) {
    console.error('getProfileEmailNotificationSettingsById error:', error);
    throw new Error('Failed to get profile email notification settings');
  }
}

export async function getProfileEmailNotificationSettingsByEmail(
  email: string
): Promise<PersonalEmailNotificationSettings | undefined> {
  try {
    const profile = await getProfileByEmail(email);

    return profile?.settings?.emailNotifications;
  } catch (error) {
    console.error('getProfileEmailNotificationSettingsByEmail error:', error);
    throw new Error('Failed to get profile email notification settings');
  }
}

export async function shouldSendEmail(input: {
  emailId: EmailId;
  organizationId?: string;
  recipientEmail?: string;
  recipientProfileId?: string;
}): Promise<boolean> {
  let orgSettings: EmailNotificationSettings | undefined;

  if (input.organizationId) {
    orgSettings = await getOrganizationEmailNotificationSettings(input.organizationId);
  }

  let personalSettings: PersonalEmailNotificationSettings | undefined;
  let profileId = input.recipientProfileId;

  if (!profileId && input.recipientEmail) {
    const profile = await getProfileByEmail(input.recipientEmail);
    profileId = profile?.id;
  }

  if (profileId) {
    personalSettings = await getProfileEmailNotificationSettingsById(profileId);
  }

  return resolveEmailDelivery(input.emailId, orgSettings, personalSettings);
}
