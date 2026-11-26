import { S3Client } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';

const presignClient = new S3Client({
  region: 'auto',
  endpoint: 'https://storage.example.com',
  credentials: { accessKeyId: 'test-access-key', secretAccessKey: 'test-secret-key' },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED'
});

vi.mock('@cio/core/config/storage', () => ({
  getStorageConfig: () => ({ bucketMedia: 'media', presignUploadExpiresSeconds: 3600 }),
  getPresignS3Client: () => presignClient,
  getS3Client: () => presignClient
}));

import { generateMediaUploadPresignedUrl } from '@cio/core/utils/s3';

describe('generateMediaUploadPresignedUrl', () => {
  it('signs content-type and content-length so storage refuses any other type or size', async () => {
    const uploadUrl = new URL(await generateMediaUploadPresignedUrl('org/banner.png', 'image/png', 1024));
    const signedHeaders = uploadUrl.searchParams.get('X-Amz-SignedHeaders')?.split(';') ?? [];

    expect(signedHeaders).toEqual(expect.arrayContaining(['content-type', 'content-length', 'host']));
  });

  it('targets the media bucket and the requested key', async () => {
    const uploadUrl = new URL(await generateMediaUploadPresignedUrl('org/banner.png', 'image/png', 1024));

    expect(uploadUrl.pathname).toBe('/media/org/banner.png');
    expect(uploadUrl.searchParams.get('X-Amz-Expires')).toBe('3600');
  });
});
