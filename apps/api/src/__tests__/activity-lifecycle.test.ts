import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/assets', () => ({
  AssetUsageAlreadyExistsError: class AssetUsageAlreadyExistsError extends Error {},
  assetUsageExistsForTarget: vi.fn(),
  assetLocationsReferencedElsewhere: vi.fn(),
  createAssetAndUsage: vi.fn(),
  createAssetUsage: vi.fn(),
  deleteAsset: vi.fn(),
  deleteAssetUsage: vi.fn(),
  getAssetById: vi.fn(),
  listAssetUsagesByAsset: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  getActivityNavInfoByIds: vi.fn(),
  getLessonNavInfoByIds: vi.fn(),
  getMediaTranscriptByAsset: vi.fn(),
  updateMediaTranscriptContent: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  assetReferencedByGlobalTemplate: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  isRedisConfigured: vi.fn(() => false),
  enqueueAssetStorageCleanup: vi.fn()
}));

vi.mock('@cio/core/config/storage', () => ({
  getS3Client: vi.fn(),
  getStorageConfig: vi.fn(() => ({
    endpoint: 'https://storage.example.com',
    region: 'us-east-1',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
    forcePathStyle: true,
    bucketVideos: 'videos',
    bucketDocuments: 'documents',
    bucketMedia: 'media',
    mediaPublicBaseUrl: null,
    presignUploadExpiresSeconds: 3600,
    presignDownloadExpiresSeconds: 3600
  }))
}));

import { ACTIVITY_PACKAGE_SLOT } from '@cio/utils/validation/assets';
import {
  attachAssetService,
  createAndAttachAssetService,
  deleteAssetService,
  getAssetUsageGraphService
} from '@cio/core/services/assets/assets';
import { resetActivityLearnerState } from '@cio/core/services/activity/providers';
import { assetReferencedByGlobalTemplate } from '@cio/db/queries/course';
import { getActivityNavInfoByIds, getLessonNavInfoByIds } from '@cio/db/queries';
import {
  assetLocationsReferencedElsewhere,
  assetUsageExistsForTarget,
  createAssetUsage,
  deleteAsset,
  getAssetById,
  listAssetUsagesByAsset
} from '@cio/db/queries/assets';

function usage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'usage-1',
    organizationId: 'org-1',
    assetId: 'asset-1',
    targetType: 'activity',
    targetId: 'activity-1',
    slotType: ACTIVITY_PACKAGE_SLOT,
    slotKey: null,
    position: null,
    createdByProfileId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides
  };
}

function asset() {
  return {
    id: 'asset-1',
    organizationId: 'org-1',
    kind: 'scorm',
    provider: 'upload',
    storageKey: null,
    title: 'Package'
  };
}

describe('activity asset usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assetReferencedByGlobalTemplate).mockResolvedValue(false);
    vi.mocked(getAssetById).mockResolvedValue(asset() as never);
    vi.mocked(getLessonNavInfoByIds).mockResolvedValue([]);
    vi.mocked(getActivityNavInfoByIds).mockResolvedValue([]);
    vi.mocked(assetLocationsReferencedElsewhere).mockResolvedValue({ keys: new Set(), prefixes: new Set() });
  });

  it('enriches a live activity usage and drops an orphaned one', async () => {
    vi.mocked(listAssetUsagesByAsset).mockResolvedValue([
      usage(),
      usage({ id: 'usage-2', targetId: 'activity-gone' })
    ] as never);
    vi.mocked(getActivityNavInfoByIds).mockResolvedValue([
      { id: 'activity-1', courseId: 'course-1', activityTitle: 'Package item', courseTitle: 'Course' }
    ]);

    const graph = await getAssetUsageGraphService('org-1', 'asset-1');

    expect(getActivityNavInfoByIds).toHaveBeenCalledWith(['activity-1', 'activity-gone']);
    expect(graph.usageCount).toBe(1);
    expect(graph.usages[0]).toMatchObject({
      targetId: 'activity-1',
      courseId: 'course-1',
      targetTitle: 'Package item',
      courseTitle: 'Course'
    });
  });

  it('refuses to delete an asset attached to a live activity', async () => {
    vi.mocked(listAssetUsagesByAsset).mockResolvedValue([usage()] as never);
    vi.mocked(getActivityNavInfoByIds).mockResolvedValue([
      { id: 'activity-1', courseId: 'course-1', activityTitle: 'Package item', courseTitle: 'Course' }
    ]);

    await expect(deleteAssetService('org-1', 'asset-1')).rejects.toMatchObject({ statusCode: 409 });
    expect(deleteAsset).not.toHaveBeenCalled();
  });

  it('deletes an asset whose activity usage is orphaned', async () => {
    vi.mocked(listAssetUsagesByAsset).mockResolvedValue([usage()] as never);
    vi.mocked(getActivityNavInfoByIds).mockResolvedValue([]);
    vi.mocked(deleteAsset).mockResolvedValue(asset() as never);

    const deleted = await deleteAssetService('org-1', 'asset-1');

    expect(deleted).toMatchObject({ id: 'asset-1' });
  });

  it('routes package attaches through the activity service', async () => {
    const attach = {
      targetType: 'activity',
      targetId: 'activity-1',
      slotType: ACTIVITY_PACKAGE_SLOT
    } as const;

    await expect(attachAssetService('org-1', 'asset-1', 'profile-1', attach)).rejects.toMatchObject({
      statusCode: 400
    });
    await expect(
      createAndAttachAssetService('org-1', 'profile-1', {
        asset: {
          kind: 'image',
          provider: 'upload',
          storageProvider: 's3',
          storageKey: 'scorm/asset-1/original.zip',
          byteSize: 1024,
          isExternal: false
        },
        attach
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(assetUsageExistsForTarget).not.toHaveBeenCalled();
    expect(createAssetUsage).not.toHaveBeenCalled();
  });

  it('still attaches lesson usages through the generic path', async () => {
    vi.mocked(assetUsageExistsForTarget).mockResolvedValue(false);
    vi.mocked(createAssetUsage).mockResolvedValue(usage({ targetType: 'lesson' }) as never);

    await attachAssetService('org-1', 'asset-1', 'profile-1', {
      targetType: 'lesson',
      targetId: 'lesson-1',
      slotType: 'lesson_video'
    });

    expect(createAssetUsage).toHaveBeenCalled();
  });

  it('fans reset out to every provider', async () => {
    await expect(resetActivityLearnerState(['activity-1'], 'profile-1', {} as never)).resolves.toBe(0);
  });
});
