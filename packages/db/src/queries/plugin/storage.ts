import * as schema from '@db/schema';
import type { TNewPluginStorage, TPluginStorage, TPluginStorageScopeType } from '@db/types';
import { and, eq, not, sql } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function getPluginStorageItem(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  scopeId: string,
  namespace: string,
  key: string
): Promise<TPluginStorage | null> {
  const [row] = await db
    .select()
    .from(schema.pluginStorage)
    .where(
      and(
        eq(schema.pluginStorage.installationId, installationId),
        eq(schema.pluginStorage.scopeType, scopeType),
        eq(schema.pluginStorage.scopeId, scopeId),
        eq(schema.pluginStorage.namespace, namespace),
        eq(schema.pluginStorage.key, key)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function setPluginStorageItem(data: TNewPluginStorage): Promise<TPluginStorage> {
  const [row] = await db
    .insert(schema.pluginStorage)
    .values(data)
    .onConflictDoUpdate({
      target: [
        schema.pluginStorage.installationId,
        schema.pluginStorage.scopeType,
        schema.pluginStorage.scopeId,
        schema.pluginStorage.namespace,
        schema.pluginStorage.key
      ],
      set: {
        value: data.value,
        updatedAt: new Date().toISOString()
      }
    })
    .returning();

  return row;
}

export async function deletePluginStorageItem(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  scopeId: string,
  namespace: string,
  key: string
): Promise<boolean> {
  const result = await db
    .delete(schema.pluginStorage)
    .where(
      and(
        eq(schema.pluginStorage.installationId, installationId),
        eq(schema.pluginStorage.scopeType, scopeType),
        eq(schema.pluginStorage.scopeId, scopeId),
        eq(schema.pluginStorage.namespace, namespace),
        eq(schema.pluginStorage.key, key)
      )
    )
    .returning({ id: schema.pluginStorage.id });

  return result.length > 0;
}

export async function listPluginStorageByNamespace(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  scopeId: string,
  namespace: string
): Promise<TPluginStorage[]> {
  return db
    .select()
    .from(schema.pluginStorage)
    .where(
      and(
        eq(schema.pluginStorage.installationId, installationId),
        eq(schema.pluginStorage.scopeType, scopeType),
        eq(schema.pluginStorage.scopeId, scopeId),
        eq(schema.pluginStorage.namespace, namespace)
      )
    );
}

export async function getPluginStorageUsageBytes(
  installationId: string,
  exclude?: {
    scopeType: TPluginStorageScopeType;
    scopeId: string;
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
