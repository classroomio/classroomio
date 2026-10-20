import fs from 'node:fs';
import path from 'node:path';
import { AppError } from '@api/utils/errors';
import { getFromS3 } from '@cio/core/utils/s3';
import {
  PluginVersionDigestConflictError,
  registerPluginReleaseBatch,
  type PluginReleaseRegistration
} from '@cio/db/queries/plugin';
import type { TInternalPluginReleaseRequest, TPluginReleaseCandidate } from '@cio/utils/validation/plugin';
import {
  extractEntriesToDirectory,
  MAX_PLUGIN_ARCHIVE_BYTES,
  validatePluginArchive,
  type TarEntry
} from './release-validation';

export interface RegisteredReleaseResult {
  pluginId: string;
  version: string;
  artifactDigest: string;
  status: 'created' | 'already_registered';
}

function getArchiveKey(candidate: TPluginReleaseCandidate): string {
  return `${candidate.pluginId}/${candidate.version}/${candidate.artifactDigest}/package.tar.gz`;
}

async function fetchArchiveBuffer(candidate: TPluginReleaseCandidate): Promise<Buffer> {
  const assetBucket = process.env.PLUGIN_ASSET_BUCKET;
  const archiveKey = getArchiveKey(candidate);

  if (assetBucket) {
    const s3Result = await getFromS3({
      Bucket: assetBucket,
      Key: archiveKey
    });

    if (!s3Result.success || !s3Result.data?.Body) {
      throw new AppError(
        `Immutable release archive not found for ${candidate.pluginId}@${candidate.version}`,
        'ARCHIVE_NOT_FOUND',
        404
      );
    }

    const contentLength = s3Result.data.ContentLength;
    if (typeof contentLength === 'number' && contentLength > MAX_PLUGIN_ARCHIVE_BYTES) {
      throw new AppError('Plugin archive exceeds the maximum upload size', 'ARCHIVE_TOO_LARGE', 413);
    }

    const bytes = await s3Result.data.Body.transformToByteArray();
    const archiveBuffer = Buffer.from(bytes);
    if (archiveBuffer.length > MAX_PLUGIN_ARCHIVE_BYTES) {
      throw new AppError('Plugin archive exceeds the maximum upload size', 'ARCHIVE_TOO_LARGE', 413);
    }

    return archiveBuffer;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new AppError('Plugin release storage is not configured', 'SERVER_ERROR', 503);
  }

  const artifactsRoot = process.env.PLUGIN_ARTIFACTS_PATH
    ? path.resolve(process.cwd(), process.env.PLUGIN_ARTIFACTS_PATH)
    : path.resolve(process.cwd(), '.plugin-artifacts');
  const archivePath = path.join(
    artifactsRoot,
    candidate.pluginId,
    candidate.version,
    `${candidate.pluginId}-${candidate.version}.tar.gz`
  );

  if (!fs.existsSync(archivePath) || !fs.statSync(archivePath).isFile()) {
    throw new AppError(
      `Immutable release archive not found for ${candidate.pluginId}@${candidate.version}`,
      'ARCHIVE_NOT_FOUND',
      404
    );
  }

  const archiveSize = fs.statSync(archivePath).size;
  if (archiveSize > MAX_PLUGIN_ARCHIVE_BYTES) {
    throw new AppError('Plugin archive exceeds the maximum upload size', 'ARCHIVE_TOO_LARGE', 413);
  }

  return fs.readFileSync(archivePath);
}

function assertNamespacePolicy(candidate: TPluginReleaseCandidate): void {
  const usesReservedNamespace = candidate.pluginId.startsWith('com.classroomio.');
  if (usesReservedNamespace !== (candidate.kind === 'first-party')) {
    throw new AppError('Only first-party plugins may use the com.classroomio namespace', 'SECURITY_VIOLATION', 400);
  }
}

function getLocalExtractionDirectory(candidate: TPluginReleaseCandidate): string | null {
  if (!process.env.PLUGIN_ARTIFACTS_PATH || process.env.PLUGIN_ASSET_ORIGIN) {
    return null;
  }

  const artifactsRoot = path.resolve(process.cwd(), process.env.PLUGIN_ARTIFACTS_PATH);
  return path.join(artifactsRoot, candidate.pluginId, candidate.version, candidate.artifactDigest);
}

export async function registerInternalReleases(
  request: TInternalPluginReleaseRequest
): Promise<{ registered: RegisteredReleaseResult[] }> {
  const pluginIds = new Set<string>();
  for (const candidate of request.releases) {
    if (pluginIds.has(candidate.pluginId)) {
      throw new AppError(
        `Duplicate plugin ID in release request: ${candidate.pluginId}`,
        'DUPLICATE_RELEASE_CANDIDATE',
        400
      );
    }

    pluginIds.add(candidate.pluginId);
    assertNamespacePolicy(candidate);
  }

  const registrations: PluginReleaseRegistration[] = [];
  const localExtractions: Array<{ entries: TarEntry[]; archive: Buffer; destination: string }> = [];

  for (const candidate of request.releases) {
    const archiveBuffer = await fetchArchiveBuffer(candidate);
    const { manifest, entries } = validatePluginArchive(archiveBuffer, candidate.artifactDigest);

    if (manifest.id !== candidate.pluginId || manifest.version !== candidate.version) {
      throw new AppError(
        `Archive manifest (${manifest.id}@${manifest.version}) does not match release request (${candidate.pluginId}@${candidate.version})`,
        'MANIFEST_MISMATCH',
        400
      );
    }

    const slug = manifest.slug ?? manifest.id.split('.').pop()!;
    const archiveKey = getArchiveKey(candidate);
    registrations.push({
      plugin: {
        id: manifest.id,
        slug,
        name: manifest.name,
        description: manifest.description ?? null,
        publisher: manifest.publisher,
        status: 'published',
        distribution: 'public'
      },
      version: {
        pluginId: manifest.id,
        version: manifest.version,
        manifest,
        artifactDigest: candidate.artifactDigest,
        sourceCommit: request.sourceCommit,
        releaseRunUrl: request.workflowRunUrl,
        releasedBy: 'github-actions',
        releaseMetadata: {
          sourceRepository: 'classroomio/classroomio-plugins',
          artifactKey: archiveKey
        },
        reviewStatus: 'approved'
      }
    });

    const destination = getLocalExtractionDirectory(candidate);
    if (destination) {
      localExtractions.push({ entries, archive: archiveBuffer, destination });
    }
  }

  try {
    const registered = await registerPluginReleaseBatch(registrations);

    for (const extraction of localExtractions) {
      extractEntriesToDirectory(extraction.entries, extraction.destination, extraction.archive);
    }

    return { registered };
  } catch (error) {
    if (error instanceof PluginVersionDigestConflictError) {
      throw new AppError(
        `Version ${error.version} of plugin ${error.pluginId} already exists with a different digest (${error.existingDigest})`,
        'CONFLICT',
        409
      );
    }

    throw error;
  }
}
