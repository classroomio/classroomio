import { AppError, ErrorCodes } from '@cio/utils/errors';
import { db } from '@cio/db/drizzle';
import { getAssetById } from '@cio/db/queries/assets';
import { createAsset, updateAsset } from '@cio/db/queries/assets';
import {
  createPackageVersion,
  getCurrentPackageVersion,
  getNextPackageVersionNumber,
  getPackageVersionById,
  listPackageVersionsByAsset,
  setCurrentPackageVersion,
  updatePackageVersion
} from '@cio/db/queries/activity/package-version';
import { listPackageUnitsByVersion } from '@cio/db/queries/activity/package-unit';
import { getActivityById } from '@cio/db/queries/activity';
import { closeSupersededAttempts } from '@cio/db/queries/scorm/attempt';
import { listActivityScormByAssetId } from '@cio/db/queries/scorm/activity-scorm';
import { hasActiveMediaJobForAsset } from '@cio/db/queries';
import type { TPackageCreate, TPackageMakeCurrent } from '@cio/utils/validation/activity/package';
import type { TAsset, TContentPackageUnit, TContentPackageVersion, TCourseActivity } from '@cio/db/types';

import { getStorageConfig } from '../../config/storage';
import { generateScormUploadPresignedUrl, headS3ObjectSize } from '../../utils/s3';
import { deleteAssetService } from '../assets/assets';
import { startActivityPackageJob } from '../jobs/activity-package-jobs';

export function scormUploadKey(assetId: string, versionNumber: number): string {
  return `scorm/${assetId}/v${versionNumber}.zip`;
}

export function scormContentPrefix(assetId: string, versionNumber: number): string {
  return `scorm/${assetId}/v${versionNumber}`;
}

function defaultPackageTitle(fileName: string): string {
  const trimmed = fileName.trim();

  return trimmed.toLowerCase().endsWith('.zip') ? trimmed.slice(0, -4) : trimmed;
}

async function getOrgScormAsset(organizationId: string, assetId: string): Promise<TAsset> {
  const asset = await getAssetById(assetId, organizationId);
  if (!asset || asset.kind !== 'scorm') throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);

  return asset;
}

async function getAssetPackageVersion(assetId: string, versionId: string): Promise<TContentPackageVersion> {
  const version = await getPackageVersionById(versionId);
  if (!version || version.assetId !== assetId)
    throw new AppError('Package version not found', ErrorCodes.NOT_FOUND, 404);

  return version;
}

export interface ScormPackagePayload {
  asset: TAsset;
  version: TContentPackageVersion;
  uploadUrl: string;
  uploadKey: string;
}

/**
 * Creates a SCORM asset in processing status with its first uploading version.
 * Returns the asset, the version and a presigned PUT URL for the ZIP.
 */
export async function createScormPackage(
  organizationId: string,
  profileId: string,
  input: TPackageCreate
): Promise<ScormPackagePayload> {
  const created = await db.transaction(async (tx) => {
    const asset = await createAsset(
      {
        organizationId,
        kind: 'scorm',
        provider: 'upload',
        storageProvider: 's3',
        title: input.title ?? defaultPackageTitle(input.fileName),
        mimeType: 'application/zip',
        isExternal: false,
        status: 'processing',
        createdByProfileId: profileId
      },
      tx
    );

    const storageKey = `scorm/${asset.id}`;
    await updateAsset(asset.id, organizationId, { storageKey }, tx);

    const uploadKey = scormUploadKey(asset.id, 1);
    const contentPrefix = scormContentPrefix(asset.id, 1);
    const version = await createPackageVersion(
      {
        assetId: asset.id,
        versionNumber: 1,
        uploadKey,
        contentPrefix,
        createdByProfileId: profileId
      },
      tx
    );

    return { asset: { ...asset, storageKey }, version };
  });

  const uploadUrl = await generateScormUploadPresignedUrl(created.version.uploadKey);

  return { asset: created.asset, version: created.version, uploadUrl, uploadKey: created.version.uploadKey };
}

/**
 * Creates the next uploading version for a SCORM asset.
 * Returns the version and a presigned PUT URL for the ZIP.
 */
export async function createScormPackageVersion(
  organizationId: string,
  assetId: string,
  profileId: string
): Promise<Omit<ScormPackagePayload, 'asset'>> {
  const asset = await getOrgScormAsset(organizationId, assetId);

  const versionNumber = await getNextPackageVersionNumber(asset.id);
  const uploadKey = scormUploadKey(asset.id, versionNumber);
  const contentPrefix = scormContentPrefix(asset.id, versionNumber);
  const version = await createPackageVersion({
    assetId: asset.id,
    versionNumber,
    uploadKey,
    contentPrefix,
    createdByProfileId: profileId
  });

  const uploadUrl = await generateScormUploadPresignedUrl(uploadKey);

  return { version, uploadUrl, uploadKey };
}

export interface ScormProcessPayload {
  version: TContentPackageVersion;
  jobId: string;
  status: string;
  stage: string | null;
}

/**
 * Verifies the uploaded ZIP exists, marks the version processing and enqueues
 * the worker. Size enforcement happens in the worker against the real object.
 */
export async function processScormPackageVersion(
  organizationId: string,
  assetId: string,
  versionId: string,
  profileId: string | null
): Promise<ScormProcessPayload> {
  const asset = await getOrgScormAsset(organizationId, assetId);
  const version = await getAssetPackageVersion(asset.id, versionId);

  if (version.status !== 'uploading')
    throw new AppError('Package version is already being processed', ErrorCodes.CONFLICT, 409);

  const bucket = getStorageConfig().bucketScorm;
  const uploadedBytes = await headS3ObjectSize(bucket, version.uploadKey);
  if (uploadedBytes === null)
    throw new AppError('Package file has not been uploaded yet', ErrorCodes.VALIDATION_ERROR, 400);

  const hasActive = await hasActiveMediaJobForAsset(asset.id, organizationId);
  if (hasActive) throw new AppError('A package job is already running for this asset', ErrorCodes.CONFLICT, 409);

  await updatePackageVersion(version.id, { status: 'processing' });

  const job = await startActivityPackageJob({
    organizationId,
    assetId: asset.id,
    packageVersionId: version.id,
    triggeredByProfileId: profileId
  });

  const updated = await updatePackageVersion(version.id, { processingJobId: job.id });

  return { version: updated ?? version, jobId: job.id, status: job.status, stage: job.stage };
}

export interface ScormMakeCurrentPayload {
  version: TContentPackageVersion;
  closedAttempts: number;
}

/**
 * Makes a ready version current. Optionally closes open attempts pinned to
 * older versions with reason `replaced`.
 */
export async function makeScormPackageVersionCurrent(
  organizationId: string,
  assetId: string,
  versionId: string,
  input: TPackageMakeCurrent
): Promise<ScormMakeCurrentPayload> {
  const asset = await getOrgScormAsset(organizationId, assetId);
  const version = await getAssetPackageVersion(asset.id, versionId);

  if (version.status !== 'ready')
    throw new AppError('Only a ready package version can be made current', ErrorCodes.CONFLICT, 409);

  const result = await db.transaction(async (tx) => {
    const current = await setCurrentPackageVersion(version.id, tx);

    let closedAttempts = 0;
    if (input.closeOpenAttempts) {
      closedAttempts = await closeSupersededAttempts(asset.id, version.id, 'replaced', tx);
    }

    return { current, closedAttempts };
  });

  return { version: result.current, closedAttempts: result.closedAttempts };
}

export interface ScormPackageUsage {
  activityId: string;
  courseId: string;
  title: string;
}

export interface ScormPackageDetails {
  asset: TAsset;
  versions: TContentPackageVersion[];
  currentVersion: TContentPackageVersion | null;
  units: TContentPackageUnit[];
  usedBy: ScormPackageUsage[];
}

/**
 * Returns a package with its versions, the current version's units and the
 * activities using it. Throws when the asset is missing or not a package.
 */
export async function getScormPackage(organizationId: string, assetId: string): Promise<ScormPackageDetails> {
  const asset = await getOrgScormAsset(organizationId, assetId);

  const versions = await listPackageVersionsByAsset(asset.id);
  const currentVersion = await getCurrentPackageVersion(asset.id);

  const units = currentVersion ? await listPackageUnitsByVersion(currentVersion.id) : [];

  const usages = await listActivityScormByAssetId(asset.id);
  const usedBy = await resolvePackageUsages(usages.map((usage) => usage.activityId));

  return { asset, versions, currentVersion, units, usedBy };
}

async function resolvePackageUsages(activityIds: string[]): Promise<ScormPackageUsage[]> {
  const resolved: ScormPackageUsage[] = [];

  for (const activityId of activityIds) {
    const activity: TCourseActivity | null = await getActivityById(activityId);
    if (!activity) continue;

    resolved.push({ activityId: activity.id, courseId: activity.courseId, title: activity.title });
  }

  return resolved;
}

/**
 * Deletes a package asset and, through the asset service, its storage prefix.
 * Throws 409 while an activity uses the package.
 */
export async function deleteScormPackage(organizationId: string, assetId: string): Promise<TAsset> {
  const asset = await getOrgScormAsset(organizationId, assetId);

  const usedBy = await resolvePackageUsages(
    (await listActivityScormByAssetId(asset.id)).map((usage) => usage.activityId)
  );
  if (usedBy.length > 0)
    throw new AppError(
      `Package is used by ${usedBy.map((usage) => usage.title).join(', ')}`,
      ErrorCodes.ASSET_IN_USE,
      409
    );

  const deleted = await deleteAssetService(organizationId, asset.id);
  if (!deleted) throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);

  return deleted;
}
