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

import { and, desc, eq, isNull, or } from 'drizzle-orm';
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
