import { AppError } from '@api/utils/errors';
import {
  getPluginById,
  getPluginVersion,
  listPluginVersions,
  listPlugins,
  upsertPlugin,
  createPluginVersion
} from '@cio/db/queries/plugin';
import type { TNewPlugin, TNewPluginVersion, TPlugin, TPluginStatus, TPluginVersion } from '@cio/db/types';

export async function listCatalogPlugins(options: { status?: TPluginStatus } = {}): Promise<TPlugin[]> {
  return listPlugins(options);
}

export async function getCatalogPluginDetails(pluginId: string): Promise<{
  plugin: TPlugin;
  latestVersion: TPluginVersion | null;
  versions: TPluginVersion[];
}> {
  const plugin = await getPluginById(pluginId);
  if (!plugin) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }

  const versions = await listPluginVersions(pluginId);
  const latestVersion = versions[0] ?? null;

  return {
    plugin,
    latestVersion,
    versions
  };
}

export async function getCatalogPluginVersion(pluginId: string, version: string): Promise<TPluginVersion> {
  const pluginVersionRow = await getPluginVersion(pluginId, version);
  if (!pluginVersionRow) {
    throw new AppError('Plugin version not found', 'PLUGIN_VERSION_NOT_FOUND', 404);
  }

  return pluginVersionRow;
}

export async function registerPluginWithVersion(
  pluginData: TNewPlugin,
  versionData: Omit<TNewPluginVersion, 'pluginId'>
): Promise<{ plugin: TPlugin; version: TPluginVersion }> {
  const registeredPlugin = await upsertPlugin(pluginData);
  const registeredVersion = await createPluginVersion({
    ...versionData,
    pluginId: registeredPlugin.id
  });

  return {
    plugin: registeredPlugin,
    version: registeredVersion
  };
}
