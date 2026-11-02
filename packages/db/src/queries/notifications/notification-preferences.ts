import * as schema from '@db/schema';
import type { TNotificationPreference, TProfileQuietHours } from '@db/types';
import type { TNotificationCategory } from '@cio/utils/constants/notifications';
import { eq, inArray, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export async function listNotificationPreferences(profileIds: string[]): Promise<TNotificationPreference[]> {
  if (profileIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(schema.notificationPreference)
      .where(inArray(schema.notificationPreference.profileId, profileIds));
  } catch (error) {
    console.error('listNotificationPreferences error:', error);
    throw new Error('Failed to list notification preferences');
  }
}

export async function upsertNotificationPreferences(
  rows: Array<{ profileId: string; category: TNotificationCategory; push: boolean; inApp: boolean }>,
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (rows.length === 0) return;

  try {
    await dbClient
      .insert(schema.notificationPreference)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.notificationPreference.profileId, schema.notificationPreference.category],
        set: {
          push: sql`excluded.push`,
          inApp: sql`excluded.in_app`,
          updatedAt: sql`now()`
        }
      });
  } catch (error) {
    console.error('upsertNotificationPreferences error:', error);
    throw new Error('Failed to update notification preferences');
  }
}

export async function listQuietHours(profileIds: string[]): Promise<TProfileQuietHours[]> {
  if (profileIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(schema.profileQuietHours)
      .where(inArray(schema.profileQuietHours.profileId, profileIds));
  } catch (error) {
    console.error('listQuietHours error:', error);
    throw new Error('Failed to list quiet hours');
  }
}

export async function upsertQuietHours(
  values: { profileId: string; startMinute: number; endMinute: number; timezone: string },
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .insert(schema.profileQuietHours)
      .values(values)
      .onConflictDoUpdate({
        target: schema.profileQuietHours.profileId,
        set: {
          startMinute: values.startMinute,
          endMinute: values.endMinute,
          timezone: values.timezone,
          updatedAt: sql`now()`
        }
      });
  } catch (error) {
    console.error('upsertQuietHours error:', error);
    throw new Error('Failed to update quiet hours');
  }
}

export async function deleteQuietHours(profileId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await dbClient.delete(schema.profileQuietHours).where(eq(schema.profileQuietHours.profileId, profileId));
  } catch (error) {
    console.error('deleteQuietHours error:', error);
    throw new Error('Failed to clear quiet hours');
  }
}
