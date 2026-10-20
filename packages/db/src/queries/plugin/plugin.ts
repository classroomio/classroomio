import * as schema from '@db/schema';
import type {
  TNewPlugin,
  TNewPluginVersion,
  TPlugin,
  TPluginReviewStatus,
  TPluginStatus,
  TPluginVersion
} from '@db/types';
import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@db/drizzle';

export interface PluginReleaseRegistration {
  plugin: TNewPlugin;
  version: TNewPluginVersion;
}

export interface PluginReleaseRegistrationResult {
  pluginId: string;
  version: string;
  artifactDigest: string;
  status: 'created' | 'already_registered';
}

export class PluginVersionDigestConflictError extends Error {
  constructor(
    public readonly pluginId: string,
    public readonly version: string,
    public readonly existingDigest: string | null,
    public readonly requestedDigest: string
  ) {
    super(`Plugin ${pluginId}@${version} already exists with a different digest`);
    this.name = 'PluginVersionDigestConflictError';
  }
}

export async function getPluginById(pluginId: string): Promise<TPlugin | null> {
  const [row] = await db.select().from(schema.plugin).where(eq(schema.plugin.id, pluginId)).limit(1);

  return row ?? null;
}

export async function getPluginBySlug(slug: string): Promise<TPlugin | null> {
  const [row] = await db.select().from(schema.plugin).where(eq(schema.plugin.slug, slug)).limit(1);

  return row ?? null;
}

export async function getPluginByIdOrSlug(idOrSlug: string): Promise<TPlugin | null> {
  const [row] = await db
    .select()
    .from(schema.plugin)
    .where(or(eq(schema.plugin.id, idOrSlug), eq(schema.plugin.slug, idOrSlug)))
    .limit(1);

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
        slug: data.slug,
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

export async function registerPluginReleaseBatch(
  registrations: PluginReleaseRegistration[]
): Promise<PluginReleaseRegistrationResult[]> {
  return db.transaction(async (transaction) => {
    const results: PluginReleaseRegistrationResult[] = [];

    for (const registration of registrations) {
      const pluginData = registration.plugin;
      await transaction
        .insert(schema.plugin)
        .values(pluginData)
        .onConflictDoUpdate({
          target: schema.plugin.id,
          set: {
            slug: pluginData.slug,
            name: pluginData.name,
            description: pluginData.description,
            publisher: pluginData.publisher,
            status: pluginData.status,
            distribution: pluginData.distribution,
            updatedAt: new Date().toISOString()
          }
        });

      const versionData = registration.version;
      const requestedDigest = versionData.artifactDigest;
      if (!requestedDigest) {
        throw new Error(`Plugin ${versionData.pluginId}@${versionData.version} is missing an artifact digest`);
      }

      const [createdVersion] = await transaction
        .insert(schema.pluginVersion)
        .values(versionData)
        .onConflictDoNothing({
          target: [schema.pluginVersion.pluginId, schema.pluginVersion.version]
        })
        .returning();

      if (createdVersion) {
        results.push({
          pluginId: createdVersion.pluginId,
          version: createdVersion.version,
          artifactDigest: requestedDigest,
          status: 'created'
        });
        continue;
      }

      const [existingVersion] = await transaction
        .select()
        .from(schema.pluginVersion)
        .where(
          and(
            eq(schema.pluginVersion.pluginId, versionData.pluginId),
            eq(schema.pluginVersion.version, versionData.version)
          )
        )
        .limit(1);

      if (!existingVersion || existingVersion.artifactDigest !== requestedDigest) {
        throw new PluginVersionDigestConflictError(
          versionData.pluginId,
          versionData.version,
          existingVersion?.artifactDigest ?? null,
          requestedDigest
        );
      }

      results.push({
        pluginId: existingVersion.pluginId,
        version: existingVersion.version,
        artifactDigest: requestedDigest,
        status: 'already_registered'
      });
    }

    return results;
  });
}

export async function updatePluginVersionReviewStatus(
  pluginId: string,
  version: string,
  reviewStatus: TPluginReviewStatus
): Promise<TPluginVersion | null> {
  const [row] = await db
    .update(schema.pluginVersion)
    .set({ reviewStatus })
    .where(and(eq(schema.pluginVersion.pluginId, pluginId), eq(schema.pluginVersion.version, version)))
    .returning();

  return row ?? null;
}

export async function updatePluginVersionArtifact(
  pluginId: string,
  version: string,
  manifest: TPluginVersion['manifest'],
  artifactDigest: string
): Promise<TPluginVersion | null> {
  const [row] = await db
    .update(schema.pluginVersion)
    .set({ manifest, artifactDigest })
    .where(and(eq(schema.pluginVersion.pluginId, pluginId), eq(schema.pluginVersion.version, version)))
    .returning();

  return row ?? null;
}
