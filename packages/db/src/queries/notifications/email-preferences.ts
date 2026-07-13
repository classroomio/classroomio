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
  return new EmailPreferenceLookupCache().shouldSend(input);
}

/**
 * Reuses org/profile settings lookups across many recipients in batch processors.
 */
export class EmailPreferenceLookupCache {
  private orgSettingsById = new Map<string, EmailNotificationSettings | undefined>();
  private profileSettingsById = new Map<string, PersonalEmailNotificationSettings | undefined>();
  private profileIdByEmail = new Map<string, string | undefined>();

  async shouldSend(input: {
    emailId: EmailId;
    organizationId?: string;
    recipientEmail?: string;
    recipientProfileId?: string;
  }): Promise<boolean> {
    const orgSettings = input.organizationId ? await this.getOrganizationSettings(input.organizationId) : undefined;

    let profileId = input.recipientProfileId;

    if (!profileId && input.recipientEmail) {
      profileId = await this.getProfileIdByEmail(input.recipientEmail);
    }

    const personalSettings = profileId ? await this.getProfileSettings(profileId) : undefined;

    return resolveEmailDelivery(input.emailId, orgSettings, personalSettings);
  }

  private async getOrganizationSettings(orgId: string): Promise<EmailNotificationSettings | undefined> {
    if (!this.orgSettingsById.has(orgId)) {
      const settings = await getOrganizationEmailNotificationSettings(orgId);
      this.orgSettingsById.set(orgId, settings);
    }

    return this.orgSettingsById.get(orgId);
  }

  private async getProfileIdByEmail(email: string): Promise<string | undefined> {
    if (!this.profileIdByEmail.has(email)) {
      const profile = await getProfileByEmail(email);
      this.profileIdByEmail.set(email, profile?.id);
    }

    return this.profileIdByEmail.get(email);
  }

  private async getProfileSettings(profileId: string): Promise<PersonalEmailNotificationSettings | undefined> {
    if (!this.profileSettingsById.has(profileId)) {
      const settings = await getProfileEmailNotificationSettingsById(profileId);
      this.profileSettingsById.set(profileId, settings);
    }

    return this.profileSettingsById.get(profileId);
  }
}
