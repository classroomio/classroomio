import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((callback: (tx: unknown) => unknown) => callback({})) }
}));

vi.mock('@cio/db/queries/assets', () => ({
  createAsset: vi.fn(),
  getAssetById: vi.fn(),
  updateAsset: vi.fn()
}));

vi.mock('@cio/db/queries/activity/package-version', () => ({
  createPackageVersion: vi.fn(),
  getCurrentPackageVersion: vi.fn(),
  getNextPackageVersionNumber: vi.fn(),
  getPackageVersionById: vi.fn(),
  listPackageVersionsByAsset: vi.fn(),
  setCurrentPackageVersion: vi.fn(),
  updatePackageVersion: vi.fn()
}));

vi.mock('@cio/db/queries/activity/package-unit', () => ({
  listPackageUnitsByVersion: vi.fn(),
  getPackageVersionUnitSummaries: vi.fn()
}));

vi.mock('@cio/db/queries/activity', () => ({
  getActivityById: vi.fn()
}));

vi.mock('@cio/db/queries/scorm/attempt', () => ({
  closeSupersededAttempts: vi.fn()
}));

vi.mock('@cio/db/queries/scorm/activity-scorm', () => ({
  listActivityScormByAssetId: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  hasActiveMediaJobForAsset: vi.fn()
}));

vi.mock('@cio/core/config/storage', () => ({
  getStorageConfig: vi.fn(() => ({ bucketScorm: 'scorm' }))
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateScormUploadPresignedUrl: vi.fn(),
  headS3ObjectSize: vi.fn()
}));

vi.mock('@cio/core/services/jobs/activity-package-jobs', () => ({
  startActivityPackageJob: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  isRedisConfigured: vi.fn(() => true)
}));

import { createAsset, getAssetById, updateAsset } from '@cio/db/queries/assets';
import {
  createPackageVersion,
  getCurrentPackageVersion,
  getNextPackageVersionNumber,
  getPackageVersionById,
  listPackageVersionsByAsset,
  setCurrentPackageVersion,
  updatePackageVersion
} from '@cio/db/queries/activity/package-version';
import { getPackageVersionUnitSummaries, listPackageUnitsByVersion } from '@cio/db/queries/activity/package-unit';
import { getActivityById } from '@cio/db/queries/activity';
import { closeSupersededAttempts } from '@cio/db/queries/scorm/attempt';
import { listActivityScormByAssetId } from '@cio/db/queries/scorm/activity-scorm';
import { hasActiveMediaJobForAsset } from '@cio/db/queries';
import { generateScormUploadPresignedUrl, headS3ObjectSize } from '@cio/core/utils/s3';
import { startActivityPackageJob } from '@cio/core/services/jobs/activity-package-jobs';
import { AppError } from '@api/utils/errors';
import type { TAsset, TNewContentPackageVersion, TContentPackageVersion } from '@cio/db/types';
import {
  createScormPackage,
  createScormPackageVersion,
  getScormPackage,
  makeScormPackageVersionCurrent,
  processScormPackageVersion,
  scormContentPrefix,
  scormUploadKey
} from '@cio/core/services/activity/packages';

const ORG_ID = 'org-1';
const PROFILE_ID = 'profile-1';

const assetFixture = {
  id: 'asset-1',
  organizationId: ORG_ID,
  kind: 'scorm',
  status: 'processing',
  storageKey: 'scorm/asset-1'
};

const versionFixture = {
  id: 'version-1',
  assetId: 'asset-1',
  versionNumber: 1,
  status: 'uploading',
  uploadKey: 'scorm/asset-1/v1.zip',
  contentPrefix: 'scorm/asset-1/v1'
};

describe('activity package services (PR 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAsset).mockResolvedValue({ ...assetFixture, storageKey: null } as never);
    vi.mocked(updateAsset).mockImplementation(
      async (assetId: string, _org: string, data: Partial<TAsset>) => ({ ...assetFixture, ...data }) as never
    );
    vi.mocked(getAssetById).mockResolvedValue({ ...assetFixture } as never);
    vi.mocked(createPackageVersion).mockImplementation(
      async (values: TNewContentPackageVersion) => ({ ...versionFixture, ...values }) as never
    );
    vi.mocked(getNextPackageVersionNumber).mockResolvedValue(2);
    vi.mocked(getPackageVersionById).mockResolvedValue({ ...versionFixture } as never);
    vi.mocked(listPackageVersionsByAsset).mockResolvedValue([{ ...versionFixture }] as never);
    vi.mocked(getCurrentPackageVersion).mockResolvedValue({ ...versionFixture, status: 'ready' } as never);
    vi.mocked(listPackageUnitsByVersion).mockResolvedValue([]);
    vi.mocked(getPackageVersionUnitSummaries).mockResolvedValue([]);
    vi.mocked(setCurrentPackageVersion).mockImplementation(
      async (versionId: string) => ({ ...versionFixture, id: versionId, status: 'ready', isCurrent: true }) as never
    );
    vi.mocked(updatePackageVersion).mockImplementation(
      async (_id: string, patch: Partial<TContentPackageVersion>) => ({ ...versionFixture, ...patch }) as never
    );
    vi.mocked(closeSupersededAttempts).mockResolvedValue(0);
    vi.mocked(listActivityScormByAssetId).mockResolvedValue([]);
    vi.mocked(getActivityById).mockResolvedValue(null);
    vi.mocked(hasActiveMediaJobForAsset).mockResolvedValue(false);
    vi.mocked(generateScormUploadPresignedUrl).mockResolvedValue('https://upload.example/put');
    vi.mocked(headS3ObjectSize).mockResolvedValue(1024);
    vi.mocked(startActivityPackageJob).mockResolvedValue({ id: 'job-1', status: 'queued', stage: 'queued' } as never);
  });

  it('builds stable storage keys per version', () => {
    expect(scormUploadKey('asset-1', 1)).toBe('scorm/asset-1/v1.zip');
    expect(scormContentPrefix('asset-1', 2)).toBe('scorm/asset-1/v2');
  });

  it('creates an asset with version 1 and a presigned PUT', async () => {
    const result = await createScormPackage(ORG_ID, PROFILE_ID, { fileName: 'course.zip', fileSize: 1024 });

    expect(result.uploadKey).toBe('scorm/asset-1/v1.zip');
    expect(result.uploadUrl).toBe('https://upload.example/put');
    expect(vi.mocked(createPackageVersion)).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: 'asset-1', versionNumber: 1 }),
      expect.anything()
    );
    expect(vi.mocked(generateScormUploadPresignedUrl)).toHaveBeenCalledWith('scorm/asset-1/v1.zip');
  });

  it('creates the next version with a presigned PUT', async () => {
    const result = await createScormPackageVersion(ORG_ID, 'asset-1', PROFILE_ID);

    expect(result.version.versionNumber).toBe(2);
    expect(result.uploadKey).toBe('scorm/asset-1/v2.zip');
  });

  it('returns the current version unchanged when the declared digest matches', async () => {
    const digest = 'a'.repeat(64);
    vi.mocked(getCurrentPackageVersion).mockResolvedValue({
      ...versionFixture,
      status: 'ready',
      contentSha256: digest
    } as never);

    const result = await createScormPackageVersion(ORG_ID, 'asset-1', PROFILE_ID, { contentSha256: digest });

    expect(result).toMatchObject({ unchanged: true, version: { id: 'version-1' }, uploadUrl: null, uploadKey: null });
    expect(vi.mocked(createPackageVersion)).not.toHaveBeenCalled();
    expect(vi.mocked(generateScormUploadPresignedUrl)).not.toHaveBeenCalled();
  });

  it('creates a version when the declared digest differs or is absent', async () => {
    vi.mocked(getCurrentPackageVersion).mockResolvedValue({
      ...versionFixture,
      status: 'ready',
      contentSha256: 'a'.repeat(64)
    } as never);

    const declared = await createScormPackageVersion(ORG_ID, 'asset-1', PROFILE_ID, { contentSha256: 'b'.repeat(64) });
    const undeclared = await createScormPackageVersion(ORG_ID, 'asset-1', PROFILE_ID);

    expect(declared).toMatchObject({ unchanged: false, uploadKey: 'scorm/asset-1/v2.zip' });
    expect(undeclared).toMatchObject({ unchanged: false, uploadKey: 'scorm/asset-1/v2.zip' });
    expect(vi.mocked(createPackageVersion)).toHaveBeenCalledTimes(2);
  });

  it('refuses versions for missing or foreign assets', async () => {
    vi.mocked(getAssetById).mockResolvedValue(null);
    await expect(createScormPackageVersion(ORG_ID, 'missing', PROFILE_ID)).rejects.toBeInstanceOf(AppError);

    vi.mocked(getAssetById).mockResolvedValue({ ...assetFixture, kind: 'video' } as never);
    await expect(createScormPackageVersion(ORG_ID, 'asset-1', PROFILE_ID)).rejects.toBeInstanceOf(AppError);
  });

  it('starts processing after verifying the upload', async () => {
    const result = await processScormPackageVersion(ORG_ID, 'asset-1', 'version-1', PROFILE_ID);

    expect(vi.mocked(headS3ObjectSize)).toHaveBeenCalledWith('scorm', 'scorm/asset-1/v1.zip');
    expect(vi.mocked(startActivityPackageJob)).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID, assetId: 'asset-1', packageVersionId: 'version-1' })
    );
    expect(result.jobId).toBe('job-1');
  });

  it('marks the version failed when queueing the job throws', async () => {
    vi.mocked(startActivityPackageJob).mockRejectedValueOnce(new Error('redis down'));

    await expect(processScormPackageVersion(ORG_ID, 'asset-1', 'version-1', PROFILE_ID)).rejects.toThrow();
    expect(vi.mocked(updatePackageVersion)).toHaveBeenCalledWith(
      'version-1',
      expect.objectContaining({ status: 'failed', error: expect.objectContaining({ code: 'ENQUEUE_FAILED' }) })
    );
  });

  it('refuses to process a missing upload or a busy asset', async () => {
    vi.mocked(headS3ObjectSize).mockResolvedValue(null);
    await expect(processScormPackageVersion(ORG_ID, 'asset-1', 'version-1', PROFILE_ID)).rejects.toBeInstanceOf(
      AppError
    );

    vi.mocked(headS3ObjectSize).mockResolvedValue(1024);
    vi.mocked(hasActiveMediaJobForAsset).mockResolvedValue(true);
    await expect(processScormPackageVersion(ORG_ID, 'asset-1', 'version-1', PROFILE_ID)).rejects.toBeInstanceOf(
      AppError
    );
  });

  it('makes a ready version current and optionally closes old attempts', async () => {
    vi.mocked(getPackageVersionById).mockResolvedValue({ ...versionFixture, status: 'ready' } as never);
    vi.mocked(closeSupersededAttempts).mockResolvedValue(3);

    const kept = await makeScormPackageVersionCurrent(ORG_ID, 'asset-1', 'version-1', { closeOpenAttempts: false });
    expect(kept.closedAttempts).toBe(0);
    expect(vi.mocked(closeSupersededAttempts)).not.toHaveBeenCalled();

    const closed = await makeScormPackageVersionCurrent(ORG_ID, 'asset-1', 'version-1', { closeOpenAttempts: true });
    expect(closed.closedAttempts).toBe(3);
    expect(vi.mocked(closeSupersededAttempts)).toHaveBeenCalledWith(
      'asset-1',
      'version-1',
      'replaced',
      expect.anything()
    );
  });

  it('refuses to make a non-ready version current', async () => {
    vi.mocked(getPackageVersionById).mockResolvedValue({ ...versionFixture, status: 'processing' } as never);
    await expect(
      makeScormPackageVersionCurrent(ORG_ID, 'asset-1', 'version-1', { closeOpenAttempts: false })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('reads a package with versions, units and usages', async () => {
    vi.mocked(listActivityScormByAssetId).mockResolvedValue([
      { activityId: 'activity-1', assetId: 'asset-1' }
    ] as never);
    vi.mocked(getActivityById).mockResolvedValue({
      id: 'activity-1',
      courseId: 'course-1',
      title: 'Package item'
    } as never);
    vi.mocked(getPackageVersionUnitSummaries).mockResolvedValue([
      { versionId: 'version-1', unitCount: 2, firstPassMark: 80 }
    ]);

    const details = await getScormPackage(ORG_ID, 'asset-1');
    expect(details.versions).toHaveLength(1);
    expect(details.versionStats).toEqual([{ versionId: 'version-1', unitCount: 2, firstPassMark: 80 }]);
    expect(details.usedBy).toEqual([{ activityId: 'activity-1', courseId: 'course-1', title: 'Package item' }]);
  });
});
