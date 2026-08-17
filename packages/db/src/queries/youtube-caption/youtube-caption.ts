import * as schema from '@db/schema';

import { and, eq, gt, sql } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewYoutubeCaption, TYoutubeCaption } from '@db/types';

export type UpsertYoutubeCaptionInput = Omit<TNewYoutubeCaption, 'createdAt' | 'updatedAt' | 'id'>;

/**
 * Look up a caption row by YouTube video ID + language.
 * Returns `null` if no row exists or status is not `ready`.
 */
export async function getYoutubeCaption(
  youtubeVideoId: string,
  language: string,
  dbClient: DbOrTxClient = db
): Promise<TYoutubeCaption | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.youtubeCaption)
      .where(
        and(eq(schema.youtubeCaption.youtubeVideoId, youtubeVideoId), eq(schema.youtubeCaption.language, language))
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getYoutubeCaption error:', error);
    throw new Error('Failed to get YouTube caption');
  }
}

/**
 * Insert or replace a caption row. Upserts on `(youtubeVideoId, language)`.
 */
export async function upsertYoutubeCaption(
  input: UpsertYoutubeCaptionInput,
  dbClient: DbOrTxClient = db
): Promise<TYoutubeCaption> {
  try {
    const now = new Date().toISOString();
    const [row] = await dbClient
      .insert(schema.youtubeCaption)
      .values({
        ...input,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [schema.youtubeCaption.youtubeVideoId, schema.youtubeCaption.language],
        set: {
          status: input.status,
          unavailableReason: input.unavailableReason ?? null,
          isGenerated: input.isGenerated,
          text: input.text ?? null,
          segments: input.segments ?? null,
          provider: input.provider,
          sourceHash: input.sourceHash ?? null,
          costCents: input.costCents,
          fetchedAt: input.fetchedAt,
          expiresAt: input.expiresAt ?? null,
          updatedAt: now
        }
      })
      .returning();

    if (!row) {
      throw new Error('Upsert returned no row');
    }

    return row;
  } catch (error) {
    console.error('upsertYoutubeCaption error:', error);
    throw new Error('Failed to upsert YouTube caption');
  }
}

/**
 * Check for a recent unavailable entry that hasn't expired yet.
 * Returns the row if found, `null` otherwise.
 */
export async function getActiveNegativeYoutubeCaption(
  youtubeVideoId: string,
  language: string,
  dbClient: DbOrTxClient = db
): Promise<TYoutubeCaption | null> {
  try {
    const now = new Date().toISOString();
    const [row] = await dbClient
      .select()
      .from(schema.youtubeCaption)
      .where(
        and(
          eq(schema.youtubeCaption.youtubeVideoId, youtubeVideoId),
          eq(schema.youtubeCaption.language, language),
          eq(schema.youtubeCaption.status, 'unavailable'),
          gt(schema.youtubeCaption.expiresAt, now)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getActiveNegativeYoutubeCaption error:', error);
    throw new Error('Failed to check negative YouTube caption');
  }
}

/**
 * Delete expired unavailable rows. Optional maintenance cleanup.
 */
export async function deleteExpiredNegativeYoutubeCaption(dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const now = new Date().toISOString();
    const deleted = await dbClient
      .delete(schema.youtubeCaption)
      .where(
        and(
          eq(schema.youtubeCaption.status, 'unavailable'),
          sql`${schema.youtubeCaption.expiresAt} IS NOT NULL AND ${schema.youtubeCaption.expiresAt} < ${now}`
        )
      )
      .returning({ id: schema.youtubeCaption.id });

    return deleted.length;
  } catch (error) {
    console.error('deleteExpiredNegativeYoutubeCaption error:', error);
    throw new Error('Failed to delete expired negative YouTube captions');
  }
}
