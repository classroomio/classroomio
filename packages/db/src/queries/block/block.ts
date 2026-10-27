import * as schema from '@db/schema';

import type { TBlock, TNewBlock } from '@db/types';
import { and, count, db, desc, eq, ilike, inArray, or, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export interface LessonBlockRow {
  placement: typeof schema.blockPlacement.$inferSelect;
  block: TBlock;
}

export async function createBlock(values: TNewBlock, dbClient: DbOrTxClient = db): Promise<TBlock> {
  try {
    const [block] = await dbClient.insert(schema.block).values(values).returning();
    if (!block) {
      throw new Error('Insert returned no row');
    }

    return block;
  } catch (error) {
    console.error('createBlock error:', error);
    throw new Error(`Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBlockById(blockId: string, dbClient: DbOrTxClient = db): Promise<TBlock | null> {
  try {
    const [block] = await dbClient.select().from(schema.block).where(eq(schema.block.id, blockId)).limit(1);

    return block ?? null;
  } catch (error) {
    console.error('getBlockById error:', error);
    throw new Error(`Failed to get block "${blockId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Replaces a block's `data` only when `expectedVersion` still matches, bumping the version.
 * @returns the updated block, or null when the version is stale or the block is missing.
 */
export async function updateBlockDataIfVersion(
  blockId: string,
  data: Record<string, unknown>,
  expectedVersion: number,
  dbClient: DbOrTxClient = db
): Promise<TBlock | null> {
  try {
    const [block] = await dbClient
      .update(schema.block)
      .set({ data, version: sql`${schema.block.version} + 1`, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.block.id, blockId), eq(schema.block.version, expectedVersion)))
      .returning();

    return block ?? null;
  } catch (error) {
    console.error('updateBlockDataIfVersion error:', error);
    throw new Error(`Failed to update block "${blockId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Bumps a block's version without touching its data, for writes that live in `block_locale`.
 * @returns the updated block, or null when the version is stale or the block is missing.
 */
export async function bumpBlockVersionIfVersion(
  blockId: string,
  expectedVersion: number,
  dbClient: DbOrTxClient = db
): Promise<TBlock | null> {
  try {
    const [block] = await dbClient
      .update(schema.block)
      .set({ version: sql`${schema.block.version} + 1`, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.block.id, blockId), eq(schema.block.version, expectedVersion)))
      .returning();

    return block ?? null;
  } catch (error) {
    console.error('bumpBlockVersionIfVersion error:', error);
    throw new Error(
      `Failed to bump block version "${blockId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteBlocksWithoutPlacements(blockIds: string[], dbClient: DbOrTxClient = db) {
  if (blockIds.length === 0) return [];

  try {
    return await dbClient
      .delete(schema.block)
      .where(
        and(
          inArray(schema.block.id, blockIds),
          sql`NOT EXISTS (SELECT 1 FROM ${schema.blockPlacement} WHERE ${schema.blockPlacement.blockId} = ${schema.block.id})`
        )
      )
      .returning({ id: schema.block.id });
  } catch (error) {
    console.error('deleteBlocksWithoutPlacements error:', error);
    throw new Error(`Failed to delete orphaned blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBlocksByIds(blockIds: string[], dbClient: DbOrTxClient = db): Promise<TBlock[]> {
  if (blockIds.length === 0) return [];

  try {
    return await dbClient.select().from(schema.block).where(inArray(schema.block.id, blockIds));
  } catch (error) {
    console.error('getBlocksByIds error:', error);
    throw new Error(`Failed to get blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface OrganizationBlockListItem {
  block: TBlock;
  usageCount: number;
}

export async function listOrganizationBlocks(
  organizationId: string,
  options: { type?: string; search?: string; page: number; limit: number }
): Promise<{ items: OrganizationBlockListItem[]; total: number }> {
  try {
    const searchPattern = options.search ? `%${options.search.replace(/[%_\\]/g, '\\$&')}%` : undefined;
    const where = and(
      eq(schema.block.organizationId, organizationId),
      options.type ? eq(schema.block.type, options.type) : undefined,
      searchPattern
        ? or(
            ilike(sql`${schema.block.data}::text`, searchPattern),
            sql`EXISTS (SELECT 1 FROM ${schema.blockLocale} WHERE ${schema.blockLocale.blockId} = ${schema.block.id} AND ${schema.blockLocale.content} ILIKE ${searchPattern})`
          )
        : undefined
    );

    const [totalRows, rows] = await Promise.all([
      db.select({ total: count() }).from(schema.block).where(where),
      db
        .select({
          block: schema.block,
          usageCount: sql<number>`(SELECT count(*) FROM ${schema.blockPlacement} WHERE ${schema.blockPlacement.blockId} = ${schema.block.id})::int`
        })
        .from(schema.block)
        .where(where)
        .orderBy(desc(schema.block.updatedAt), desc(schema.block.id))
        .limit(options.limit)
        .offset((options.page - 1) * options.limit)
    ]);

    return { items: rows, total: Number(totalRows[0]?.total ?? 0) };
  } catch (error) {
    console.error('listOrganizationBlocks error:', error);
    throw new Error(`Failed to list blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface BlockUsage {
  placementId: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
}

export async function getBlockUsages(blockId: string): Promise<BlockUsage[]> {
  try {
    return await db
      .select({
        placementId: schema.blockPlacement.id,
        lessonId: schema.lesson.id,
        lessonTitle: schema.lesson.title,
        courseId: schema.course.id,
        courseTitle: schema.course.title
      })
      .from(schema.blockPlacement)
      .innerJoin(schema.lesson, eq(schema.lesson.id, schema.blockPlacement.lessonId))
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .where(eq(schema.blockPlacement.blockId, blockId))
      .orderBy(schema.course.title, schema.lesson.title);
  } catch (error) {
    console.error('getBlockUsages error:', error);
    throw new Error(`Failed to get block usages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function countBlockPlacements(blockId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.blockPlacement)
      .where(eq(schema.blockPlacement.blockId, blockId));

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countBlockPlacements error:', error);
    throw new Error(`Failed to count block placements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPlacementCountsByBlockIds(
  blockIds: string[],
  dbClient: DbOrTxClient = db
): Promise<Map<string, number>> {
  if (blockIds.length === 0) return new Map();

  try {
    const rows = await dbClient
      .select({ blockId: schema.blockPlacement.blockId, total: count() })
      .from(schema.blockPlacement)
      .where(inArray(schema.blockPlacement.blockId, blockIds))
      .groupBy(schema.blockPlacement.blockId);

    return new Map(rows.map((row) => [row.blockId, Number(row.total)]));
  } catch (error) {
    console.error('getPlacementCountsByBlockIds error:', error);
    throw new Error(`Failed to count block placements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listLessonIdsForBlock(blockId: string, dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    const rows = await dbClient
      .selectDistinct({ lessonId: schema.blockPlacement.lessonId })
      .from(schema.blockPlacement)
      .where(eq(schema.blockPlacement.blockId, blockId));

    return rows.map((row) => row.lessonId);
  } catch (error) {
    console.error('listLessonIdsForBlock error:', error);
    throw new Error(`Failed to list lessons for block: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listLessonIdsWithBlockType(
  lessonIds: string[],
  type: string,
  dbClient: DbOrTxClient = db
): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();

  try {
    const rows = await dbClient
      .selectDistinct({ lessonId: schema.blockPlacement.lessonId })
      .from(schema.blockPlacement)
      .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
      .where(and(inArray(schema.blockPlacement.lessonId, lessonIds), eq(schema.block.type, type)));

    return new Set(rows.map((row) => row.lessonId));
  } catch (error) {
    console.error('listLessonIdsWithBlockType error:', error);
    throw new Error(
      `Failed to list lessons by block type: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
