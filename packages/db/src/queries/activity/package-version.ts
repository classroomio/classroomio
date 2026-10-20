import * as schema from '@db/schema';

import { and, asc, count, eq, inArray, max, ne, sql } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TContentPackageVersion, TNewContentPackageVersion } from '@db/types';

export async function createPackageVersion(
  values: TNewContentPackageVersion,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion> {
  try {
    const [created] = await dbClient.insert(schema.contentPackageVersion).values(values).returning();
    if (!created) throw new Error('Insert returned no row');

    return created;
  } catch (error) {
    console.error('createPackageVersion error:', error);
    throw new Error(`Failed to create package version: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPackageVersionById(
  versionId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.contentPackageVersion)
      .where(eq(schema.contentPackageVersion.id, versionId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getPackageVersionById error:', error);
    throw new Error(
      `Failed to get package version "${versionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listPackageVersionsByAsset(
  assetId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion[]> {
  try {
    return await dbClient
      .select()
      .from(schema.contentPackageVersion)
      .where(eq(schema.contentPackageVersion.assetId, assetId))
      .orderBy(asc(schema.contentPackageVersion.versionNumber));
  } catch (error) {
    console.error('listPackageVersionsByAsset error:', error);
    throw new Error(
      `Failed to list package versions for asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCurrentPackageVersion(
  assetId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.contentPackageVersion)
      .where(and(eq(schema.contentPackageVersion.assetId, assetId), eq(schema.contentPackageVersion.isCurrent, true)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCurrentPackageVersion error:', error);
    throw new Error(
      `Failed to get current package version for asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getNextPackageVersionNumber(assetId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ value: max(schema.contentPackageVersion.versionNumber) })
      .from(schema.contentPackageVersion)
      .where(eq(schema.contentPackageVersion.assetId, assetId));

    return (row?.value ?? 0) + 1;
  } catch (error) {
    console.error('getNextPackageVersionNumber error:', error);
    throw new Error(
      `Failed to get next package version number for asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Locks one asset row for the rest of the caller's transaction. Version
 * allocation and current-version switches take this lock so parallel uploads
 * for the same asset cannot claim the same number or clobber each other.
 */
export async function lockAssetRow(assetId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await dbClient.select({ id: schema.asset.id }).from(schema.asset).where(eq(schema.asset.id, assetId)).for('update');
  } catch (error) {
    console.error('lockAssetRow error:', error);
    throw new Error(`Failed to lock asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updatePackageVersion(
  versionId: string,
  patch: Partial<TContentPackageVersion>,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion | null> {
  try {
    const updatedAt = new Date().toISOString();
    const [updated] = await dbClient
      .update(schema.contentPackageVersion)
      .set({ ...patch, updatedAt })
      .where(eq(schema.contentPackageVersion.id, versionId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updatePackageVersion error:', error);
    throw new Error(
      `Failed to update package version "${versionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Atomically claims an `uploading` version for processing. Returns null when
 * another request already moved it out of `uploading`.
 */
export async function claimPackageVersionForProcessing(
  versionId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion | null> {
  try {
    const updatedAt = new Date().toISOString();
    const [claimed] = await dbClient
      .update(schema.contentPackageVersion)
      .set({ status: 'processing', updatedAt })
      .where(and(eq(schema.contentPackageVersion.id, versionId), eq(schema.contentPackageVersion.status, 'uploading')))
      .returning();

    return claimed ?? null;
  } catch (error) {
    console.error('claimPackageVersionForProcessing error:', error);
    throw new Error(
      `Failed to claim package version "${versionId}" for processing: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Makes a ready version current, clearing the previous current version first.
 * Sets `replaced_at` on the version it replaces in the same transaction.
 * Throws when the version is missing or not ready.
 */
export async function setCurrentPackageVersion(
  versionId: string,
  dbClient?: DbOrTxClient
): Promise<TContentPackageVersion> {
  const run = async (client: DbOrTxClient): Promise<TContentPackageVersion> => {
    const candidate = await getPackageVersionById(versionId, client);
    if (!candidate) throw new Error(`Package version "${versionId}" not found`);
    await lockAssetRow(candidate.assetId, client);
    const version = await getPackageVersionById(versionId, client);
    if (!version) throw new Error(`Package version "${versionId}" not found`);
    if (version.status !== 'ready') throw new Error(`Package version "${versionId}" is not ready`);

    const now = new Date().toISOString();
    await client
      .update(schema.contentPackageVersion)
      .set({ isCurrent: false, replacedAt: now, updatedAt: now })
      .where(
        and(
          eq(schema.contentPackageVersion.assetId, version.assetId),
          eq(schema.contentPackageVersion.isCurrent, true),
          ne(schema.contentPackageVersion.id, versionId)
        )
      );

    const [current] = await client
      .update(schema.contentPackageVersion)
      .set({ isCurrent: true, replacedAt: null, updatedAt: now })
      .where(eq(schema.contentPackageVersion.id, versionId))
      .returning();
    if (!current) throw new Error(`Package version "${versionId}" not found`);

    return current;
  };

  try {
    if (dbClient) return await run(dbClient);

    return await db.transaction((tx) => run(tx));
  } catch (error) {
    console.error('setCurrentPackageVersion error:', error);
    throw new Error(
      `Failed to set current package version "${versionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countReadyPackageVersionsByAsset(
  assetIds: string[],
  dbClient: DbOrTxClient = db
): Promise<Record<string, number>> {
  try {
    if (assetIds.length === 0) return {};

    const rows = await dbClient
      .select({ assetId: schema.contentPackageVersion.assetId, total: count(schema.contentPackageVersion.id) })
      .from(schema.contentPackageVersion)
      .where(
        and(inArray(schema.contentPackageVersion.assetId, assetIds), eq(schema.contentPackageVersion.status, 'ready'))
      )
      .groupBy(schema.contentPackageVersion.assetId);

    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.assetId] = Number(row.total);

    return counts;
  } catch (error) {
    console.error('countReadyPackageVersionsByAsset error:', error);
    throw new Error(
      `Failed to count ready package versions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface ActivityCurrentPackageVersion {
  activityId: string;
  assetId: string | null;
  versionId: string | null;
  versionUpdatedAt: string | null;
}

/**
 * Returns the current package version of each activity. Activities without a
 * package, or whose package has no current version, yield null version fields.
 */
export async function listCurrentPackageVersionsForActivities(
  activityIds: string[],
  dbClient: DbOrTxClient = db
): Promise<ActivityCurrentPackageVersion[]> {
  try {
    if (activityIds.length === 0) return [];

    return await dbClient
      .select({
        activityId: schema.activityScorm.activityId,
        assetId: schema.activityScorm.assetId,
        versionId: schema.contentPackageVersion.id,
        versionUpdatedAt: schema.contentPackageVersion.updatedAt
      })
      .from(schema.activityScorm)
      .leftJoin(
        schema.contentPackageVersion,
        and(
          eq(schema.contentPackageVersion.assetId, schema.activityScorm.assetId),
          eq(schema.contentPackageVersion.isCurrent, true)
        )
      )
      .where(inArray(schema.activityScorm.activityId, activityIds));
  } catch (error) {
    console.error('listCurrentPackageVersionsForActivities error:', error);
    throw new Error(
      `Failed to list current package versions for activities: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function lockPackageVersionRow(versionId: string, dbClient: DbOrTxClient): Promise<void> {
  try {
    await dbClient
      .select({ id: schema.contentPackageVersion.id })
      .from(schema.contentPackageVersion)
      .where(eq(schema.contentPackageVersion.id, versionId))
      .for('update');
  } catch (error) {
    console.error('lockPackageVersionRow error:', error);
    throw new Error(
      `Failed to lock package version "${versionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface VersionDueForRetention {
  id: string;
  assetId: string;
  contentPrefix: string;
  uploadKey: string;
  versionNumber: number;
  status: string;
  replacedAt: string | null;
  hasAttempts: boolean;
  hasOpenAttempts: boolean;
}

/**
 * Lists replaced versions past the cutoff. Retention decides per version:
 * never launched rows are deleted, launched rows with only closed attempts
 * are archived, rows with an open attempt are kept.
 */
export async function listVersionsDueForRetention(
  cutoffIso: string,
  dbClient: DbOrTxClient = db,
  versionId?: string
): Promise<VersionDueForRetention[]> {
  try {
    const result = await dbClient.execute(sql`
      SELECT v.id, v.asset_id, v.content_prefix, v.upload_key, v.version_number, v.status, v.replaced_at,
        EXISTS (SELECT 1 FROM scorm_attempt a WHERE a.package_version_id = v.id) AS has_attempts,
        EXISTS (SELECT 1 FROM scorm_attempt a WHERE a.package_version_id = v.id AND a.closed_at IS NULL) AS has_open_attempts
      FROM content_package_version v
      WHERE v.is_current = false
        AND v.replaced_at IS NOT NULL
        AND v.replaced_at < ${cutoffIso}
        AND v.status != 'archived'
        AND ${versionId ? sql`v.id = ${versionId}` : sql`true`}
      ORDER BY v.replaced_at ASC`);

    return (result as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row['id']),
      assetId: String(row['asset_id']),
      contentPrefix: String(row['content_prefix']),
      uploadKey: String(row['upload_key']),
      versionNumber: Number(row['version_number']),
      status: String(row['status']),
      replacedAt: row['replaced_at'] === null ? null : String(row['replaced_at']),
      hasAttempts: row['has_attempts'] === true,
      hasOpenAttempts: row['has_open_attempts'] === true
    }));
  } catch (error) {
    console.error('listVersionsDueForRetention error:', error);
    throw new Error(
      `Failed to list package versions due for retention older than "${cutoffIso}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Marks a replaced version archived after its extracted files are deleted.
 * The ZIP and rows stay for audits. Returns the updated row, or null when
 * the version is missing.
 */
export async function markPackageVersionArchived(
  versionId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion | null> {
  try {
    const now = new Date().toISOString();
    const [archived] = await dbClient
      .update(schema.contentPackageVersion)
      .set({ status: 'archived', archivedAt: now, updatedAt: now })
      .where(eq(schema.contentPackageVersion.id, versionId))
      .returning();

    return archived ?? null;
  } catch (error) {
    console.error('markPackageVersionArchived error:', error);
    throw new Error(
      `Failed to archive package version "${versionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes package versions by id. Units cascade; attempts restrict, so
 * callers must pass only unreferenced versions. Returns the deleted ids.
 */
export async function deletePackageVersionsByIds(versionIds: string[], dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    if (versionIds.length === 0) return [];

    const deleted = await dbClient
      .delete(schema.contentPackageVersion)
      .where(inArray(schema.contentPackageVersion.id, versionIds))
      .returning({ id: schema.contentPackageVersion.id });

    return deleted.map((row) => row.id);
  } catch (error) {
    console.error('deletePackageVersionsByIds error:', error);
    throw new Error(`Failed to delete package versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
