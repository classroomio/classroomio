import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, open } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl, { type Entry } from 'yauzl';
import { UnrecoverableError } from 'bullmq';
import { db } from '@cio/db/drizzle';
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
  deletePackageVersionsByIds,
  getAssetById,
  getCurrentPackageVersion,
  getMediaJobById,
  getPackageVersionById,
  setCurrentPackageVersion,
  updateAsset,
  updateMediaJob,
  updatePackageVersion
} from '@cio/db/queries';
import { ZActivityPackagePayload, type TActivityPackagePayload } from '@cio/jobs/payloads/activity-package';
import type { TContentPackageVersion, TNewContentPackageUnit } from '@cio/db/types';

import { getS3Client } from '../../config/storage';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import {
  deleteObjectFromBucket,
  downloadObjectToTempFile,
  safeUnlink,
  scormBucket,
  uploadBufferToBucket,
  uploadStreamToBucket
} from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { log } from '../../utils/logger';
import { cleanupPackageVersionStorage } from './cleanup-storage';

const SCORM_CONTENT_CACHE_CONTROL = 'public, max-age=604800, immutable';
const MANIFEST_MAX_BYTES = 10 * 1024 * 1024;
const LMS_API_SCAN_MAX_FILES = 500;
const LMS_API_SCAN_MAX_BYTES = 5 * 1024 * 1024;
const LMS_API_PATTERN = /LMSInitialize|API_1484_11|pipwerks/i;
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

async function readZipHeader(zipPath: string): Promise<Uint8Array> {
  const handle = await open(zipPath, 'r');
  try {
    const buffer = Buffer.alloc(4);
    await handle.read(buffer, 0, 4, 0);

    return new Uint8Array(buffer.buffer, buffer.byteOffset, 4);
  } finally {
    await handle.close();
  }
}

export function mapUnitsToRows(units: ScormPackageUnit[], packageVersionId: string): TNewContentPackageUnit[] {
  const used = new Set<string>();

  return units.map((unit, index) => {
    const fallback = unit.identifier || `item-${index + 1}`;
    let identifier = fallback;

    if (used.has(identifier)) {
      let counter = 2;
      while (used.has(`${fallback}-dup${counter}`)) counter += 1;
      identifier = `${fallback}-dup${counter}`;
    }
    used.add(identifier);

    return {
      packageVersionId,
      identifier,
      parentIdentifier: unit.parentIdentifier,
      title: unit.title,
      position: unit.position,
      unitType: unit.unitType,
      href: unit.href,
      parameters: unit.parameters,
      masteryScoreRaw: unit.masteryScoreRaw === null ? null : String(unit.masteryScoreRaw),
      passingScoreScaled: unit.passingScoreScaled === null ? null : String(unit.passingScoreScaled),
      completionThreshold: unit.completionThreshold === null ? null : String(unit.completionThreshold),
      launchData: unit.launchData,
      formatDetails: { ...unit.formatDetails },
      isVisible: unit.isVisible
    };
  });
}

export function resolveScormLimitMb(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.UPLOAD_MAX_SCORM_MB);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

function isMissingObjectError(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  const code = (error as { Code?: string })?.Code;

  if (name === 'NotFound' || name === 'NoSuchKey' || name === 'NoSuchBucket') return true;
  if (code === 'NotFound' || code === 'NoSuchKey' || code === 'NoSuchBucket') return true;

  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;

  return status === 404;
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

/**
 * Reads one ZIP entry aborted past `maxBytes`, so a crafted manifest entry
 * cannot balloon worker memory before the size check runs.
 */
async function readEntryBufferCapped(zipfile: yauzl.ZipFile, entry: Entry, maxBytes: number): Promise<Buffer> {
  const stream = await zipfile.openReadStreamPromise(entry);
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of stream) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    total += buffer.length;

    if (total > maxBytes) {
      stream.destroy();
      throw new PackageError('file_too_large', { bytes: total });
    }

    chunks.push(buffer);
  }

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
  const maxEntries = SCORM_ZIP_LIMITS.maxEntries;
  let entryCount = 0;

  try {
    for await (const entry of zipfile.eachEntry()) {
      entryCount += 1;
      if (entryCount > maxEntries) {
        throw new PackageError('too_many_entries', { count: entryCount, max: maxEntries });
      }

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
    try {
      await zipfile.close();
    } catch {}

    if (error instanceof PackageError) throw error;
    throw new PackageError('unsafe_path', { reason: errorMessage(error) });
  }

  return { entries, names, fileEntries, zipfile };
}

async function failVersion(mediaJobId: string, versionId: string, code: string, message: string): Promise<void> {
  const processedAt = new Date().toISOString();
  await updatePackageVersion(versionId, {
    status: 'failed',
    error: { code, message },
    processedAt
  });
  await updateMediaJob(mediaJobId, {
    status: 'failed',
    stage: 'failed',
    error: { code, message }
  });
}

interface ProcessScormResult {
  unchanged: boolean;
  versionId: string;
  format: string;
  fileCount: number;
  extractedBytes: number;
}

async function hasLmsApiCalls(extractDir: string, entries: Entry[], launchPaths: string[]): Promise<boolean> {
  const launchSet = new Set(launchPaths.map((href) => href.split(/[?#]/)[0]));
  const rank = (entry: Entry) => (launchSet.has(normalizeZipPath(entry.fileName)) ? 0 : 1);
  const candidates = entries
    .filter((entry) => /\.(html?|js)$/i.test(entry.fileName) && entry.uncompressedSize <= LMS_API_SCAN_MAX_BYTES)
    .sort((left, right) => rank(left) - rank(right))
    .slice(0, LMS_API_SCAN_MAX_FILES);

  for (const entry of candidates) {
    const name = normalizeZipPath(entry.fileName);
    if (!name) continue;

    try {
      const text = await readFile(join(extractDir, name), 'utf-8');
      if (LMS_API_PATTERN.test(text)) return true;
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Returns the hex SHA-256 of a file on disk.
 */
async function sha256OfFile(path: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);

  return hash.digest('hex');
}

/**
 * Discards an upload whose bytes match the current version: the version row
 * goes, so its number is reused, and the job completes as unchanged pointing
 * at the current version. The ZIP is removed last because an orphaned object
 * is harmless while a half-finished job is not.
 */
async function discardDuplicateVersion(
  mediaJobId: string,
  bucket: string,
  version: TContentPackageVersion,
  currentVersion: TContentPackageVersion
): Promise<ProcessScormResult> {
  await db.transaction(async (tx) => {
    await deletePackageVersionsByIds([version.id], tx);
    await updateMediaJob(
      mediaJobId,
      {
        status: 'completed',
        stage: 'unchanged',
        progressPercent: 100,
        result: { unchanged: true, versionId: currentVersion.id }
      },
      tx
    );
  });

  try {
    await deleteObjectFromBucket(bucket, version.uploadKey);
  } catch (error) {
    log.warn('activity-package-duplicate-zip-left', { mediaJobId, key: version.uploadKey, error: errorMessage(error) });
  }

  log.info('activity-package-unchanged', { mediaJobId, currentVersionId: currentVersion.id });

  return {
    unchanged: true,
    versionId: currentVersion.id,
    format: currentVersion.format ?? '',
    fileCount: currentVersion.fileCount ?? 0,
    extractedBytes: currentVersion.extractedBytes ?? 0
  };
}

/**
 * Validates, extracts, uploads and records one SCORM package version.
 * Deterministic package rejections throw UnrecoverableError; transient
 * storage failures throw so BullMQ retries. Idempotent across retries.
 */
export async function processScormPackage(rawData: unknown): Promise<ProcessScormResult> {
  const payload: TActivityPackagePayload = ZActivityPackagePayload.parse(rawData);
  const { mediaJobId, assetId, packageVersionId } = payload;

  const existingJob = await getMediaJobById(mediaJobId);
  if (existingJob?.status === 'completed' && existingJob.result) {
    return existingJob.result as unknown as ProcessScormResult;
  }

  const version = await getPackageVersionById(packageVersionId);
  if (!version || version.assetId !== assetId)
    throw new UnrecoverableError(`Package version ${packageVersionId} not found`);

  const asset = await getAssetById(assetId);
  if (!asset) throw new UnrecoverableError(`Asset ${assetId} not found`);

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { status: 'running', stage: 'validating', progressPercent: 5 });

  const liveVersion = await getCurrentPackageVersion(assetId);
  if (liveVersion && liveVersion.id === version.id && version.status === 'ready') {
    await updateMediaJob(mediaJobId, {
      status: 'completed',
      stage: 'ready',
      progressPercent: 100,
      result: {
        unchanged: false,
        versionId: version.id,
        format: version.format ?? '',
        fileCount: version.fileCount ?? 0
      }
    });

    return {
      unchanged: false,
      versionId: version.id,
      format: version.format ?? '',
      fileCount: version.fileCount ?? 0,
      extractedBytes: version.extractedBytes ?? 0
    };
  }

  await updatePackageVersion(version.id, { status: 'processing', error: null, extractedBytes: 0 });
  await deletePackageUnitsByVersion(version.id);

  const bucket = scormBucket();
  const zipLimitBytes = zipByteLimit(resolveScormLimitMb());

  let zipPath: string | undefined;
  let extractDir: string | undefined;
  let zipfile: yauzl.ZipFile | undefined;
  try {
    let head;
    try {
      head = await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: version.uploadKey }));
    } catch (error) {
      if (!isMissingObjectError(error)) throw error;

      throw new PackageError('upload_missing', { key: version.uploadKey });
    }

    if (!head || typeof head.ContentLength !== 'number')
      throw new PackageError('upload_missing', { key: version.uploadKey });

    const zipBytes = head.ContentLength;
    if (zipBytes > zipLimitBytes) throw new PackageError('file_too_large', { bytes: zipBytes });

    zipPath = await downloadObjectToTempFile(bucket, version.uploadKey, `${assetId}.zip`);
    const header = await readZipHeader(zipPath);
    if (!hasZipMagicBytes(header)) throw new PackageError('not_a_zip');

    const contentSha256 = await sha256OfFile(zipPath);
    const currentVersion = await getCurrentPackageVersion(assetId);
    if (currentVersion && currentVersion.id !== version.id && currentVersion.contentSha256 === contentSha256) {
      return await discardDuplicateVersion(mediaJobId, bucket, version, currentVersion);
    }

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
    const manifestBuffer = await readEntryBufferCapped(zipfile, manifestEntry, MANIFEST_MAX_BYTES);
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

    const indexKey = `${version.contentPrefix}.index.json`;
    const indexBody = Buffer.from(JSON.stringify(archive.names));
    await uploadBufferToBucket(bucket, indexKey, indexBody, 'application/json; charset=utf-8');

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'reading manifest', progressPercent: 90 });

    const unitRows = mapUnitsToRows(parsed.units, version.id);
    const scanDir = extractDir ?? '';
    const launchPaths = parsed.units.map((unit) => unit.href);
    const connectsToLms = scanDir ? await hasLmsApiCalls(scanDir, archive.fileEntries, launchPaths) : true;
    const warnings = connectsToLms ? parsed.warnings : [...parsed.warnings, 'no_lms_api_detected'];

    await db.transaction(async (tx) => {
      await bulkInsertPackageUnits(unitRows, tx);
      const processedAt = new Date().toISOString();
      await updatePackageVersion(
        version.id,
        {
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
          warnings,
          error: null,
          zipBytes,
          contentSha256,
          extractedBytes,
          fileCount: archive.fileEntries.length,
          processingJobId: mediaJobId,
          processedAt
        },
        tx
      );

      const current = await getCurrentPackageVersion(assetId, tx);
      if (!current) {
        await setCurrentPackageVersion(version.id, tx);
        await updateAsset(assetId, asset.organizationId, { status: 'active', byteSize: zipBytes }, tx);
      }

      await updateMediaJob(
        mediaJobId,
        {
          status: 'completed',
          stage: 'ready',
          progressPercent: 100,
          result: {
            unchanged: false,
            versionId: version.id,
            format: parsed.format,
            fileCount: archive.fileEntries.length
          }
        },
        tx
      );
    });

    log.info('activity-package-done', {
      mediaJobId,
      versionId: version.id,
      format: parsed.format,
      fileCount: archive.fileEntries.length
    });
    return {
      unchanged: false,
      versionId: version.id,
      format: parsed.format,
      fileCount: archive.fileEntries.length,
      extractedBytes
    };
  } catch (error) {
    if (version?.contentPrefix) {
      await cleanupPackageVersionStorage(version);
    }

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
