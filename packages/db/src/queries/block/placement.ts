import * as schema from '@db/schema';

import type { TBlockPlacement, TNewBlockPlacement } from '@db/types';
import { and, db, eq, inArray, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

import type { LessonBlockRow } from './block';

const positionOrder = () => sql`${schema.blockPlacement.position} COLLATE "C"`;

export async function listLessonBlockRows(lessonId: string, dbClient: DbOrTxClient = db): Promise<LessonBlockRow[]> {
  try {
    return await dbClient
      .select({ placement: schema.blockPlacement, block: schema.block })
      .from(schema.blockPlacement)
      .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
      .where(eq(schema.blockPlacement.lessonId, lessonId))
      .orderBy(positionOrder());
  } catch (error) {
    console.error('listLessonBlockRows error:', error);
    throw new Error(
      `Failed to list blocks for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listBlockRowsForLessons(
  lessonIds: string[],
  dbClient: DbOrTxClient = db
): Promise<(LessonBlockRow & { lessonId: string })[]> {
  if (lessonIds.length === 0) return [];

  try {
    const rows = await dbClient
      .select({ placement: schema.blockPlacement, block: schema.block })
      .from(schema.blockPlacement)
      .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
      .where(inArray(schema.blockPlacement.lessonId, lessonIds))
      .orderBy(schema.blockPlacement.lessonId, positionOrder());

    return rows.map((row) => ({ ...row, lessonId: row.placement.lessonId }));
  } catch (error) {
    console.error('listBlockRowsForLessons error:', error);
    throw new Error(`Failed to list blocks for lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPlacementWithBlock(
  placementId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonBlockRow | null> {
  try {
    const [row] = await dbClient
      .select({ placement: schema.blockPlacement, block: schema.block })
      .from(schema.blockPlacement)
      .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
      .where(eq(schema.blockPlacement.id, placementId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getPlacementWithBlock error:', error);
    throw new Error(
      `Failed to get placement "${placementId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLessonBlockRow(
  lessonId: string,
  blockId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonBlockRow | null> {
  try {
    const [row] = await dbClient
      .select({ placement: schema.blockPlacement, block: schema.block })
      .from(schema.blockPlacement)
      .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
      .where(and(eq(schema.blockPlacement.lessonId, lessonId), eq(schema.blockPlacement.blockId, blockId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLessonBlockRow error:', error);
    throw new Error(`Failed to get lesson block: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Serializes position bookkeeping for one lesson inside the surrounding transaction, so two
 * concurrent inserts or moves cannot pick the same neighbouring keys.
 */
export async function lockLessonBlockPositions(lessonId: string, dbClient: DbOrTxClient = db) {
  try {
    await dbClient.execute(sql`select pg_advisory_xact_lock(hashtext(${`lesson_block_positions:${lessonId}`}))`);
  } catch (error) {
    console.error('lockLessonBlockPositions error:', error);
    throw new Error(`Failed to lock block positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPlacementPositions(
  lessonId: string,
  dbClient: DbOrTxClient = db
): Promise<{ id: string; position: string }[]> {
  try {
    return await dbClient
      .select({ id: schema.blockPlacement.id, position: schema.blockPlacement.position })
      .from(schema.blockPlacement)
      .where(eq(schema.blockPlacement.lessonId, lessonId))
      .orderBy(positionOrder());
  } catch (error) {
    console.error('getPlacementPositions error:', error);
    throw new Error(`Failed to get block positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createPlacement(
  values: TNewBlockPlacement,
  dbClient: DbOrTxClient = db
): Promise<TBlockPlacement> {
  try {
    const [placement] = await dbClient.insert(schema.blockPlacement).values(values).returning();
    if (!placement) {
      throw new Error('Insert returned no row');
    }

    return placement;
  } catch (error) {
    console.error('createPlacement error:', error);
    throw new Error(`Failed to create placement: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updatePlacement(
  placementId: string,
  values: Partial<Pick<TBlockPlacement, 'position' | 'required' | 'watchThreshold'>>,
  dbClient: DbOrTxClient = db
): Promise<TBlockPlacement | null> {
  try {
    const [placement] = await dbClient
      .update(schema.blockPlacement)
      .set(values)
      .where(eq(schema.blockPlacement.id, placementId))
      .returning();

    return placement ?? null;
  } catch (error) {
    console.error('updatePlacement error:', error);
    throw new Error(
      `Failed to update placement "${placementId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deletePlacements(placementIds: string[], dbClient: DbOrTxClient = db) {
  if (placementIds.length === 0) return [];

  try {
    return await dbClient
      .delete(schema.blockPlacement)
      .where(inArray(schema.blockPlacement.id, placementIds))
      .returning();
  } catch (error) {
    console.error('deletePlacements error:', error);
    throw new Error(`Failed to delete placements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function repointPlacement(
  placementId: string,
  blockId: string,
  dbClient: DbOrTxClient = db
): Promise<TBlockPlacement | null> {
  try {
    const [placement] = await dbClient
      .update(schema.blockPlacement)
      .set({ blockId })
      .where(eq(schema.blockPlacement.id, placementId))
      .returning();

    return placement ?? null;
  } catch (error) {
    console.error('repointPlacement error:', error);
    throw new Error(`Failed to repoint placement: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface LessonBlockScope {
  organizationId: string;
  courseId: string;
}

export async function getLessonBlockScope(
  lessonId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonBlockScope | null> {
  try {
    const [row] = await dbClient
      .select({ organizationId: schema.group.organizationId, courseId: schema.course.id })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(eq(schema.lesson.id, lessonId))
      .limit(1);

    return row?.organizationId ? { organizationId: row.organizationId, courseId: row.courseId } : null;
  } catch (error) {
    console.error('getLessonBlockScope error:', error);
    throw new Error(
      `Failed to resolve scope for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stamps `updated_at` on lessons whose content just changed, so template sync sees the edit.
 */
export async function touchLessonsUpdatedAt(lessonIds: string[], dbClient: DbOrTxClient = db) {
  if (lessonIds.length === 0) return;

  try {
    await dbClient
      .update(schema.lesson)
      .set({ updatedAt: new Date().toISOString() })
      .where(inArray(schema.lesson.id, lessonIds));
  } catch (error) {
    console.error('touchLessonsUpdatedAt error:', error);
    throw new Error(`Failed to update lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
