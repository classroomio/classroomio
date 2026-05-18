import * as schema from '@db/schema';

import { and, eq, inArray } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TMediaTranscript, TNewMediaTranscript } from '@db/types';

export type UpsertMediaTranscriptInput = Omit<TNewMediaTranscript, 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};

/**
 * Insert or replace transcript for an asset (one row per asset).
 */
export async function upsertMediaTranscript(
  input: UpsertMediaTranscriptInput,
  dbClient: DbOrTxClient = db
): Promise<TMediaTranscript> {
  try {
    const now = new Date().toISOString();
    const [row] = await dbClient
      .insert(schema.mediaTranscript)
      .values({
        ...input,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.mediaTranscript.assetId,
        set: {
          organizationId: input.organizationId,
          mediaJobId: input.mediaJobId ?? null,
          language: input.language,
          provider: input.provider,
          model: input.model,
          text: input.text,
          segments: input.segments,
          vttStorageKey: input.vttStorageKey,
          vttBucket: input.vttBucket,
          durationSeconds: input.durationSeconds ?? null,
          costCents: input.costCents,
          updatedAt: now
        }
      })
      .returning();

    if (!row) {
      throw new Error('Upsert returned no row');
    }

    return row;
  } catch (error) {
    console.error('upsertMediaTranscript error:', error);
    throw new Error('Failed to upsert media transcript');
  }
}

export async function getMediaTranscriptByAsset(
  assetId: string,
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<TMediaTranscript | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.mediaTranscript)
      .where(
        and(eq(schema.mediaTranscript.assetId, assetId), eq(schema.mediaTranscript.organizationId, organizationId))
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getMediaTranscriptByAsset error:', error);
    throw new Error('Failed to get media transcript by asset');
  }
}

export async function listMediaTranscriptsByAssetIds(
  assetIds: string[],
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<TMediaTranscript[]> {
  try {
    if (assetIds.length === 0) return [];

    return await dbClient
      .select()
      .from(schema.mediaTranscript)
      .where(
        and(
          inArray(schema.mediaTranscript.assetId, assetIds),
          eq(schema.mediaTranscript.organizationId, organizationId)
        )
      );
  } catch (error) {
    console.error('listMediaTranscriptsByAssetIds error:', error);
    throw new Error('Failed to list media transcripts by asset ids');
  }
}

/**
 * Returns true if any media_job for this asset is still queued or running.
 */
export async function hasActiveMediaJobForAsset(
  assetId: string,
  organizationId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.mediaJob.id })
      .from(schema.mediaJob)
      .where(
        and(
          eq(schema.mediaJob.assetId, assetId),
          eq(schema.mediaJob.organizationId, organizationId),
          inArray(schema.mediaJob.status, ['queued', 'running'])
        )
      )
      .limit(1);

    return row !== undefined;
  } catch (error) {
    console.error('hasActiveMediaJobForAsset error:', error);
    throw new Error('Failed to check active media job');
  }
}
