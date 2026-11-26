import {
  resolveEmailDelivery,
  type EmailNotificationSettings,
  type PersonalEmailNotificationSettings
} from '@cio/utils/notifications';

import { getOrganizationEmailNotificationSettings } from './email-preferences-org';
import {
  getPersonalEmailNotificationSettingsForOrg,
  getPersonalEmailNotificationSettingsForOrgMembers
} from './organizationmember-email-notifications';
import { getProfileByEmail, getProfilesByEmails } from '../auth/profile';
import type { EmailId } from '@cio/email';

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
  private personalSettingsByOrgMember = new Map<string, PersonalEmailNotificationSettings | undefined>();
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

    const personalSettings =
      profileId && input.organizationId ? await this.getPersonalSettings(profileId, input.organizationId) : undefined;

    return resolveEmailDelivery(input.emailId, orgSettings, personalSettings);
  }

  /**
   * Loads org settings, profile ids by email and personal settings for many recipients in a few queries, so later
   * `shouldSend` calls for them hit the cache.
   */
  async prime(input: { organizationId?: string; profileIds?: string[]; emails?: string[] }): Promise<void> {
    const { organizationId } = input;

    if (organizationId) {
      await this.getOrganizationSettings(organizationId);
    }

    const emails = [...new Set(input.emails ?? [])];
    const unknownEmails = emails.filter((email) => !this.profileIdByEmail.has(email));

    if (unknownEmails.length > 0) {
      const profiles = await getProfilesByEmails(unknownEmails);
      const profileIdByEmail = new Map(profiles.map((profile) => [profile.email, profile.id]));

      for (const email of unknownEmails) {
        this.profileIdByEmail.set(email, profileIdByEmail.get(email));
      }
    }

    if (!organizationId) return;

    const profileIds = new Set([
      ...(input.profileIds ?? []),
      ...emails.map((email) => this.profileIdByEmail.get(email)).filter((id): id is string => Boolean(id))
    ]);
    const unknownProfileIds = [...profileIds].filter(
      (profileId) => !this.personalSettingsByOrgMember.has(`${profileId}:${organizationId}`)
    );

    if (unknownProfileIds.length === 0) return;

    const settingsByProfileId = await getPersonalEmailNotificationSettingsForOrgMembers(
      organizationId,
      unknownProfileIds
    );

    for (const profileId of unknownProfileIds) {
      this.personalSettingsByOrgMember.set(`${profileId}:${organizationId}`, settingsByProfileId.get(profileId));
    }
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

  private async getPersonalSettings(
    profileId: string,
    organizationId: string
  ): Promise<PersonalEmailNotificationSettings | undefined> {
    const cacheKey = `${profileId}:${organizationId}`;

    if (!this.personalSettingsByOrgMember.has(cacheKey)) {
      const settings = await getPersonalEmailNotificationSettingsForOrg(profileId, organizationId);
      this.personalSettingsByOrgMember.set(cacheKey, settings);
    }

    return this.personalSettingsByOrgMember.get(cacheKey);
  }
}
