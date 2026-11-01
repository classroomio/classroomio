import * as schema from '@db/schema';
import type {
  TNewPluginInstallation,
  TPlugin,
  TPluginInstallation,
  TPluginInstallationStatus,
  TPluginOrgApprovalStatus,
  TPluginVersion
} from '@db/types';
import type { TPluginManifest } from '@cio/utils/validation/plugin';

import { and, count, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function getInstallationById(installationId: string): Promise<TPluginInstallation | null> {
  const [row] = await db
    .select()
    .from(schema.pluginInstallation)
    .where(eq(schema.pluginInstallation.id, installationId))
    .limit(1);

  return row ?? null;
}

export async function getOrganizationInstallation(
  organizationId: string,
  pluginId: string
): Promise<TPluginInstallation | null> {
  const [row] = await db
    .select()
    .from(schema.pluginInstallation)
    .where(
      and(
        eq(schema.pluginInstallation.organizationId, organizationId),
        eq(schema.pluginInstallation.pluginId, pluginId),
        eq(schema.pluginInstallation.ownerType, 'organization')
      )
    )
    .limit(1);

  return row ?? null;
}

export async function getUserInstallation(userId: string, pluginId: string): Promise<TPluginInstallation | null> {
  const [row] = await db
    .select()
    .from(schema.pluginInstallation)
    .where(
      and(
        eq(schema.pluginInstallation.userId, userId),
        eq(schema.pluginInstallation.pluginId, pluginId),
        eq(schema.pluginInstallation.ownerType, 'user')
      )
    )
    .limit(1);

  return row ?? null;
}

export type TInstalledPluginWithDetails = TPluginInstallation & {
  plugin: TPlugin;
  manifest: TPluginManifest | null;
  versionRecord: TPluginVersion | null;
};

export async function listOrganizationInstallations(
  organizationId: string,
  options: { activeOnly?: boolean } = {}
): Promise<TInstalledPluginWithDetails[]> {
  const conditions = [
    eq(schema.pluginInstallation.organizationId, organizationId),
    eq(schema.pluginInstallation.ownerType, 'organization')
  ];

  if (options.activeOnly) {
    conditions.push(eq(schema.pluginInstallation.status, 'active'));
  }

  const rows = await db
    .select({
      installation: schema.pluginInstallation,
      plugin: schema.plugin,
      versionRecord: schema.pluginVersion
    })
    .from(schema.pluginInstallation)
    .innerJoin(schema.plugin, eq(schema.pluginInstallation.pluginId, schema.plugin.id))
    .leftJoin(schema.pluginVersion, eq(schema.pluginInstallation.pluginVersionId, schema.pluginVersion.id))
    .where(and(...conditions))
    .orderBy(desc(schema.pluginInstallation.installedAt));

  return rows.map((r) => ({
    ...r.installation,
    plugin: r.plugin,
    manifest: r.versionRecord?.manifest ?? null,
    versionRecord: r.versionRecord
  }));
}

export async function createInstallation(data: TNewPluginInstallation): Promise<TPluginInstallation> {
  const [row] = await db.insert(schema.pluginInstallation).values(data).returning();

  return row;
}

export async function reinstallInstallation(
  installationId: string,
  data: {
    pluginVersionId: string;
    installedByProfileId?: string | null;
    settings?: Record<string, unknown>;
  }
): Promise<TPluginInstallation | null> {
  const now = new Date().toISOString();
  const [row] = await db
    .update(schema.pluginInstallation)
    .set({
      pluginVersionId: data.pluginVersionId,
      installedByProfileId: data.installedByProfileId,
      settings: data.settings ?? {},
      status: 'active',
      orgApprovalStatus: 'approved',
      installedAt: now,
      uninstalledAt: null,
      disabledAt: null,
      updatedAt: now
    })
    .where(eq(schema.pluginInstallation.id, installationId))
    .returning();

  return row ?? null;
}

export async function updateInstallationStatus(
  installationId: string,
  status: TPluginInstallationStatus
): Promise<TPluginInstallation | null> {
  const now = new Date().toISOString();
  const updateData: Partial<TNewPluginInstallation> = {
    status,
    updatedAt: now
  };

  if (status === 'disabled') {
    updateData.disabledAt = now;
  } else if (status === 'uninstalled') {
    updateData.uninstalledAt = now;
  }

  const [row] = await db
    .update(schema.pluginInstallation)
    .set(updateData)
    .where(eq(schema.pluginInstallation.id, installationId))
    .returning();

  return row ?? null;
}

export async function getPluginUninstallDataImpact(installationId: string, organizationId: string) {
  const [storage] = await db
    .select({
      records: count(schema.pluginStorage.id),
      bytes: sql<number>`coalesce(sum(pg_column_size(${schema.pluginStorage.value})), 0)`
    })
    .from(schema.pluginStorage)
    .where(eq(schema.pluginStorage.installationId, installationId));

  const [publishedOutputs] = await db
    .select({ count: count(schema.course.id) })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .where(
      and(
        eq(schema.group.organizationId, organizationId),
        sql`${schema.course.certificate}->'presentation'->'source'->>'installationId' = ${installationId}`
      )
    );

  return {
    storageRecords: Number(storage?.records ?? 0),
    storageBytes: Number(storage?.bytes ?? 0),
    publishedOutputs: Number(publishedOutputs?.count ?? 0)
  };
}

export async function uninstallPluginInstallation(
  installationId: string,
  organizationId: string,
  options: { deletePluginStorage: boolean; removePublishedOutputs: boolean }
) {
  return db.transaction(async (transaction) => {
    const [installation] = await transaction
      .select()
      .from(schema.pluginInstallation)
      .where(
        and(
          eq(schema.pluginInstallation.id, installationId),
          eq(schema.pluginInstallation.organizationId, organizationId),
          eq(schema.pluginInstallation.ownerType, 'organization')
        )
      )
      .for('update');

    if (!installation) return null;

    let storageRecordsDeleted = 0;
    if (options.deletePluginStorage) {
      const deletedStorage = await transaction
        .delete(schema.pluginStorage)
        .where(eq(schema.pluginStorage.installationId, installationId))
        .returning({ id: schema.pluginStorage.id });
      storageRecordsDeleted = deletedStorage.length;
    }

    let publishedOutputsRemoved = 0;
    if (options.removePublishedOutputs) {
      const courses = await transaction
        .select({ id: schema.course.id, certificate: schema.course.certificate })
        .from(schema.course)
        .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
        .where(
          and(
            eq(schema.group.organizationId, organizationId),
            sql`${schema.course.certificate}->'presentation'->'source'->>'installationId' = ${installationId}`
          )
        );

      for (const course of courses) {
        const certificate = (course.certificate ?? {}) as Record<string, unknown>;
        const nextCertificate = {
          ...certificate,
          customDocument: null,
          presentation: null,
          studioDesign: null
        };

        await transaction
          .update(schema.course)
          .set({ certificate: nextCertificate })
          .where(eq(schema.course.id, course.id));
      }

      publishedOutputsRemoved = courses.length;
    }

    const now = new Date().toISOString();
    const [updatedInstallation] = await transaction
      .update(schema.pluginInstallation)
      .set({ status: 'uninstalled', uninstalledAt: now, updatedAt: now })
      .where(eq(schema.pluginInstallation.id, installationId))
      .returning();

    return {
      installation: updatedInstallation,
      storageRecordsDeleted,
      publishedOutputsRemoved
    };
  });
}

export async function updateInstallationSettings(
  installationId: string,
  settings: Record<string, unknown>
): Promise<TPluginInstallation | null> {
  const [row] = await db
    .update(schema.pluginInstallation)
    .set({
      settings,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.pluginInstallation.id, installationId))
    .returning();

  return row ?? null;
}

export async function updateOrgApprovalStatus(
  installationId: string,
  orgApprovalStatus: TPluginOrgApprovalStatus
): Promise<TPluginInstallation | null> {
  const [row] = await db
    .update(schema.pluginInstallation)
    .set({
      orgApprovalStatus,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.pluginInstallation.id, installationId))
    .returning();

  return row ?? null;
}

export async function listAllOrganizationIds(): Promise<string[]> {
  const rows = await db.select({ id: schema.organization.id }).from(schema.organization);
  return rows.map((r) => r.id);
}
