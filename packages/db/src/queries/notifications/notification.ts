import * as schema from '@db/schema';
import type { TNewNotification, TNotification } from '@db/types';
import type { TNotificationType } from '@cio/utils/constants/notifications';
import { and, count, desc, eq, inArray, isNull, lt, notInArray, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Inserts notification rows. Rows whose `(profileId, dedupeKey)` already exists are skipped, so only the rows that
 * were actually written come back.
 */
export async function insertNotifications(
  rows: TNewNotification[],
  dbClient: DbOrTxClient = db
): Promise<TNotification[]> {
  if (rows.length === 0) return [];

  try {
    return await dbClient
      .insert(schema.notification)
      .values(rows)
      .onConflictDoNothing({
        target: [schema.notification.profileId, schema.notification.dedupeKey],
        where: sql`${schema.notification.dedupeKey} IS NOT NULL`
      })
      .returning();
  } catch (error) {
    console.error('insertNotifications error:', error);
    throw new Error('Failed to insert notifications');
  }
}

function visibleTo(profileId: string, organizationId: string, hiddenTypes: TNotificationType[]) {
  return and(
    eq(schema.notification.profileId, profileId),
    eq(schema.notification.organizationId, organizationId),
    hiddenTypes.length > 0 ? notInArray(schema.notification.type, hiddenTypes) : undefined
  );
}

/** Newest first, keyset-paginated on `(createdAt, id)` starting after the `cursor` notification. */
export async function listNotificationsForProfile(params: {
  profileId: string;
  organizationId: string;
  hiddenTypes: TNotificationType[];
  cursor?: string;
  limit: number;
}): Promise<TNotification[]> {
  const { profileId, organizationId, hiddenTypes, cursor, limit } = params;

  try {
    const cursorRow = cursor
      ? await db
          .select({ id: schema.notification.id, createdAt: schema.notification.createdAt })
          .from(schema.notification)
          .where(and(eq(schema.notification.id, cursor), eq(schema.notification.profileId, profileId)))
          .limit(1)
      : [];
    const after = cursorRow[0];

    return await db
      .select()
      .from(schema.notification)
      .where(
        and(
          visibleTo(profileId, organizationId, hiddenTypes),
          after
            ? or(
                lt(schema.notification.createdAt, after.createdAt),
                and(eq(schema.notification.createdAt, after.createdAt), lt(schema.notification.id, after.id))
              )
            : undefined
        )
      )
      .orderBy(desc(schema.notification.createdAt), desc(schema.notification.id))
      .limit(limit);
  } catch (error) {
    console.error('listNotificationsForProfile error:', error);
    throw new Error('Failed to list notifications');
  }
}

export async function countUnreadNotifications(params: {
  profileId: string;
  organizationId: string;
  hiddenTypes: TNotificationType[];
}): Promise<number> {
  try {
    const [row] = await db
      .select({ value: count() })
      .from(schema.notification)
      .where(
        and(visibleTo(params.profileId, params.organizationId, params.hiddenTypes), isNull(schema.notification.readAt))
      );

    return row?.value ?? 0;
  } catch (error) {
    console.error('countUnreadNotifications error:', error);
    throw new Error('Failed to count unread notifications');
  }
}

/** Unread rows per profile across every organization, for the app icon badge sent with a push. */
export async function countUnreadNotificationsByProfile(profileIds: string[]): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();

  try {
    const rows = await db
      .select({ profileId: schema.notification.profileId, value: count() })
      .from(schema.notification)
      .where(and(inArray(schema.notification.profileId, profileIds), isNull(schema.notification.readAt)))
      .groupBy(schema.notification.profileId);

    return new Map(rows.map((row) => [row.profileId, row.value]));
  } catch (error) {
    console.error('countUnreadNotificationsByProfile error:', error);
    throw new Error('Failed to count unread notifications by profile');
  }
}

export async function getNotificationsByIds(ids: string[]): Promise<TNotification[]> {
  if (ids.length === 0) return [];

  try {
    return await db.select().from(schema.notification).where(inArray(schema.notification.id, ids));
  } catch (error) {
    console.error('getNotificationsByIds error:', error);
    throw new Error('Failed to get notifications');
  }
}

export async function markNotificationRead(params: {
  notificationId: string;
  profileId: string;
  organizationId: string;
}): Promise<TNotification | null> {
  try {
    const [row] = await db
      .update(schema.notification)
      .set({ readAt: sql`coalesce(${schema.notification.readAt}, now())` })
      .where(
        and(
          eq(schema.notification.id, params.notificationId),
          eq(schema.notification.profileId, params.profileId),
          eq(schema.notification.organizationId, params.organizationId)
        )
      )
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('markNotificationRead error:', error);
    throw new Error('Failed to mark notification read');
  }
}

export async function markAllNotificationsRead(params: { profileId: string; organizationId: string }): Promise<number> {
  try {
    const rows = await db
      .update(schema.notification)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(schema.notification.profileId, params.profileId),
          eq(schema.notification.organizationId, params.organizationId),
          isNull(schema.notification.readAt)
        )
      )
      .returning({ id: schema.notification.id });

    return rows.length;
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    throw new Error('Failed to mark notifications read');
  }
}
