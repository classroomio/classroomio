import * as schema from '@db/schema';
import type { TNewPlugin, TNewPluginVersion, TPlugin, TPluginStatus, TPluginVersion } from '@db/types';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function getPluginById(pluginId: string): Promise<TPlugin | null> {
  const [row] = await db.select().from(schema.plugin).where(eq(schema.plugin.id, pluginId)).limit(1);

  return row ?? null;
}

export async function listPlugins(options: { status?: TPluginStatus } = {}): Promise<TPlugin[]> {
  const conditions = [];

  if (options.status) {
    conditions.push(eq(schema.plugin.status, options.status));
  }

  const query = db.select().from(schema.plugin);

  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(schema.plugin.name);
  }

  return query.orderBy(schema.plugin.name);
}

export async function upsertPlugin(data: TNewPlugin): Promise<TPlugin> {
  const [row] = await db
    .insert(schema.plugin)
    .values(data)
    .onConflictDoUpdate({
      target: schema.plugin.id,
      set: {
        name: data.name,
        description: data.description,
        publisher: data.publisher,
        status: data.status,
        distribution: data.distribution,
        updatedAt: new Date().toISOString()
      }
    })
    .returning();

  return row;
}

export async function getPluginVersion(pluginId: string, version: string): Promise<TPluginVersion | null> {
  const [row] = await db
    .select()
    .from(schema.pluginVersion)
    .where(and(eq(schema.pluginVersion.pluginId, pluginId), eq(schema.pluginVersion.version, version)))
    .limit(1);

  return row ?? null;
}

export async function listPluginVersions(pluginId: string): Promise<TPluginVersion[]> {
  return db
    .select()
    .from(schema.pluginVersion)
    .where(eq(schema.pluginVersion.pluginId, pluginId))
    .orderBy(desc(schema.pluginVersion.publishedAt));
}

export async function getPluginVersionById(id: string): Promise<TPluginVersion | null> {
  const [row] = await db.select().from(schema.pluginVersion).where(eq(schema.pluginVersion.id, id)).limit(1);

  return row ?? null;
}

export async function createPluginVersion(data: TNewPluginVersion): Promise<TPluginVersion> {
  const [row] = await db.insert(schema.pluginVersion).values(data).returning();

  return row;
}
