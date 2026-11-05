import * as schema from '@db/schema';
import type { TNewPluginStorage, TPluginStorage, TPluginStorageScopeType } from '@db/types';
import { and, eq, gt, isNull, lte, not, or, sql } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function getPluginStorageItem(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  scopeId: string,
  namespace: string,
  key: string,
  resourceType = ''
): Promise<TPluginStorage | null> {
  const conditions = [
    eq(schema.pluginStorage.installationId, installationId),
    eq(schema.pluginStorage.scopeType, scopeType),
    eq(schema.pluginStorage.scopeId, scopeId),
    eq(schema.pluginStorage.namespace, namespace),
    eq(schema.pluginStorage.key, key)
  ];

  conditions.push(eq(schema.pluginStorage.resourceType, resourceType));

  const [row] = await db
    .select()
    .from(schema.pluginStorage)
    .where(
      and(
        ...conditions,
        or(isNull(schema.pluginStorage.expiresAt), gt(schema.pluginStorage.expiresAt, new Date().toISOString()))
      )
    )
    .limit(1);

  return row ?? null;
}

export async function setPluginStorageItemWithAtomicQuota(
  data: TNewPluginStorage,
  maxTotalBytes: number,
  itemBytes: number,
  expectedVersion?: number
): Promise<TPluginStorage> {
  return await db.transaction(async (tx) => {
    await tx
      .select({ id: schema.pluginInstallation.id })
      .from(schema.pluginInstallation)
      .where(eq(schema.pluginInstallation.id, data.installationId))
      .for('update');

    const recordConditions = and(
      eq(schema.pluginStorage.installationId, data.installationId),
      eq(schema.pluginStorage.scopeType, data.scopeType),
      eq(schema.pluginStorage.scopeId, data.scopeId),
      eq(schema.pluginStorage.resourceType, data.resourceType ?? ''),
      eq(schema.pluginStorage.namespace, data.namespace ?? 'default'),
      eq(schema.pluginStorage.key, data.key)
    )!;
    const [existing] = await tx.select().from(schema.pluginStorage).where(recordConditions).for('update');
    const currentVersion = existing?.version ?? 0;
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      throw new Error('STORAGE_VERSION_CONFLICT');
    }

    const [usage] = await tx
      .select({ bytes: sql<number>`coalesce(sum(pg_column_size(${schema.pluginStorage.value})), 0)` })
      .from(schema.pluginStorage)
      .where(and(eq(schema.pluginStorage.installationId, data.installationId), not(recordConditions)));

    const currentBytes = Number(usage?.bytes ?? 0);
    if (currentBytes + itemBytes > maxTotalBytes) {
      throw new Error('STORAGE_QUOTA_EXCEEDED');
    }

    const now = new Date().toISOString();
    if (existing) {
      const [row] = await tx
        .update(schema.pluginStorage)
        .set({
          value: data.value,
          version: currentVersion + 1,
          schemaVersion: data.schemaVersion,
          expiresAt: null,
          updatedAt: now
        })
        .where(recordConditions)
        .returning();

      return row;
    }

    const [row] = await tx
      .insert(schema.pluginStorage)
      .values({ ...data, version: 1, expiresAt: null })
      .returning();

    return row;
  });
}

export async function deletePluginStorageItem(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  scopeId: string,
  namespace: string,
  key: string,
  resourceType = ''
): Promise<boolean> {
  const conditions = [
    eq(schema.pluginStorage.installationId, installationId),
    eq(schema.pluginStorage.scopeType, scopeType),
    eq(schema.pluginStorage.scopeId, scopeId),
    eq(schema.pluginStorage.namespace, namespace),
    eq(schema.pluginStorage.key, key)
  ];

  conditions.push(eq(schema.pluginStorage.resourceType, resourceType));

  const result = await db
    .delete(schema.pluginStorage)
    .where(and(...conditions))
    .returning({ id: schema.pluginStorage.id });

  return result.length > 0;
}

export async function listPluginStorageByNamespace(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  scopeId: string,
  namespace: string,
  resourceType = '',
  options: { cursor?: string; limit?: number } = {}
): Promise<{ items: TPluginStorage[]; nextCursor: string | null }> {
  const conditions = [
    eq(schema.pluginStorage.installationId, installationId),
    eq(schema.pluginStorage.scopeType, scopeType),
    eq(schema.pluginStorage.scopeId, scopeId),
    eq(schema.pluginStorage.namespace, namespace)
  ];

  conditions.push(eq(schema.pluginStorage.resourceType, resourceType));

  if (options.cursor) conditions.push(gt(schema.pluginStorage.key, options.cursor));
  conditions.push(
    or(isNull(schema.pluginStorage.expiresAt), gt(schema.pluginStorage.expiresAt, new Date().toISOString()))!
  );
  const limit = options.limit ?? 20;
  const records = await db
    .select()
    .from(schema.pluginStorage)
    .where(and(...conditions))
    .orderBy(schema.pluginStorage.key)
    .limit(limit + 1);

  const hasMore = records.length > limit;
  const items = hasMore ? records.slice(0, limit) : records;

  return { items, nextCursor: hasMore ? (items[items.length - 1]?.key ?? null) : null };
}

export async function verifyResourceOrganization(
  resourceType: string,
  resourceId: string,
  organizationId: string
): Promise<boolean> {
  if (resourceType === 'course' || resourceType === 'certificate') {
    const [row] = await db
      .select({ id: schema.course.id })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(eq(schema.course.id, resourceId), eq(schema.group.organizationId, organizationId)))
      .limit(1);

    return !!row;
  }

  if (resourceType === 'lesson') {
    const [row] = await db
      .select({ id: schema.lesson.id })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(eq(schema.lesson.id, resourceId), eq(schema.group.organizationId, organizationId)))
      .limit(1);

    return !!row;
  }

  if (resourceType === 'organization') {
    return resourceId === organizationId;
  }

  return false;
}

export async function getPluginStorageUsageBytes(
  installationId: string,
  exclude?: {
    scopeType: TPluginStorageScopeType;
    scopeId: string;
    resourceType?: string;
    namespace: string;
    key: string;
  }
): Promise<number> {
  const conditions = [eq(schema.pluginStorage.installationId, installationId)];
  if (exclude) {
    conditions.push(
      not(
        and(
          eq(schema.pluginStorage.scopeType, exclude.scopeType),
          eq(schema.pluginStorage.scopeId, exclude.scopeId),
          eq(schema.pluginStorage.resourceType, exclude.resourceType ?? ''),
          eq(schema.pluginStorage.namespace, exclude.namespace),
          eq(schema.pluginStorage.key, exclude.key)
        )!
      )
    );
  }

  const [usage] = await db
    .select({ bytes: sql<number>`coalesce(sum(pg_column_size(${schema.pluginStorage.value})), 0)` })
    .from(schema.pluginStorage)
    .where(and(...conditions));

  return Number(usage?.bytes ?? 0);
}

export async function purgeInstallationStorage(installationId: string): Promise<number> {
  const deleted = await db
    .delete(schema.pluginStorage)
    .where(eq(schema.pluginStorage.installationId, installationId))
    .returning({ id: schema.pluginStorage.id });

  return deleted.length;
}

export async function expireInstallationStorage(installationId: string, expiresAt: string): Promise<number> {
  const updated = await db
    .update(schema.pluginStorage)
    .set({ expiresAt })
    .where(eq(schema.pluginStorage.installationId, installationId))
    .returning({ id: schema.pluginStorage.id });

  return updated.length;
}

export async function purgeExpiredPluginStorage(now = new Date().toISOString()): Promise<number> {
  const deleted = await db
    .delete(schema.pluginStorage)
    .where(lte(schema.pluginStorage.expiresAt, now))
    .returning({ id: schema.pluginStorage.id });

  return deleted.length;
}

export async function exportInstallationStorage(installationId: string): Promise<TPluginStorage[]> {
  return db
    .select()
    .from(schema.pluginStorage)
    .where(
      and(
        eq(schema.pluginStorage.installationId, installationId),
        or(isNull(schema.pluginStorage.expiresAt), gt(schema.pluginStorage.expiresAt, new Date().toISOString()))
      )
    )
    .orderBy(schema.pluginStorage.namespace, schema.pluginStorage.key);
}
