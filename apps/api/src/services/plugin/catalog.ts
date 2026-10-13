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
import { ZPluginManifest } from '@cio/utils/validation/plugin';
import { getPluginArtifactBaseUrl } from './installation';

export type CatalogPluginListItem = TPlugin & {
  latestVersion: string | null;
  iconUrl?: string;
  permissions?: string[];
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

export async function listCatalogPlugins(options: { status?: TPluginStatus } = {}): Promise<CatalogPluginListItem[]> {
  const plugins = await listPlugins(options);

  return Promise.all(
    plugins.map(async (plugin) => {
      const versions = await listPluginVersions(plugin.id);
      const latestVersion = versions[0];
      const manifest = latestVersion?.manifest as {
        permissions?: { required?: string[]; optional?: string[] };
      } | null;
      const permissions = [...(manifest?.permissions?.required ?? []), ...(manifest?.permissions?.optional ?? [])];

      return {
        ...plugin,
        latestVersion: latestVersion?.version ?? null,
        iconUrl: resolveCatalogIconUrl(plugin.id, latestVersion),
        permissions
      };
    })
  );
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

export async function publishOfficialPluginRelease(input: {
  manifest: unknown;
  artifactDigest: string;
  signature?: string;
}): Promise<{ plugin: TPlugin; version: TPluginVersion }> {
  const manifest = ZPluginManifest.parse(input.manifest);
  if (!/^sha256-[a-f0-9]{64}$/.test(input.artifactDigest)) {
    throw new AppError('Artifact digest must be a SHA-256 content digest', 'INVALID_PLUGIN_ARTIFACT', 400);
  }

  const existingVersion = await getPluginVersion(manifest.id, manifest.version);
  if (existingVersion) {
    if (existingVersion.artifactDigest !== input.artifactDigest) {
      throw new AppError('Published plugin versions are immutable', 'PLUGIN_VERSION_IMMUTABLE', 409);
    }

    const plugin = await getPluginById(manifest.id);
    if (!plugin) throw new AppError('Plugin record not found', 'PLUGIN_NOT_FOUND', 404);

    return { plugin, version: existingVersion };
  }

  return registerPluginWithVersion(
    {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      publisher: manifest.publisher,
      status: 'published',
      distribution: 'public'
    },
    {
      version: manifest.version,
      manifest,
      artifactDigest: input.artifactDigest,
      signature: input.signature,
      reviewStatus: 'approved'
    }
  );
}
