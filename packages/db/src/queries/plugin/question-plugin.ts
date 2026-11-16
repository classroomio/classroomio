import * as schema from '@db/schema';
import type { TPlugin, TPluginInstallation, TPluginVersion } from '@db/types';
import { and, eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export interface QuestionPluginResolutionData {
  plugin: TPlugin | null;
  installation: TPluginInstallation | null;
  installedVersion: TPluginVersion | null;
  pinnedVersion: TPluginVersion | null;
}

export async function getQuestionPluginResolutionData(params: {
  organizationId: string;
  pluginId: string;
  pinnedVersion: string;
  installationId?: string;
}): Promise<QuestionPluginResolutionData> {
  const [plugin] = await db.select().from(schema.plugin).where(eq(schema.plugin.id, params.pluginId)).limit(1);

  let installation: TPluginInstallation | null = null;
  if (params.installationId) {
    const [inst] = await db
      .select()
      .from(schema.pluginInstallation)
      .where(
        and(
          eq(schema.pluginInstallation.id, params.installationId),
          eq(schema.pluginInstallation.organizationId, params.organizationId)
        )
      )
      .limit(1);
    installation = inst ?? null;
  }

  if (!installation) {
    const [inst] = await db
      .select()
      .from(schema.pluginInstallation)
      .where(
        and(
          eq(schema.pluginInstallation.organizationId, params.organizationId),
          eq(schema.pluginInstallation.pluginId, params.pluginId),
          eq(schema.pluginInstallation.ownerType, 'organization')
        )
      )
      .limit(1);
    installation = inst ?? null;
  }

  const [pinnedVersionRecord] = await db
    .select()
    .from(schema.pluginVersion)
    .where(
      and(eq(schema.pluginVersion.pluginId, params.pluginId), eq(schema.pluginVersion.version, params.pinnedVersion))
    )
    .limit(1);

  let installedVersionRecord: TPluginVersion | null = null;
  if (installation?.pluginVersionId) {
    const [instVer] = await db
      .select()
      .from(schema.pluginVersion)
      .where(eq(schema.pluginVersion.id, installation.pluginVersionId))
      .limit(1);
    installedVersionRecord = instVer ?? null;
  }

  return {
    plugin: plugin ?? null,
    installation,
    installedVersion: installedVersionRecord,
    pinnedVersion: pinnedVersionRecord ?? null
  };
}
