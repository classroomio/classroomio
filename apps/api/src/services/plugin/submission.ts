import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { AppError } from '@api/utils/errors';
import {
  createPluginSubmission,
  createPluginVersion,
  getPluginById,
  getPluginSubmissionById,
  getPluginVersion,
  listPluginSubmissions,
  updatePluginSubmissionStatus,
  updatePluginVersionReviewStatus,
  upsertPlugin
} from '@cio/db/queries/plugin';
import type { TPluginReleaseLane, TPluginSubmission, TPluginSubmissionStatus } from '@cio/db/types';
import { ZPluginManifest, type TPluginManifest } from '@cio/utils/validation/plugin';

export interface TarEntry {
  path: string;
  size: number;
  type: string;
  content: Buffer;
}

export function parseTarGz(archiveBuffer: Buffer): TarEntry[] {
  let tarBuffer: Buffer;
  try {
    tarBuffer = zlib.gunzipSync(archiveBuffer);
  } catch (err) {
    throw new AppError('Invalid gzip archive: failed to decompress', 'INVALID_ARCHIVE', 400);
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

    entries.push({
      path: relativePath,
      size,
      type: typeFlag,
      content: Buffer.from(content)
    });
  }

  return entries;
}

function getQuarantineDirectory(submissionId: string): string {
  const baseDirectory = process.env.PLUGIN_QUARANTINE_PATH || path.resolve(process.cwd(), '.plugin-quarantine');
  return path.resolve(baseDirectory, submissionId);
}

function getArtifactsTargetDirectory(pluginId: string, version: string, digest: string): string {
  const baseDirectory = process.env.PLUGIN_ARTIFACTS_PATH || path.resolve(process.cwd(), '.plugin-artifacts');
  return path.resolve(baseDirectory, pluginId, version, digest);
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

export async function createSubmissionIntent(options: {
  pluginId: string;
  version: string;
  releaseLane: TPluginReleaseLane;
  artifactDigest: string;
  organizationId?: string;
  publisherId?: string;
  profileId: string;
}): Promise<{ submission: TPluginSubmission; uploadUrl: string }> {
  const { pluginId, version, releaseLane, artifactDigest, organizationId, publisherId, profileId } = options;

  if (releaseLane === 'first-party' && !pluginId.startsWith('com.classroomio.')) {
    throw new AppError('First-party plugins must use the com.classroomio.* namespace', 'FORBIDDEN_NAMESPACE', 403);
  }

  if (releaseLane === 'community' && pluginId.startsWith('com.classroomio.')) {
    throw new AppError(
      'Community plugins cannot use the reserved com.classroomio.* namespace',
      'RESERVED_NAMESPACE',
      403
    );
  }

  if (releaseLane === 'private' && !organizationId) {
    throw new AppError('Private plugins require an organizationId', 'ORGANIZATION_REQUIRED', 400);
  }

  const existingVersion = await getPluginVersion(pluginId, version);
  if (existingVersion && existingVersion.reviewStatus === 'approved') {
    throw new AppError(
      `Plugin ${pluginId}@${version} has already been approved and published`,
      'VERSION_ALREADY_EXISTS',
      409
    );
  }

  const quarantineKey = `quarantine/${pluginId}/${version}/${artifactDigest}.tar.gz`;
  const submission = await createPluginSubmission({
    pluginId,
    publisherId: publisherId ?? null,
    organizationId: organizationId ?? null,
    version,
    releaseLane,
    quarantineBucket: 'local-quarantine',
    quarantineKey,
    artifactDigest,
    status: 'pending_upload',
    submittedByProfileId: profileId
  });

  const uploadUrl = `/plugins/submissions/${submission.id}/upload`;

  return {
    submission,
    uploadUrl
  };
}

export async function storeQuarantineUpload(submissionId: string, archiveBuffer: Buffer): Promise<TPluginSubmission> {
  const submission = await getPluginSubmissionById(submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 'NOT_FOUND', 404);
  }

  if (submission.status !== 'pending_upload') {
    throw new AppError(`Submission is in ${submission.status} status and cannot accept upload`, 'INVALID_STATUS', 400);
  }

  const hashHex = crypto.createHash('sha256').update(archiveBuffer).digest('hex');
  const computedDigest = `sha256-${hashHex}`;
  if (computedDigest !== submission.artifactDigest) {
    throw new AppError(
      `Archive SHA-256 digest mismatch. Claimed: ${submission.artifactDigest}, computed: ${computedDigest}`,
      'ARTIFACT_DIGEST_MISMATCH',
      400
    );
  }

  const directoryPath = getQuarantineDirectory(submissionId);
  fs.mkdirSync(directoryPath, { recursive: true });
  fs.writeFileSync(path.join(directoryPath, 'package.tar.gz'), archiveBuffer);

  const updated = await updatePluginSubmissionStatus(submissionId, 'quarantined');
  if (!updated) {
    throw new AppError('Failed to update submission status', 'DATABASE_ERROR', 500);
  }

  return updated;
}

export async function completeSubmission(
  submissionId: string
): Promise<{ submission: TPluginSubmission; manifest: TPluginManifest }> {
  const submission = await getPluginSubmissionById(submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 'NOT_FOUND', 404);
  }

  if (submission.status !== 'quarantined') {
    throw new AppError(
      `Submission is in ${submission.status} status, must be quarantined before finalizing`,
      'INVALID_STATUS',
      400
    );
  }

  const packagePath = path.join(getQuarantineDirectory(submissionId), 'package.tar.gz');
  if (!fs.existsSync(packagePath)) {
    throw new AppError('Quarantine package archive not found', 'FILE_NOT_FOUND', 404);
  }

  const archiveBuffer = fs.readFileSync(packagePath);
  const entries = parseTarGz(archiveBuffer);

  let manifestEntry: TarEntry | undefined;

  for (const entry of entries) {
    if (entry.path.startsWith('/') || entry.path.startsWith('\\') || entry.path.includes('..')) {
      throw new AppError(`Archive contains illegal path traversal entry: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }

    if (entry.type === '1' || entry.type === '2') {
      throw new AppError(`Archive contains forbidden link entry: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }

    if (entry.path === 'plugin.json') {
      manifestEntry = entry;
    }

    if (/\.(js|mjs|ts|tsx|svelte|html)$/i.test(entry.path)) {
      const codeString = entry.content.toString('utf8');
      if (codeString.includes('@cio/') || codeString.includes('$lib/')) {
        throw new AppError(
          `Security violation: forbidden host internal import detected in ${entry.path}`,
          'FORBIDDEN_IMPORT',
          400
        );
      }
    }
  }

  if (!manifestEntry) {
    throw new AppError('Archive is missing required plugin.json manifest at root', 'MISSING_MANIFEST', 400);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(manifestEntry.content.toString('utf8'));
  } catch {
    throw new AppError('plugin.json is not valid JSON', 'INVALID_MANIFEST', 400);
  }

  const manifestParseResult = ZPluginManifest.safeParse(parsedJson);
  if (!manifestParseResult.success) {
    const errorDetails = manifestParseResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new AppError(`Manifest validation failed: ${errorDetails}`, 'INVALID_MANIFEST', 400);
  }

  const manifest = manifestParseResult.data;

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

  const destinationDirectory = getArtifactsTargetDirectory(
    submission.pluginId,
    submission.version,
    submission.artifactDigest
  );

  if (submission.releaseLane === 'first-party') {
    extractEntriesToDirectory(entries, destinationDirectory, archiveBuffer);

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

    await createPluginVersion({
      pluginId: manifest.id,
      version: manifest.version,
      manifest,
      artifactDigest: submission.artifactDigest,
      reviewStatus: 'approved'
    });

    const updated = await updatePluginSubmissionStatus(submissionId, 'approved', 'Auto-approved first-party plugin');
    return { submission: updated!, manifest };
  }

  if (submission.releaseLane === 'private') {
    extractEntriesToDirectory(entries, destinationDirectory, archiveBuffer);

    const generatedSlug = manifest.slug ?? manifest.id.split('.').pop()!;
    await upsertPlugin({
      id: manifest.id,
      slug: generatedSlug,
      name: manifest.name,
      description: manifest.description ?? null,
      publisher: manifest.publisher,
      publisherId: submission.publisherId ?? null,
      status: 'published',
      distribution: 'private'
    });

    await createPluginVersion({
      pluginId: manifest.id,
      version: manifest.version,
      manifest,
      artifactDigest: submission.artifactDigest,
      reviewStatus: 'approved'
    });

    const updated = await updatePluginSubmissionStatus(
      submissionId,
      'approved',
      'Auto-approved private organization plugin'
    );
    return { submission: updated!, manifest };
  }

  const existingVersion = await getPluginVersion(manifest.id, manifest.version);
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

  const packagePath = path.join(getQuarantineDirectory(submissionId), 'package.tar.gz');
  if (!fs.existsSync(packagePath)) {
    throw new AppError('Quarantine package archive not found', 'FILE_NOT_FOUND', 404);
  }

  const archiveBuffer = fs.readFileSync(packagePath);
  const entries = parseTarGz(archiveBuffer);

  const manifestEntry = entries.find((e) => e.path === 'plugin.json');
  if (!manifestEntry) {
    throw new AppError('Archive is missing required plugin.json manifest', 'MISSING_MANIFEST', 400);
  }

  const manifest = JSON.parse(manifestEntry.content.toString('utf8')) as TPluginManifest;
  const destinationDirectory = getArtifactsTargetDirectory(
    submission.pluginId,
    submission.version,
    submission.artifactDigest
  );

  extractEntriesToDirectory(entries, destinationDirectory, archiveBuffer);

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

export async function listSubmissions(
  options: {
    pluginId?: string;
    organizationId?: string;
    status?: TPluginSubmissionStatus;
  } = {}
): Promise<TPluginSubmission[]> {
  return listPluginSubmissions(options);
}
