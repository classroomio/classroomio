import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl, { type Entry } from 'yauzl';
import { UnrecoverableError } from 'bullmq';
import {
  PackageError,
  SCORM_ZIP_LIMITS,
  checkZipEntries,
  contentTypeForFile,
  findManifestEntry,
  normalizeZipPath,
  parseScormManifest,
  zipByteLimit,
  type ParsedScormPackage,
  type ScormPackageUnit,
  type ZipEntryInfo
} from '@cio/activity-packages';
import {
  bulkInsertPackageUnits,
  deletePackageUnitsByVersion,
  getAssetById,
  getCurrentPackageVersion,
  getPackageVersionById,
  setCurrentPackageVersion,
  updateAsset,
  updateMediaJob,
  updatePackageVersion
} from '@cio/db/queries';
import { ZActivityPackagePayload, type TActivityPackagePayload } from '@cio/jobs/payloads/activity-package';
import type { TNewContentPackageUnit } from '@cio/db/types';

import { getS3Client } from '../../config/storage';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import {
  downloadObjectToTempFile,
  safeUnlink,
  scormBucket,
  uploadBufferToBucket,
  uploadStreamToBucket
} from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { log } from '../../utils/logger';

const SCORM_CONTENT_CACHE_CONTROL = 'public, max-age=604800, immutable';
const MANIFEST_MAX_BYTES = 10 * 1024 * 1024;
const ZIP_MAGIC_LOCAL_FILE = [0x50, 0x4b, 0x03, 0x04];
const ZIP_MAGIC_EMPTY_ARCHIVE = [0x50, 0x4b, 0x05, 0x06];
const ZIP_MAGIC_SPANNED_ARCHIVE = [0x50, 0x4b, 0x07, 0x08];

function matchesMagic(header: Uint8Array, magic: number[]): boolean {
  return magic.every((byte, index) => header[index] === byte);
}

/**
 * Returns true when the header opens a ZIP archive. The worker enforces this
 * because browsers report ZIP uploads inconsistently.
 */
export function hasZipMagicBytes(header: Uint8Array): boolean {
  return (
    matchesMagic(header, ZIP_MAGIC_LOCAL_FILE) ||
    matchesMagic(header, ZIP_MAGIC_EMPTY_ARCHIVE) ||
    matchesMagic(header, ZIP_MAGIC_SPANNED_ARCHIVE)
  );
}

export function mapUnitsToRows(units: ScormPackageUnit[], packageVersionId: string): TNewContentPackageUnit[] {
  return units.map((unit) => ({
    packageVersionId,
    identifier: unit.identifier,
    parentIdentifier: unit.parentIdentifier,
    title: unit.title,
    position: unit.position,
    unitType: unit.unitType,
    href: unit.href,
    parameters: unit.parameters,
    masteryScore: unit.masteryScore === null ? null : String(unit.masteryScore),
    launchData: unit.launchData,
    formatDetails: { ...unit.formatDetails },
    isVisible: unit.isVisible
  }));
}

export function resolveScormLimitMb(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.UPLOAD_MAX_SCORM_MB);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

function isSymlink(entry: Entry): boolean {
  return ((entry.externalFileAttributes >> 16) & 0xf000) === 0xa000;
}

async function readEntryBuffer(zipfile: yauzl.ZipFile, entry: Entry): Promise<Buffer> {
  const stream = await zipfile.openReadStreamPromise(entry);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);

  return Buffer.concat(chunks);
}

interface CollectedArchive {
  entries: ZipEntryInfo[];
  names: string[];
  fileEntries: Entry[];
  zipfile: yauzl.ZipFile;
}

async function collectArchiveEntries(zipPath: string): Promise<CollectedArchive> {
  let zipfile: yauzl.ZipFile;
  try {
    zipfile = await yauzl.openPromise(zipPath, { validateEntrySizes: true, autoClose: false });
  } catch (error) {
    throw new PackageError('not_a_zip', { reason: errorMessage(error) });
  }

  const entries: ZipEntryInfo[] = [];
  const names: string[] = [];
  const fileEntries: Entry[] = [];

  try {
    for await (const entry of zipfile.eachEntry()) {
      if (entry.fileName.endsWith('/')) {
        normalizeZipPath(entry.fileName);
        continue;
      }

      if (entry.isEncrypted()) throw new PackageError('encrypted_entry', { name: entry.fileName });
      if (isSymlink(entry)) throw new PackageError('symlink_rejected', { name: entry.fileName });

      names.push(normalizeZipPath(entry.fileName));
      fileEntries.push(entry);
      entries.push({
        name: entry.fileName,
        size: entry.uncompressedSize,
        compressedSize: entry.compressedSize,
        isDirectory: false
      });
    }
  } catch (error) {
    if (error instanceof PackageError) throw error;
    throw new PackageError('unsafe_path', { reason: errorMessage(error) });
  }

  return { entries, names, fileEntries, zipfile };
}

async function failVersion(mediaJobId: string, versionId: string, code: string, message: string): Promise<void> {
  await updatePackageVersion(versionId, {
    status: 'failed',
    error: { code, message },
    processedAt: new Date().toISOString()
  });
  await updateMediaJob(mediaJobId, {
    status: 'failed',
    stage: 'failed',
    error: { code, message }
  });
}

interface ProcessScormResult {
  versionId: string;
  format: string;
  fileCount: number;
  extractedBytes: number;
}

/**
 * Validates, extracts, uploads and records one SCORM package version.
 * Deterministic package rejections throw UnrecoverableError; transient
 * storage failures throw so BullMQ retries. Idempotent across retries.
 */
export async function processScormPackage(rawData: unknown): Promise<ProcessScormResult> {
  const payload: TActivityPackagePayload = ZActivityPackagePayload.parse(rawData);
  const { mediaJobId, assetId, packageVersionId } = payload;

  const version = await getPackageVersionById(packageVersionId);
  if (!version || version.assetId !== assetId)
    throw new UnrecoverableError(`Package version ${packageVersionId} not found`);

  const asset = await getAssetById(assetId);
  if (!asset) throw new UnrecoverableError(`Asset ${assetId} not found`);

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { status: 'running', stage: 'validating', progressPercent: 5 });
  await updatePackageVersion(version.id, { status: 'processing', error: null });
  await deletePackageUnitsByVersion(version.id);

  const bucket = scormBucket();
  const zipLimitBytes = zipByteLimit(resolveScormLimitMb());

  let zipPath: string | undefined;
  let extractDir: string | undefined;
  let zipfile: yauzl.ZipFile | undefined;
  try {
    const head = await getS3Client()
      .send(new HeadObjectCommand({ Bucket: bucket, Key: version.uploadKey }))
      .catch(() => null);
    if (!head || typeof head.ContentLength !== 'number')
      throw new PackageError('upload_missing', { key: version.uploadKey });

    const zipBytes = head.ContentLength;
    if (zipBytes > zipLimitBytes) throw new PackageError('file_too_large', { bytes: zipBytes });

    zipPath = await downloadObjectToTempFile(bucket, version.uploadKey, `${assetId}.zip`);
    const header = await readFile(zipPath).then((buffer) => buffer.subarray(0, 4));
    if (!hasZipMagicBytes(header)) throw new PackageError('not_a_zip');

    const archive = await collectArchiveEntries(zipPath);
    zipfile = archive.zipfile;
    checkZipEntries(archive.entries, {
      maxEntries: SCORM_ZIP_LIMITS.maxEntries,
      maxTotalBytes: zipLimitBytes * 3,
      maxRatio: SCORM_ZIP_LIMITS.maxRatio
    });

    const manifestLookup = findManifestEntry(archive.names);
    if (!manifestLookup.found) throw new PackageError(manifestLookup.error);

    const manifestEntry = archive.fileEntries.find((entry) => normalizeZipPath(entry.fileName) === manifestLookup.path);
    if (!manifestEntry) throw new PackageError('missing_manifest');
    const manifestBuffer = await readEntryBuffer(zipfile, manifestEntry);
    if (manifestBuffer.length > MANIFEST_MAX_BYTES) throw new PackageError('invalid_xml');
    const parsed: ParsedScormPackage = parseScormManifest(
      manifestBuffer.toString('utf-8'),
      archive.names,
      manifestLookup.prefix
    );

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'extracting', progressPercent: 20 });

    extractDir = await mkdtemp(join(tmpdir(), 'scorm-extract-'));
    let extractedBytes = 0;
    for (const entry of archive.fileEntries) {
      const name = normalizeZipPath(entry.fileName);
      const localPath = join(extractDir, name);
      await mkdir(dirname(localPath), { recursive: true });
      const stream = await zipfile.openReadStreamPromise(entry);
      await pipeline(stream, createWriteStream(localPath));
      extractedBytes += entry.uncompressedSize;
    }

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'uploading files', progressPercent: 30 });

    let uploaded = 0;
    for (const entry of archive.fileEntries) {
      const name = normalizeZipPath(entry.fileName);
      const localPath = join(extractDir, name);
      await uploadStreamToBucket(
        bucket,
        `${version.contentPrefix}/${name}`,
        localPath,
        contentTypeForFile(name),
        SCORM_CONTENT_CACHE_CONTROL
      );
      uploaded += 1;
      if (uploaded % 25 === 0) {
        const progressPercent = 30 + Math.round((uploaded / Math.max(archive.fileEntries.length, 1)) * 55);
        await updateMediaJob(mediaJobId, { progressPercent });
      }
      if (uploaded % 100 === 0) await throwIfCancelRequested(mediaJobId);
    }

    const indexKey = `${version.contentPrefix}/index.json`;
    const indexBody = Buffer.from(JSON.stringify(archive.names));
    await uploadBufferToBucket(bucket, indexKey, indexBody, 'application/json; charset=utf-8');

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'reading manifest', progressPercent: 90 });

    await bulkInsertPackageUnits(mapUnitsToRows(parsed.units, version.id));
    await updatePackageVersion(version.id, {
      status: 'ready',
      format: parsed.format,
      manifestIdentifier: parsed.manifestIdentifier,
      title: parsed.title,
      manifest: {
        identifier: parsed.manifestIdentifier,
        title: parsed.title,
        format: parsed.format,
        unitCount: parsed.units.length
      },
      warnings: parsed.warnings,
      error: null,
      zipBytes,
      extractedBytes,
      fileCount: archive.fileEntries.length,
      processingJobId: mediaJobId,
      processedAt: new Date().toISOString()
    });

    const current = await getCurrentPackageVersion(assetId);
    if (!current) {
      await setCurrentPackageVersion(version.id);
      await updateAsset(assetId, asset.organizationId, { status: 'active' });
    }

    await updateMediaJob(mediaJobId, {
      status: 'completed',
      stage: 'ready',
      progressPercent: 100,
      result: { versionId: version.id, format: parsed.format, fileCount: archive.fileEntries.length }
    });

    log.info('activity-package-done', {
      mediaJobId,
      versionId: version.id,
      format: parsed.format,
      fileCount: archive.fileEntries.length
    });
    return { versionId: version.id, format: parsed.format, fileCount: archive.fileEntries.length, extractedBytes };
  } catch (error) {
    if (error instanceof PackageError) {
      log.error('activity-package-rejected', { mediaJobId, code: error.code });
      await failVersion(mediaJobId, version.id, error.code, error.message);
      throw new UnrecoverableError(`${error.code}: ${error.message}`);
    }

    log.error('activity-package-failed', { mediaJobId, error: errorMessage(error) });
    throw error;
  } finally {
    if (zipfile?.isOpen) {
      try {
        zipfile.close();
      } catch {
        // Best effort; the fd closes with the process otherwise.
      }
    }
    await safeUnlink(zipPath);
    if (extractDir) await rm(extractDir, { recursive: true, force: true });
  }
}
