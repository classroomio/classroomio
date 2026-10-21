import { AppError } from '@api/utils/errors';
import {
  getPluginByIdOrSlug,
  getPluginVersion,
  listPluginVersions,
  listPlugins,
  listPublishers,
  upsertPlugin,
  createPluginVersion
} from '@cio/db/queries/plugin';
import type { TNewPlugin, TNewPluginVersion, TPlugin, TPluginStatus, TPluginVersion } from '@cio/db/types';
import { getPluginArtifactBaseUrl } from './installation';

export type CatalogPluginListItem = TPlugin & {
  latestVersion: string | null;
  iconUrl?: string;
  permissions?: string[];
  publisherClass?: string;
  publisherVerified?: boolean;
};

function resolveCatalogIconUrl(pluginId: string, version: TPluginVersion | undefined): string | undefined {
  const manifest = version?.manifest as { icon?: { resource?: string } } | null;
  const resource = manifest?.icon?.resource;
  if (!resource || resource.startsWith('/') || resource.includes('..')) return undefined;
  if (!version?.artifactDigest || version.reviewStatus !== 'approved') return undefined;

  const artifactBaseUrl = getPluginArtifactBaseUrl(pluginId, version.version, version.artifactDigest);
  const encodedResource = resource.split('/').map(encodeURIComponent).join('/');
  return `${artifactBaseUrl}/${encodedResource}`;
}

async function canAccessCatalogPlugin(plugin: TPlugin, organizationId?: string): Promise<boolean> {
  if (plugin.distribution !== 'private') {
    return true;
  }

  if (!organizationId) {
    return false;
  }

  const versions = await listPluginVersions(plugin.id);
  return versions.some((version) => {
    const meta = version.releaseMetadata as { organizationId?: string } | null;
    return meta?.organizationId === organizationId;
  });
}

async function assertCatalogPluginAccess(plugin: TPlugin, organizationId?: string): Promise<void> {
  const canAccess = await canAccessCatalogPlugin(plugin, organizationId);
  if (!canAccess) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }
}

export async function listCatalogPlugins(
  options: { status?: TPluginStatus; organizationId?: string } = {}
): Promise<CatalogPluginListItem[]> {
  const [plugins, publishers] = await Promise.all([listPlugins(options), listPublishers()]);
  const publisherMap = new Map(publishers.map((p) => [p.id, p]));
  const visibility = await Promise.all(plugins.map((plugin) => canAccessCatalogPlugin(plugin, options.organizationId)));
  const visiblePlugins = plugins.filter((_plugin, index) => visibility[index]);

  return Promise.all(
    visiblePlugins.map(async (plugin) => {
      const versions = await listPluginVersions(plugin.id);
      const latestVersion = versions.find((version) => version.reviewStatus === 'approved');
      const manifest = latestVersion?.manifest as {
        permissions?: { required?: string[]; optional?: string[] };
      } | null;
      const permissions = [...(manifest?.permissions?.required ?? []), ...(manifest?.permissions?.optional ?? [])];
      const pub = plugin.publisherId ? publisherMap.get(plugin.publisherId) : undefined;

      return {
        ...plugin,
        latestVersion: latestVersion?.version ?? null,
        iconUrl: resolveCatalogIconUrl(plugin.id, latestVersion),
        permissions,
        publisherClass: pub?.publisherClass ?? 'community',
        publisherVerified: pub?.verified ?? false
      };
    })
  );
}

export async function getCatalogPluginDetails(
  idOrSlug: string,
  organizationId?: string
): Promise<{
  plugin: TPlugin;
  latestVersion: TPluginVersion | null;
  versions: TPluginVersion[];
}> {
  const plugin = await getPluginByIdOrSlug(idOrSlug);
  if (!plugin) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }

  await assertCatalogPluginAccess(plugin, organizationId);

  const pluginVersions = await listPluginVersions(plugin.id);
  const versions = pluginVersions.filter((version) => version.reviewStatus === 'approved');
  const latestVersion = versions[0] ?? null;

  return {
    plugin,
    latestVersion,
    versions
  };
}

export async function getCatalogPluginVersion(
  pluginId: string,
  version: string,
  organizationId?: string
): Promise<TPluginVersion> {
  const plugin = await getPluginByIdOrSlug(pluginId);
  if (!plugin) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }

  await assertCatalogPluginAccess(plugin, organizationId);

  const pluginVersionRow = await getPluginVersion(pluginId, version);
  if (!pluginVersionRow || pluginVersionRow.reviewStatus !== 'approved') {
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
