import * as schema from '@db/schema';

import { and, asc, count, eq, inArray, max, sql } from '@db/drizzle';
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

export async function updatePackageVersion(
  versionId: string,
  patch: Partial<TContentPackageVersion>,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion | null> {
  try {
    const [updated] = await dbClient
      .update(schema.contentPackageVersion)
      .set({ ...patch, updatedAt: new Date().toISOString() })
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
 * Makes a ready version current, clearing the previous current version first.
 * Throws when the version is missing or not ready.
 */
export async function setCurrentPackageVersion(
  versionId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageVersion> {
  try {
    const version = await getPackageVersionById(versionId, dbClient);
    if (!version) throw new Error(`Package version "${versionId}" not found`);
    if (version.status !== 'ready') throw new Error(`Package version "${versionId}" is not ready`);

    await dbClient
      .update(schema.contentPackageVersion)
      .set({ isCurrent: false, updatedAt: new Date().toISOString() })
      .where(
        and(eq(schema.contentPackageVersion.assetId, version.assetId), eq(schema.contentPackageVersion.isCurrent, true))
      );

    const [current] = await dbClient
      .update(schema.contentPackageVersion)
      .set({ isCurrent: true, updatedAt: new Date().toISOString() })
      .where(eq(schema.contentPackageVersion.id, versionId))
      .returning();
    if (!current) throw new Error(`Package version "${versionId}" not found`);

    return current;
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

export interface StaleUnpinnedPackageVersion {
  id: string;
  assetId: string;
  contentPrefix: string;
  uploadKey: string;
  versionNumber: number;
}

/**
 * Lists versions replaced before the cutoff that no attempt references.
 * Only versions superseded by a newer current version qualify; versions
 * that were never current are left alone.
 */
export async function listStaleUnpinnedPackageVersions(
  cutoffIso: string,
  dbClient: DbOrTxClient = db
): Promise<StaleUnpinnedPackageVersion[]> {
  try {
    const result = await dbClient.execute(sql`
      SELECT v.id, v.asset_id, v.content_prefix, v.upload_key, v.version_number
      FROM content_package_version v
      WHERE v.is_current = false
        AND v.updated_at < ${cutoffIso}
        AND EXISTS (
          SELECT 1 FROM content_package_version current
          WHERE current.asset_id = v.asset_id
            AND current.is_current = true
            AND current.version_number > v.version_number
        )
        AND NOT EXISTS (
          SELECT 1 FROM scorm_attempt a WHERE a.package_version_id = v.id
        )
      ORDER BY v.updated_at ASC`);

    return (result as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row['id']),
      assetId: String(row['asset_id']),
      contentPrefix: String(row['content_prefix']),
      uploadKey: String(row['upload_key']),
      versionNumber: Number(row['version_number'])
    }));
  } catch (error) {
    console.error('listStaleUnpinnedPackageVersions error:', error);
    throw new Error(
      `Failed to list stale package versions older than "${cutoffIso}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
