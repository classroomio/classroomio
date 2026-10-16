import * as schema from '@db/schema';

import { and, asc, eq, inArray } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TContentPackageUnit, TNewContentPackageUnit } from '@db/types';

export async function bulkInsertPackageUnits(
  values: TNewContentPackageUnit[],
  dbClient: DbOrTxClient = db
): Promise<TContentPackageUnit[]> {
  try {
    if (values.length === 0) return [];

    return await dbClient.insert(schema.contentPackageUnit).values(values).returning();
  } catch (error) {
    console.error('bulkInsertPackageUnits error:', error);
    throw new Error(`Failed to insert package units: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPackageUnitById(
  unitId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageUnit | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.contentPackageUnit)
      .where(eq(schema.contentPackageUnit.id, unitId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getPackageUnitById error:', error);
    throw new Error(
      `Failed to get package unit "${unitId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listPackageUnitsByVersion(
  packageVersionId: string,
  dbClient: DbOrTxClient = db
): Promise<TContentPackageUnit[]> {
  try {
    return await dbClient
      .select()
      .from(schema.contentPackageUnit)
      .where(eq(schema.contentPackageUnit.packageVersionId, packageVersionId))
      .orderBy(asc(schema.contentPackageUnit.position));
  } catch (error) {
    console.error('listPackageUnitsByVersion error:', error);
    throw new Error(
      `Failed to list package units for version "${packageVersionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deletePackageUnitsByVersion(
  packageVersionId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const deleted = await dbClient
      .delete(schema.contentPackageUnit)
      .where(eq(schema.contentPackageUnit.packageVersionId, packageVersionId))
      .returning({ id: schema.contentPackageUnit.id });

    return deleted.length;
  } catch (error) {
    console.error('deletePackageUnitsByVersion error:', error);
    throw new Error(
      `Failed to delete package units for version "${packageVersionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface ScormUnitSummary {
  activityId: string;
  identifier: string;
  title: string;
  position: number;
}

export interface PackageVersionUnitSummary {
  versionId: string;
  unitCount: number;
  firstPassMark: number | null;
}

function passMarkOf(
  masteryScoreRaw: string | number | null,
  passingScoreScaled: string | number | null
): number | null {
  const rawMastery =
    typeof masteryScoreRaw === 'string' || typeof masteryScoreRaw === 'number' ? Number(masteryScoreRaw) : NaN;
  if (Number.isFinite(rawMastery)) return rawMastery;

  const rawScaled =
    typeof passingScoreScaled === 'string' || typeof passingScoreScaled === 'number' ? Number(passingScoreScaled) : NaN;
  if (Number.isFinite(rawScaled)) return Math.round(rawScaled * 100);

  return null;
}

/**
 * Per-version module counts and first pass marks for every version of an
 * asset, in version order. Lets version history show an older version's own
 * numbers without hauling every version's unit rows.
 */
export async function getPackageVersionUnitSummaries(
  assetId: string,
  dbClient: DbOrTxClient = db
): Promise<PackageVersionUnitSummary[]> {
  try {
    const rows = await dbClient
      .select({
        versionId: schema.contentPackageVersion.id,
        versionNumber: schema.contentPackageVersion.versionNumber,
        masteryScoreRaw: schema.contentPackageUnit.masteryScoreRaw,
        passingScoreScaled: schema.contentPackageUnit.passingScoreScaled,
        position: schema.contentPackageUnit.position
      })
      .from(schema.contentPackageUnit)
      .innerJoin(
        schema.contentPackageVersion,
        eq(schema.contentPackageUnit.packageVersionId, schema.contentPackageVersion.id)
      )
      .where(eq(schema.contentPackageVersion.assetId, assetId))
      .orderBy(asc(schema.contentPackageVersion.versionNumber), asc(schema.contentPackageUnit.position));

    const byVersion = new Map<string, { unitCount: number; firstPassMark: number | null }>();
    for (const row of rows) {
      const summary = byVersion.get(row.versionId) ?? { unitCount: 0, firstPassMark: null };
      summary.unitCount += 1;
      if (summary.firstPassMark === null) {
        summary.firstPassMark = passMarkOf(row.masteryScoreRaw, row.passingScoreScaled);
      }
      byVersion.set(row.versionId, summary);
    }

    return [...byVersion].map(([versionId, summary]) => ({ versionId, ...summary }));
  } catch (error) {
    console.error('getPackageVersionUnitSummaries error:', error);
    throw new Error(
      `Failed to get package version unit summaries for asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Launchable module summaries for the current package versions of the given
 * activities, in manifest order. Activities without a current version yield
 * no rows.
 */
export async function listScormUnitSummariesForActivities(
  activityIds: string[],
  dbClient: DbOrTxClient = db
): Promise<ScormUnitSummary[]> {
  try {
    if (activityIds.length === 0) return [];

    const rows = await dbClient
      .select({
        activityId: schema.activityScorm.activityId,
        identifier: schema.contentPackageUnit.identifier,
        title: schema.contentPackageUnit.title,
        position: schema.contentPackageUnit.position
      })
      .from(schema.contentPackageUnit)
      .innerJoin(
        schema.contentPackageVersion,
        eq(schema.contentPackageUnit.packageVersionId, schema.contentPackageVersion.id)
      )
      .innerJoin(schema.activityScorm, eq(schema.activityScorm.assetId, schema.contentPackageVersion.assetId))
      .where(
        and(
          inArray(schema.activityScorm.activityId, activityIds),
          eq(schema.contentPackageVersion.isCurrent, true),
          eq(schema.contentPackageUnit.unitType, 'sco')
        )
      )
      .orderBy(asc(schema.contentPackageUnit.position));

    return rows;
  } catch (error) {
    console.error('listScormUnitSummariesForActivities error:', error);
    throw new Error(
      `Failed to list package units for activities: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
