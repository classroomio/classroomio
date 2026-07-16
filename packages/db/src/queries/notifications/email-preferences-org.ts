import { db } from '@db/drizzle';
import * as schema from '@db/schema';
import { eq } from 'drizzle-orm';
import type { EmailNotificationSettings } from '@cio/utils/notifications';

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
