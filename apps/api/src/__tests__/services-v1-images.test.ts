import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateMediaUploadPresignedUrl: vi.fn(),
  getStorageConfig: vi.fn(),
  getUploadLimits: vi.fn()
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateMediaUploadPresignedUrl: mocks.generateMediaUploadPresignedUrl,
  uploadToS3: vi.fn()
}));

vi.mock('@cio/core/config/storage', () => ({
  getStorageConfig: mocks.getStorageConfig
}));

vi.mock('@api/constants/upload', () => ({
  getUploadLimits: mocks.getUploadLimits,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024
}));

import { resolveUploadLimits } from '@cio/utils/config/upload-limits';
import { createPublicApiImageUploadService } from '@api/services/v1/media/images';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const MB = 1024 * 1024;

const payload = {
  purpose: 'content' as const,
  fileName: 'diagram.png',
  mimeType: 'image/png' as const,
  byteSize: 200 * 1024
};

describe('createPublicApiImageUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateMediaUploadPresignedUrl.mockResolvedValue('https://storage.example.com/signed?sig=x');
    mocks.getStorageConfig.mockReturnValue({
      presignUploadExpiresSeconds: 3600,
      mediaPublicBaseUrl: 'https://media.example.com/'
    });
    mocks.getUploadLimits.mockReturnValue(resolveUploadLimits({}));
  });

  it('returns the public URL under the organization prefix and signs the declared type and size', async () => {
    const result = await createPublicApiImageUploadService(ORG_ID, ACTOR_ID, payload);
    const [fileKey, mimeType, byteSize] = mocks.generateMediaUploadPresignedUrl.mock.calls[0];

    expect(fileKey).toMatch(new RegExp(`^${ORG_ID}/[^/]+-diagram\\.png$`));
    expect(mimeType).toBe('image/png');
    expect(byteSize).toBe(payload.byteSize);
    expect(result.url).toBe(`https://media.example.com/${fileKey}`);
    expect(result.uploadUrl).toBe('https://storage.example.com/signed?sig=x');
    expect(new Date(result.expiresAt).getTime()).toBeLessThanOrEqual(Date.now() + 3600 * 1000);
  });

  it.each([
    ['content', 5 * MB],
    ['cover', 0.5 * MB],
    ['avatar', 2 * MB]
  ] as const)('accepts a %s image at exactly the dashboard limit and refuses one byte more', async (purpose, limit) => {
    await expect(
      createPublicApiImageUploadService(ORG_ID, ACTOR_ID, { ...payload, purpose, byteSize: limit })
    ).resolves.toHaveProperty('url');

    await expect(
      createPublicApiImageUploadService(ORG_ID, ACTOR_ID, { ...payload, purpose, byteSize: limit + 1 })
    ).rejects.toMatchObject({ statusCode: 413, field: 'byteSize' });
  });

  it('follows the configured landing image limit for covers', async () => {
    mocks.getUploadLimits.mockReturnValue(resolveUploadLimits({ UPLOAD_MAX_LANDING_IMAGE_MB: '1' }));

    await expect(
      createPublicApiImageUploadService(ORG_ID, ACTOR_ID, { ...payload, purpose: 'cover', byteSize: MB })
    ).resolves.toHaveProperty('url');
  });

  it('never allows more than the server-wide image limit, as the dashboard upload route does', async () => {
    mocks.getUploadLimits.mockReturnValue(
      resolveUploadLimits({ UPLOAD_MAX_IMAGE_MB: '1', UPLOAD_MAX_LANDING_IMAGE_MB: '3' })
    );

    await expect(
      createPublicApiImageUploadService(ORG_ID, ACTOR_ID, { ...payload, purpose: 'cover', byteSize: 2 * MB })
    ).rejects.toMatchObject({ statusCode: 413 });
  });

  it.each(['diagram.svg', 'diagram.html', 'diagram', 'diagram.svg.png'])(
    'refuses the file name %s, as the dashboard does',
    async (fileName) => {
      await expect(createPublicApiImageUploadService(ORG_ID, ACTOR_ID, { ...payload, fileName })).rejects.toMatchObject(
        { statusCode: 400, field: 'fileName' }
      );
      expect(mocks.generateMediaUploadPresignedUrl).not.toHaveBeenCalled();
    }
  );

  it('refuses a request with no automation actor', async () => {
    await expect(createPublicApiImageUploadService(ORG_ID, null, payload)).rejects.toMatchObject({ statusCode: 401 });
    expect(mocks.generateMediaUploadPresignedUrl).not.toHaveBeenCalled();
  });

  it('fails before signing when no media public URL is configured', async () => {
    mocks.getStorageConfig.mockReturnValue({ presignUploadExpiresSeconds: 3600, mediaPublicBaseUrl: '' });

    await expect(createPublicApiImageUploadService(ORG_ID, ACTOR_ID, payload)).rejects.toMatchObject({
      statusCode: 500
    });
    expect(mocks.generateMediaUploadPresignedUrl).not.toHaveBeenCalled();
  });
});
