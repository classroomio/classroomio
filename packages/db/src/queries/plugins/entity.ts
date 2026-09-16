import * as schema from '@db/schema';
import { and, db, eq, sql, type DbOrTxClient } from '@db/drizzle';
import type { TPluginEntityRecord } from '@db/types';

export interface PluginEntityQueryFilter {
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
}

export interface InsertPluginRecordInput {
  pluginName: string;
  entityName: string;
  orgId: string;
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  data: Record<string, any>;
}

export interface UpsertPluginRecordInput {
  pluginName: string;
  entityName: string;
  orgId: string;
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  createData: Record<string, any>;
  updateData: Record<string, any>;
}

function assertPluginEntityScope(pluginName: string, entityName: string, orgId: string): void {
  if (!pluginName) {
    throw new Error('Plugin entity query requires pluginName.');
  }

  if (!entityName) {
    throw new Error('Plugin entity query requires entityName.');
  }

  if (!orgId) {
    throw new Error('Plugin entity query requires orgId.');
  }
}

/**
 * Inserts a new plugin entity record with mandatory pluginName and orgId.
 */
export async function insertPluginRecord(
  input: InsertPluginRecordInput,
  txClient: DbOrTxClient = db
): Promise<TPluginEntityRecord> {
  assertPluginEntityScope(input.pluginName, input.entityName, input.orgId);

  const [record] = await txClient
    .insert(schema.pluginEntityRecord)
    .values({
      pluginName: input.pluginName,
      entityName: input.entityName,
      orgId: input.orgId,
      userId: input.userId ?? null,
      courseId: input.courseId ?? null,
      lessonId: input.lessonId ?? null,
      data: input.data
    })
    .returning();

  return record;
}

/**
 * Finds all plugin entity records matching pluginName, entityName, orgId, and optional filters.
 */
export async function findPluginRecords(
  pluginName: string,
  entityName: string,
  orgId: string,
  filter: PluginEntityQueryFilter = {},
  txClient: DbOrTxClient = db
): Promise<TPluginEntityRecord[]> {
  assertPluginEntityScope(pluginName, entityName, orgId);

  const conditions = [
    eq(schema.pluginEntityRecord.pluginName, pluginName),
    eq(schema.pluginEntityRecord.entityName, entityName),
    eq(schema.pluginEntityRecord.orgId, orgId)
  ];

  if (filter.userId !== undefined && filter.userId !== null) {
    conditions.push(eq(schema.pluginEntityRecord.userId, filter.userId));
  }
  if (filter.courseId !== undefined && filter.courseId !== null) {
    conditions.push(eq(schema.pluginEntityRecord.courseId, filter.courseId));
  }
  if (filter.lessonId !== undefined && filter.lessonId !== null) {
    conditions.push(eq(schema.pluginEntityRecord.lessonId, filter.lessonId));
  }

  return txClient
    .select()
    .from(schema.pluginEntityRecord)
    .where(and(...conditions));
}

/**
 * Finds a single plugin entity record matching pluginName, entityName, orgId, and optional filters.
 */
export async function findOnePluginRecord(
  pluginName: string,
  entityName: string,
  orgId: string,
  filter: PluginEntityQueryFilter = {},
  txClient: DbOrTxClient = db
): Promise<TPluginEntityRecord | null> {
  const records = await findPluginRecords(pluginName, entityName, orgId, filter, txClient);
  return records[0] ?? null;
}

/**
 * Updates a plugin entity record by merging the data payload.
 */
export async function updatePluginRecord(
  pluginName: string,
  entityName: string,
  orgId: string,
  filter: PluginEntityQueryFilter,
  data: Record<string, any>,
  txClient: DbOrTxClient = db
): Promise<TPluginEntityRecord | null> {
  const existing = await findOnePluginRecord(pluginName, entityName, orgId, filter, txClient);

  if (!existing) {
    return null;
  }

  const [updated] = await txClient
    .update(schema.pluginEntityRecord)
    .set({
      data: { ...(existing.data as Record<string, any>), ...data },
      updatedAt: sql`now()`
    })
    .where(
      and(
        eq(schema.pluginEntityRecord.id, existing.id),
        eq(schema.pluginEntityRecord.pluginName, pluginName),
        eq(schema.pluginEntityRecord.entityName, entityName),
        eq(schema.pluginEntityRecord.orgId, orgId)
      )
    )
    .returning();

  return updated ?? null;
}

/**
 * Deletes plugin entity records matching pluginName, entityName, orgId, and optional filters.
 */
export async function deletePluginRecord(
  pluginName: string,
  entityName: string,
  orgId: string,
  filter: PluginEntityQueryFilter,
  txClient: DbOrTxClient = db
): Promise<boolean> {
  assertPluginEntityScope(pluginName, entityName, orgId);

  const conditions = [
    eq(schema.pluginEntityRecord.pluginName, pluginName),
    eq(schema.pluginEntityRecord.entityName, entityName),
    eq(schema.pluginEntityRecord.orgId, orgId)
  ];

  if (filter.userId !== undefined && filter.userId !== null) {
    conditions.push(eq(schema.pluginEntityRecord.userId, filter.userId));
  }
  if (filter.courseId !== undefined && filter.courseId !== null) {
    conditions.push(eq(schema.pluginEntityRecord.courseId, filter.courseId));
  }
  if (filter.lessonId !== undefined && filter.lessonId !== null) {
    conditions.push(eq(schema.pluginEntityRecord.lessonId, filter.lessonId));
  }

  const result = await txClient
    .delete(schema.pluginEntityRecord)
    .where(and(...conditions))
    .returning({ id: schema.pluginEntityRecord.id });

  return result.length > 0;
}

/**
 * Upserts a plugin entity record idempotently.
 */
export async function upsertPluginRecord(
  input: UpsertPluginRecordInput,
  txClient: DbOrTxClient = db
): Promise<TPluginEntityRecord> {
  assertPluginEntityScope(input.pluginName, input.entityName, input.orgId);

  const filter: PluginEntityQueryFilter = {
    userId: input.userId,
    courseId: input.courseId,
    lessonId: input.lessonId
  };

  const existing = await findOnePluginRecord(input.pluginName, input.entityName, input.orgId, filter, txClient);

  if (existing) {
    const [updated] = await txClient
      .update(schema.pluginEntityRecord)
      .set({
        data: { ...(existing.data as Record<string, any>), ...input.updateData },
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.pluginEntityRecord.id, existing.id),
          eq(schema.pluginEntityRecord.pluginName, input.pluginName),
          eq(schema.pluginEntityRecord.entityName, input.entityName),
          eq(schema.pluginEntityRecord.orgId, input.orgId)
        )
      )
      .returning();

    return updated;
  }

  return insertPluginRecord(
    {
      pluginName: input.pluginName,
      entityName: input.entityName,
      orgId: input.orgId,
      userId: input.userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      data: input.createData
    },
    txClient
  );
}
