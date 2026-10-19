import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { AppError } from '@api/utils/errors';
import { generateUploadPresignedUrl, getFromS3, uploadToS3 } from '@cio/core/utils/s3';
import { isPlatformAdmin } from '@cio/db/queries/auth';
import {
  createPluginSubmission,
  createPluginVersion,
  getPluginById,
  getPluginSubmissionById,
  getPluginVersion,
  listPluginSubmissions,
  updatePluginVersionArtifact,
  updatePluginSubmissionStatus,
  updatePluginVersionReviewStatus,
  upsertPlugin
} from '@cio/db/queries/plugin';
import type { TPluginReleaseLane, TPluginSubmission, TPluginSubmissionStatus } from '@cio/db/types';
import { ZPluginManifest, type TPluginManifest } from '@cio/utils/validation/plugin';
import { installPlugin } from './installation';

export interface TarEntry {
  path: string;
  size: number;
  type: string;
  content: Buffer;
}

const MAX_PLUGIN_ARCHIVE_BYTES = 12 * 1024 * 1024;
const MAX_PLUGIN_EXTRACTED_BYTES = 48 * 1024 * 1024;
const MAX_PLUGIN_ARCHIVE_ENTRIES = 1_000;

export function parseTarGz(archiveBuffer: Buffer): TarEntry[] {
  if (archiveBuffer.length > MAX_PLUGIN_ARCHIVE_BYTES) {
    throw new AppError('Plugin archive exceeds the maximum upload size', 'ARCHIVE_TOO_LARGE', 413);
  }

  let tarBuffer: Buffer;
  try {
    tarBuffer = zlib.gunzipSync(archiveBuffer);
  } catch (err) {
    throw new AppError('Invalid gzip archive: failed to decompress', 'INVALID_ARCHIVE', 400);
  }

  if (tarBuffer.length > MAX_PLUGIN_EXTRACTED_BYTES) {
    throw new AppError('Plugin archive exceeds the maximum extracted size', 'ARCHIVE_TOO_LARGE', 413);
  }

  const entries: TarEntry[] = [];
  let byteOffset = 0;

  while (byteOffset + 512 <= tarBuffer.length) {
    const headerBlock = tarBuffer.subarray(byteOffset, byteOffset + 512);
    const isZeroBlock = headerBlock.every((byteValue) => byteValue === 0);
    if (isZeroBlock) break;

    let relativePath = headerBlock.toString('utf8', 0, 100).replace(/\0.*$/, '');
    const prefix = headerBlock.toString('utf8', 345, 500).replace(/\0.*$/, '');
    if (prefix) {
      relativePath = `${prefix}/${relativePath}`;
    }

    const sizeString = headerBlock.toString('ascii', 124, 136).replace(/\0.*$/, '').trim();
    const size = parseInt(sizeString, 8) || 0;
    const typeFlag = String.fromCharCode(headerBlock[156]);

    byteOffset += 512;
    const content = tarBuffer.subarray(byteOffset, byteOffset + size);
    const paddedBlockCount = Math.ceil(size / 512) * 512;
    byteOffset += paddedBlockCount;

    if (byteOffset > tarBuffer.length) {
      throw new AppError('Invalid tar archive entry size', 'INVALID_ARCHIVE', 400);
    }

    entries.push({
      path: relativePath,
      size,
      type: typeFlag,
      content: Buffer.from(content)
    });

    if (entries.length > MAX_PLUGIN_ARCHIVE_ENTRIES) {
      throw new AppError('Plugin archive contains too many files', 'ARCHIVE_TOO_LARGE', 413);
    }
  }

  return entries;
}

function parsePluginArchive(
  archiveBuffer: Buffer,
  expectedDigest: string
): { entries: TarEntry[]; manifest: TPluginManifest } {
  const computedDigest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;
  if (computedDigest !== expectedDigest) {
    throw new AppError('Plugin archive digest does not match the submitted digest', 'ARTIFACT_DIGEST_MISMATCH', 400);
  }

  const entries = parseTarGz(archiveBuffer);
  const paths = new Set<string>();
  let manifestEntry: TarEntry | undefined;

  for (const entry of entries) {
    if (
      !entry.path ||
      entry.path.startsWith('/') ||
      entry.path.startsWith('\\') ||
      entry.path.includes('..') ||
      paths.has(entry.path)
    ) {
      throw new AppError(`Archive contains an invalid path: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }
    paths.add(entry.path);

    if (entry.type === '1' || entry.type === '2') {
      throw new AppError(`Archive contains a forbidden link: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }

    if (entry.path === 'plugin.json') {
      manifestEntry = entry;
    }

    if (/\.(js|mjs|ts|tsx|svelte|html)$/i.test(entry.path)) {
      const source = entry.content.toString('utf8');
      if (source.includes('@cio/') || source.includes('$lib/')) {
        throw new AppError(`Archive contains a forbidden host import: ${entry.path}`, 'FORBIDDEN_IMPORT', 400);
      }
    }
  }

  if (!manifestEntry) {
    throw new AppError('Archive is missing plugin.json', 'MISSING_MANIFEST', 400);
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestEntry.content.toString('utf8'));
  } catch {
    throw new AppError('plugin.json is not valid JSON', 'INVALID_MANIFEST', 400);
  }

  const parsedManifest = ZPluginManifest.safeParse(manifestJson);
  if (!parsedManifest.success) {
    throw new AppError('plugin.json is invalid', 'INVALID_MANIFEST', 400);
  }

  return { entries, manifest: parsedManifest.data };
}

function getArtifactsTargetDirectory(pluginId: string, version: string, digest: string): string {
  const baseDirectory = process.env.PLUGIN_ARTIFACTS_PATH || path.resolve(process.cwd(), '.plugin-artifacts');
  return path.resolve(baseDirectory, pluginId, version, digest);
}

function getQuarantineBucket(): string {
  const bucket = process.env.PLUGIN_QUARANTINE_BUCKET;
  if (!bucket) {
    throw new AppError('PLUGIN_QUARANTINE_BUCKET is required for plugin publishing', 'SERVER_CONFIGURATION_ERROR', 500);
  }

  return bucket;
}

async function readQuarantineArchive(submission: TPluginSubmission): Promise<Buffer> {
  const result = await getFromS3({
    Bucket: submission.quarantineBucket,
    Key: submission.quarantineKey
  });
  if (!result.success || !result.data?.Body) {
    throw new AppError('Quarantine package archive not found', 'FILE_NOT_FOUND', 404);
  }

  if (typeof result.data.ContentLength === 'number' && result.data.ContentLength > MAX_PLUGIN_ARCHIVE_BYTES) {
    throw new AppError('Plugin archive exceeds the maximum upload size', 'ARCHIVE_TOO_LARGE', 413);
  }

  const bytes = await result.data.Body.transformToByteArray();
  return Buffer.from(bytes);
}

function extractEntriesToDirectory(entries: TarEntry[], destinationDirectory: string, archiveBuffer?: Buffer): void {
  fs.mkdirSync(destinationDirectory, { recursive: true });

  for (const entry of entries) {
    const fullPath = path.resolve(destinationDirectory, entry.path);
    if (!fullPath.startsWith(destinationDirectory)) {
      throw new AppError(`Path traversal detected: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }

    if (entry.type === '5' || entry.path.endsWith('/')) {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      const parentDirectory = path.dirname(fullPath);
      fs.mkdirSync(parentDirectory, { recursive: true });
      fs.writeFileSync(fullPath, entry.content);
    }
  }

  if (archiveBuffer) {
    fs.writeFileSync(path.join(destinationDirectory, 'package.tar.gz'), archiveBuffer);
  }
}

function getArtifactContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  return contentTypes[extension] ?? 'application/octet-stream';
}

async function promoteArtifact(
  entries: TarEntry[],
  submission: TPluginSubmission,
  archiveBuffer: Buffer
): Promise<void> {
  const destinationDirectory = getArtifactsTargetDirectory(
    submission.pluginId,
    submission.version,
    submission.artifactDigest
  );
  if (process.env.NODE_ENV !== 'production') {
    extractEntriesToDirectory(entries, destinationDirectory, archiveBuffer);

    return;
  }

  if (!process.env.PLUGIN_ASSET_ORIGIN) {
    throw new AppError('PLUGIN_ASSET_ORIGIN is required for production promotion', 'SERVER_CONFIGURATION_ERROR', 500);
  }

  const bucket = process.env.PLUGIN_ASSET_BUCKET;
  if (!bucket) {
    throw new AppError('PLUGIN_ASSET_BUCKET is required for production promotion', 'SERVER_CONFIGURATION_ERROR', 500);
  }
  const keyPrefix = `${submission.pluginId}/${submission.version}/${submission.artifactDigest}`;

  for (const entry of entries) {
    if (entry.type === '5' || entry.path.endsWith('/')) {
      continue;
    }

    const uploadInput = {
      Bucket: bucket,
      Key: `${keyPrefix}/${entry.path}`,
      Body: entry.content,
      ContentType: getArtifactContentType(entry.path),
      CacheControl: 'public, max-age=31536000, immutable'
    };
    const uploadResult = await uploadToS3(uploadInput);
    if (!uploadResult.success) {
      throw new AppError(
        `Failed to promote plugin artifact ${entry.path}: ${uploadResult.error ?? 'Unknown error'}`,
        'ARTIFACT_PROMOTION_FAILED',
        502
      );
    }
  }

  const archiveUploadInput = {
    Bucket: bucket,
    Key: `${keyPrefix}/package.tar.gz`,
    Body: archiveBuffer,
    ContentType: 'application/gzip',
    CacheControl: 'public, max-age=31536000, immutable'
  };
  const archiveUploadResult = await uploadToS3(archiveUploadInput);
  if (!archiveUploadResult.success) {
    throw new AppError(
      `Failed to promote plugin archive: ${archiveUploadResult.error ?? 'Unknown error'}`,
      'ARTIFACT_PROMOTION_FAILED',
      502
    );
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
  const { entries, manifest } = parsePluginArchive(options.archive, options.artifactDigest);
  if (manifest.id !== submittedManifest.id || manifest.version !== submittedManifest.version) {
    throw new AppError('Submitted manifest does not match the packaged manifest', 'MANIFEST_MISMATCH', 400);
  }

  const artifactDirectory = getArtifactsTargetDirectory(manifest.id, manifest.version, options.artifactDigest);
  extractEntriesToDirectory(entries, artifactDirectory, options.archive);

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

  const existingVersion = await getPluginVersion(manifest.id, manifest.version);
  if (existingVersion) {
    await updatePluginVersionArtifact(manifest.id, manifest.version, manifest, options.artifactDigest);
  } else {
    await createPluginVersion({
      pluginId: manifest.id,
      version: manifest.version,
      manifest,
      artifactDigest: options.artifactDigest,
      reviewStatus: 'approved'
    });
  }

  await installPlugin({
    pluginId: manifest.id,
    version: manifest.version,
    ownerType: 'organization',
    organizationId: options.organizationId,
    installedByProfileId: options.profileId,
    allowDowngrade: true,
    replaceExisting: true
  });

  return {
    pluginId: manifest.id,
    version: manifest.version,
    artifactDigest: options.artifactDigest
  };
}

export async function createSubmissionIntent(options: {
  pluginId: string;
  version: string;
  releaseLane: TPluginReleaseLane;
  artifactDigest: string;
  organizationId?: string;
  profileId: string;
}): Promise<{ submission: TPluginSubmission; uploadUrl: string }> {
  const { pluginId, version, releaseLane, artifactDigest, organizationId, profileId } = options;

  if (releaseLane !== 'first-party' && pluginId.startsWith('com.classroomio.')) {
    throw new AppError('The com.classroomio.* namespace is reserved for trusted publishers', 'RESERVED_NAMESPACE', 403);
  }

  const existingSubmissions = await listPluginSubmissions({ pluginId });
  const existingOwnerSubmission = existingSubmissions[0];
  if (existingOwnerSubmission && existingOwnerSubmission.submittedByProfileId !== profileId) {
    throw new AppError('Plugin ID belongs to another publisher', 'PLUGIN_PUBLISHER_MISMATCH', 403);
  }

  const existingVersion = await getPluginVersion(pluginId, version);
  if (existingVersion && existingVersion.reviewStatus === 'approved') {
    throw new AppError(
      `Plugin ${pluginId}@${version} has already been approved and published`,
      'VERSION_ALREADY_EXISTS',
      409
    );
  }

  const quarantineBucket = getQuarantineBucket();
  const quarantineKey = `submissions/${pluginId}/${version}/${artifactDigest}.tar.gz`;
  const submission = await createPluginSubmission({
    pluginId,
    publisherId: null,
    organizationId: organizationId ?? null,
    version,
    releaseLane,
    quarantineBucket,
    quarantineKey,
    artifactDigest,
    status: 'pending_upload',
    submittedByProfileId: profileId
  });

  const uploadUrl = await generateUploadPresignedUrl(quarantineKey, quarantineBucket, 'application/gzip');

  return {
    submission,
    uploadUrl
  };
}

export async function completeSubmission(
  submissionId: string
): Promise<{ submission: TPluginSubmission; manifest: TPluginManifest }> {
  const submission = await getPluginSubmissionById(submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 'NOT_FOUND', 404);
  }

  if (submission.status !== 'pending_upload') {
    throw new AppError(`Submission is in ${submission.status} status and cannot be finalized`, 'INVALID_STATUS', 400);
  }

  const archiveBuffer = await readQuarantineArchive(submission);
  const { entries, manifest } = parsePluginArchive(archiveBuffer, submission.artifactDigest);

  if (manifest.id !== submission.pluginId) {
    throw new AppError(
      `Manifest ID (${manifest.id}) does not match submission pluginId (${submission.pluginId})`,
      'MANIFEST_MISMATCH',
      400
    );
  }

  if (manifest.version !== submission.version) {
    throw new AppError(
      `Manifest version (${manifest.version}) does not match submission version (${submission.version})`,
      'MANIFEST_MISMATCH',
      400
    );
  }

  await updatePluginSubmissionStatus(submissionId, 'quarantined');

  const [existingPlugin, existingVersion] = await Promise.all([
    getPluginById(manifest.id),
    getPluginVersion(manifest.id, manifest.version)
  ]);
  if (!existingPlugin) {
    const generatedSlug = manifest.slug ?? manifest.id.split('.').pop()!;
    await upsertPlugin({
      id: manifest.id,
      slug: generatedSlug,
      name: manifest.name,
      description: manifest.description ?? null,
      publisher: manifest.publisher,
      publisherId: submission.publisherId ?? null,
      status: 'draft',
      distribution: 'public'
    });
  }

  if (!existingVersion) {
    await createPluginVersion({
      pluginId: manifest.id,
      version: manifest.version,
      manifest,
      artifactDigest: submission.artifactDigest,
      reviewStatus: 'pending'
    });
  }

  const updated = await updatePluginSubmissionStatus(
    submissionId,
    'in_review',
    'Queued for ClassroomIO marketplace review'
  );
  return { submission: updated!, manifest };
}

export async function reviewSubmission(
  submissionId: string,
  action: 'approve' | 'reject',
  reviewNotes?: string
): Promise<TPluginSubmission> {
  const submission = await getPluginSubmissionById(submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 'NOT_FOUND', 404);
  }

  if (submission.status !== 'in_review') {
    throw new AppError(`Submission is in ${submission.status} status and cannot be reviewed`, 'INVALID_STATUS', 400);
  }

  if (action === 'reject') {
    await updatePluginVersionReviewStatus(submission.pluginId, submission.version, 'rejected');
    const updated = await updatePluginSubmissionStatus(submissionId, 'rejected', reviewNotes ?? 'Submission rejected');
    return updated!;
  }

  const archiveBuffer = await readQuarantineArchive(submission);
  const { entries, manifest } = parsePluginArchive(archiveBuffer, submission.artifactDigest);
  if (manifest.id !== submission.pluginId || manifest.version !== submission.version) {
    throw new AppError('Packaged manifest does not match the reviewed submission', 'MANIFEST_MISMATCH', 400);
  }

  await promoteArtifact(entries, submission, archiveBuffer);

  const generatedSlug = manifest.slug ?? manifest.id.split('.').pop()!;
  await upsertPlugin({
    id: manifest.id,
    slug: generatedSlug,
    name: manifest.name,
    description: manifest.description ?? null,
    publisher: manifest.publisher,
    publisherId: submission.publisherId ?? null,
    status: 'published',
    distribution: 'public'
  });

  await updatePluginVersionReviewStatus(submission.pluginId, submission.version, 'approved');

  const updated = await updatePluginSubmissionStatus(
    submissionId,
    'approved',
    reviewNotes ?? 'Approved by marketplace review team'
  );

  return updated!;
}

export async function getSubmissionDetails(submissionId: string): Promise<TPluginSubmission> {
  const submission = await getPluginSubmissionById(submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 'NOT_FOUND', 404);
  }

  return submission;
}

export function getSubmissionReviewUrl(submission: TPluginSubmission): string {
  const reviewOrigin = process.env.PLUGIN_REVIEW_ORIGIN;
  if (!reviewOrigin) {
    throw new AppError('PLUGIN_REVIEW_ORIGIN is required for reviewer previews', 'SERVER_CONFIGURATION_ERROR', 500);
  }

  return `${reviewOrigin.replace(/\/$/, '')}/${encodeURIComponent(submission.id)}/`;
}

export async function assertPlatformPluginReviewer(profileId: string): Promise<void> {
  const isReviewer = await isPlatformAdmin(profileId);
  if (!isReviewer) {
    throw new AppError('Platform reviewer access is required', 'FORBIDDEN', 403);
  }
}

export async function listSubmissions(
  options: {
    pluginId?: string;
    organizationId?: string;
    status?: TPluginSubmissionStatus;
  } = {}
): Promise<TPluginSubmission[]> {
  return listPluginSubmissions(options);
}
