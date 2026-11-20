import * as schema from '@db/schema';

import { asc, eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourseBuildSource, TNewCourseBuildSource } from '@db/types';

type CourseBuildSourcePatch = Partial<Omit<TNewCourseBuildSource, 'id' | 'jobId' | 'createdAt'>>;

export async function createCourseBuildSources(
  rows: TNewCourseBuildSource[],
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildSource[]> {
  if (!rows.length) return [];

  try {
    return await dbClient.insert(schema.courseBuildSource).values(rows).returning();
  } catch (error) {
    console.error('createCourseBuildSources error:', error);
    throw new Error('Failed to create course build sources');
  }
}

export async function listCourseBuildSources(
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildSource[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseBuildSource)
      .where(eq(schema.courseBuildSource.jobId, jobId))
      .orderBy(asc(schema.courseBuildSource.position));
  } catch (error) {
    console.error('listCourseBuildSources error:', error);
    throw new Error('Failed to list course build sources');
  }
}

export async function getCourseBuildSourceById(
  sourceId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildSource | null> {
  try {
    const [source] = await dbClient
      .select()
      .from(schema.courseBuildSource)
      .where(eq(schema.courseBuildSource.id, sourceId))
      .limit(1);

    return source ?? null;
  } catch (error) {
    console.error('getCourseBuildSourceById error:', error);
    throw new Error('Failed to fetch course build source');
  }
}

export async function updateCourseBuildSource(
  sourceId: string,
  patch: CourseBuildSourcePatch,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildSource | null> {
  try {
    const [source] = await dbClient
      .update(schema.courseBuildSource)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(schema.courseBuildSource.id, sourceId))
      .returning();

    return source ?? null;
  } catch (error) {
    console.error('updateCourseBuildSource error:', error);
    throw new Error('Failed to update course build source');
  }
}

/** How many of a job's sources are still pending or being read. */
export async function countUnfinishedCourseBuildSources(jobId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ unfinished: sql<number>`count(*)::int` })
      .from(schema.courseBuildSource)
      .where(
        sql`${schema.courseBuildSource.jobId} = ${jobId} and ${schema.courseBuildSource.status} in ('PENDING', 'READING')`
      );

    return row?.unfinished ?? 0;
  } catch (error) {
    console.error('countUnfinishedCourseBuildSources error:', error);
    throw new Error('Failed to count course build sources');
  }
}
