import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createHlsAssetPlaceholder: vi.fn(),
  generateVideoUploadPresignedUrl: vi.fn(),
  getStorageConfig: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  createHlsAssetPlaceholder: mocks.createHlsAssetPlaceholder
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateVideoUploadPresignedUrl: mocks.generateVideoUploadPresignedUrl
}));

vi.mock('@cio/core/config/storage', () => ({
  getStorageConfig: mocks.getStorageConfig
}));

vi.mock('@api/constants/upload', () => ({
  MAX_FILE_SIZE: 800 * 1024 * 1024
}));

import { createPublicApiAssetUploadService } from '@api/services/v1/media/assets';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const ASSET_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const payload = {
  kind: 'video' as const,
  fileName: 'lecture-1.mp4',
  mimeType: 'video/mp4' as const,
  byteSize: 50 * 1024 * 1024
};

describe('createPublicApiAssetUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createHlsAssetPlaceholder.mockResolvedValue({ id: ASSET_ID });
    mocks.generateVideoUploadPresignedUrl.mockResolvedValue('https://storage.example.com/signed?sig=x');
    mocks.getStorageConfig.mockReturnValue({ presignUploadExpiresSeconds: 3600 });
  });

  it('reserves the asset against the caller organization and actor', async () => {
    await createPublicApiAssetUploadService(ORG_ID, ACTOR_ID, payload);

    expect(mocks.createHlsAssetPlaceholder).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      createdByProfileId: ACTOR_ID,
      title: 'lecture-1.mp4',
      byteSize: payload.byteSize,
      mimeType: 'video/mp4'
    });
  });

  it('derives the storage key from the asset id rather than issuing a separate one', async () => {
    const result = await createPublicApiAssetUploadService(ORG_ID, ACTOR_ID, payload);

    expect(mocks.generateVideoUploadPresignedUrl).toHaveBeenCalledWith(`${ASSET_ID}/source.mp4`, 'video/mp4');
    expect(result.assetId).toBe(ASSET_ID);
    expect(result).not.toHaveProperty('fileKey');
  });

  it.each([
    ['video/quicktime', 'mov'],
    ['video/x-msvideo', 'avi'],
    ['video/x-matroska', 'mkv']
  ])('maps %s to a .%s key', async (mimeType, extension) => {
    await createPublicApiAssetUploadService(ORG_ID, ACTOR_ID, {
      ...payload,
      mimeType: mimeType as typeof payload.mimeType
    });

    expect(mocks.generateVideoUploadPresignedUrl).toHaveBeenCalledWith(`${ASSET_ID}/source.${extension}`, mimeType);
  });

  it('reports when the upload URL stops working', async () => {
    const result = await createPublicApiAssetUploadService(ORG_ID, ACTOR_ID, payload);

    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(result.expiresAt).getTime()).toBeLessThanOrEqual(Date.now() + 3600 * 1000);
  });

  it('refuses a request with no automation actor', async () => {
    await expect(createPublicApiAssetUploadService(ORG_ID, null, payload)).rejects.toMatchObject({ statusCode: 401 });
    expect(mocks.createHlsAssetPlaceholder).not.toHaveBeenCalled();
  });

  it('refuses a declared size over the upload limit before reserving anything', async () => {
    await expect(
      createPublicApiAssetUploadService(ORG_ID, ACTOR_ID, { ...payload, byteSize: 900 * 1024 * 1024 })
    ).rejects.toMatchObject({ statusCode: 413 });

    expect(mocks.createHlsAssetPlaceholder).not.toHaveBeenCalled();
    expect(mocks.generateVideoUploadPresignedUrl).not.toHaveBeenCalled();
  });
});
