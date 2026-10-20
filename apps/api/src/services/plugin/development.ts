import path from 'node:path';
import { AppError } from '@api/utils/errors';
import {
  createPluginVersion,
  getPluginById,
  getPluginVersion,
  updatePluginVersionArtifact,
  upsertPlugin
} from '@cio/db/queries/plugin';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import type { TOrganizationApiKey } from '@cio/db/types';
import { ROLE } from '@cio/utils/constants';
import { ZPluginManifest } from '@cio/utils/validation/plugin';
import { extractEntriesToDirectory, validatePluginArchive } from './release-validation';
import { installPlugin } from './installation';

export function getArtifactsTargetDirectory(pluginId: string, version: string, digest: string): string {
  const baseDirectory = process.env.PLUGIN_ARTIFACTS_PATH
    ? path.resolve(process.cwd(), process.env.PLUGIN_ARTIFACTS_PATH)
    : path.resolve(process.cwd(), '.plugin-artifacts');

  const targetDirectory = path.resolve(baseDirectory, pluginId, version, digest);
  const expectedPrefix = `${baseDirectory}${path.sep}`;
  if (!targetDirectory.startsWith(expectedPrefix)) {
    throw new AppError('Invalid development artifact path', 'SECURITY_VIOLATION', 400);
  }

  return targetDirectory;
}

export async function assertPluginDevelopmentAccess(
  automationKey: TOrganizationApiKey,
  organizationId: string
): Promise<void> {
  const hasDevelopmentScope = automationKey.scopes.includes('plugin:development');
  if (automationKey.type !== 'api' || !hasDevelopmentScope || automationKey.organizationId !== organizationId) {
    throw new AppError('Organization development access is required', 'FORBIDDEN', 403);
  }

  const roleId = await getOrganizationMemberRoleId(organizationId, automationKey.createdByProfileId);
  if (roleId !== ROLE.ADMIN) {
    throw new AppError('Organization admin access is required', 'FORBIDDEN', 403);
  }
}

export async function publishDevelopmentRelease(options: {
  manifest: unknown;
  artifactDigest: string;
  archive: Buffer;
  organizationId: string;
  profileId: string;
}): Promise<{ pluginId: string; version: string; artifactDigest: string }> {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('Development releases are unavailable in production', 'DEV_RELEASE_UNAVAILABLE', 404);
  }

  const submittedManifest = ZPluginManifest.parse(options.manifest);
  const { entries, manifest } = validatePluginArchive(options.archive, options.artifactDigest);
  if (manifest.id !== submittedManifest.id || manifest.version !== submittedManifest.version) {
    throw new AppError('Submitted manifest does not match the packaged manifest', 'MANIFEST_MISMATCH', 400);
  }

  const existingVersion = await getPluginVersion(manifest.id, manifest.version);
  if (existingVersion && existingVersion.releasedBy !== 'development') {
    throw new AppError(`Plugin ${manifest.id}@${manifest.version} is an immutable production release`, 'CONFLICT', 409);
  }

  const artifactDirectory = getArtifactsTargetDirectory(manifest.id, manifest.version, options.artifactDigest);
  extractEntriesToDirectory(entries, artifactDirectory, options.archive);

  const existingPlugin = await getPluginById(manifest.id);
  if (!existingPlugin) {
    await upsertPlugin({
      id: manifest.id,
      slug: manifest.slug ?? manifest.id.split('.').pop()!,
      name: manifest.name,
      description: manifest.description ?? null,
      publisher: manifest.publisher,
      publisherId: null,
      status: 'published',
      distribution: 'private'
    });
  }

  if (existingVersion) {
    await updatePluginVersionArtifact(manifest.id, manifest.version, manifest, options.artifactDigest);
  } else {
    await createPluginVersion({
      pluginId: manifest.id,
      version: manifest.version,
      manifest,
      artifactDigest: options.artifactDigest,
      reviewStatus: 'approved',
      releasedBy: 'development',
      releaseMetadata: { organizationId: options.organizationId }
    });
  }

  await installPlugin({
    pluginId: manifest.id,
    version: manifest.version,
    ownerType: 'organization',
    organizationId: options.organizationId,
    installedByProfileId: options.profileId,
    replaceExisting: true
  });

  return {
    pluginId: manifest.id,
    version: manifest.version,
    artifactDigest: options.artifactDigest
  };
}
