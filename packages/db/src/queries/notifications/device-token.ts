import * as schema from '@db/schema';
import type { TDeviceToken } from '@db/types';
import type { TDevicePlatform } from '@cio/utils/constants/notifications';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

/**
 * Registers a token for a profile, or refreshes it. A token re-registered by a different profile (another account
 * signed in on the same device) moves to that profile, and a disabled token is re-enabled.
 */
export async function upsertDeviceToken(values: {
  profileId: string;
  token: string;
  platform: TDevicePlatform;
  appVersion?: string | null;
  deviceName?: string | null;
  locale?: string | null;
}): Promise<TDeviceToken> {
  try {
    const [row] = await db
      .insert(schema.deviceToken)
      .values(values)
      .onConflictDoUpdate({
        target: schema.deviceToken.token,
        set: {
          profileId: values.profileId,
          platform: values.platform,
          appVersion: values.appVersion ?? null,
          deviceName: values.deviceName ?? null,
          locale: values.locale ?? null,
          disabledAt: null,
          lastSeenAt: sql`now()`,
          updatedAt: sql`now()`
        }
      })
      .returning();

    return row!;
  } catch (error) {
    console.error('upsertDeviceToken error:', error);
    throw new Error('Failed to register device token');
  }
}

export async function deleteDeviceToken(profileId: string, token: string): Promise<boolean> {
  try {
    const rows = await db
      .delete(schema.deviceToken)
      .where(and(eq(schema.deviceToken.profileId, profileId), eq(schema.deviceToken.token, token)))
      .returning({ id: schema.deviceToken.id });

    return rows.length > 0;
  } catch (error) {
    console.error('deleteDeviceToken error:', error);
    throw new Error('Failed to delete device token');
  }
}

export async function listActiveDeviceTokens(profileIds: string[]): Promise<TDeviceToken[]> {
  if (profileIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(schema.deviceToken)
      .where(and(inArray(schema.deviceToken.profileId, profileIds), isNull(schema.deviceToken.disabledAt)));
  } catch (error) {
    console.error('listActiveDeviceTokens error:', error);
    throw new Error('Failed to list device tokens');
  }
}

export async function disableDeviceTokens(tokens: string[]): Promise<number> {
  if (tokens.length === 0) return 0;

  try {
    const rows = await db
      .update(schema.deviceToken)
      .set({ disabledAt: sql`now()`, updatedAt: sql`now()` })
      .where(and(inArray(schema.deviceToken.token, tokens), isNull(schema.deviceToken.disabledAt)))
      .returning({ id: schema.deviceToken.id });

    return rows.length;
  } catch (error) {
    console.error('disableDeviceTokens error:', error);
    throw new Error('Failed to disable device tokens');
  }
}
