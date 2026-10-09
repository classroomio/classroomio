import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAssetById: vi.fn(),
  markAssetUploadComplete: vi.fn(),
  setAssetHlsStatus: vi.fn(),
  headVideoObject: vi.fn(),
  deleteVideoObject: vi.fn(),
  startMediaJob: vi.fn(),
  enqueueHlsEncode: vi.fn(),
  isRedisConfigured: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetById: mocks.getAssetById,
  markAssetUploadComplete: mocks.markAssetUploadComplete,
  setAssetHlsStatus: mocks.setAssetHlsStatus
}));

vi.mock('@cio/core/utils/s3', () => ({
  headVideoObject: mocks.headVideoObject,
  deleteVideoObject: mocks.deleteVideoObject
}));

vi.mock('@cio/core/services/jobs/media-jobs', () => ({
  startMediaJob: mocks.startMediaJob
}));

vi.mock('@cio/jobs', () => ({
  enqueueHlsEncode: mocks.enqueueHlsEncode,
  isRedisConfigured: mocks.isRedisConfigured
}));

vi.mock('@api/constants/upload', () => ({
  MAX_FILE_SIZE: 800 * 1024 * 1024
}));

import { resolveLessonVideos } from '@api/services/v1/lessons/videos';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const ASSET_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const SOURCE_KEY = `${ASSET_ID}/source.mp4`;

const uploadVideo = [{ type: 'upload' as const, assetId: ASSET_ID }];

function headOnlyMp4(byteSize: number) {
  mocks.headVideoObject.mockImplementation(async (key: string) =>
    key === SOURCE_KEY ? { exists: true, byteSize } : { exists: false, byteSize: 0 }
  );
}

describe('resolveLessonVideos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAssetById.mockResolvedValue({ id: ASSET_ID, kind: 'video', provider: 'upload', storageKey: null });
    mocks.markAssetUploadComplete.mockResolvedValue({ id: ASSET_ID, storageKey: SOURCE_KEY });
    mocks.isRedisConfigured.mockReturnValue(true);
    mocks.setAssetHlsStatus.mockResolvedValue(undefined);
    mocks.deleteVideoObject.mockResolvedValue(undefined);
    mocks.startMediaJob.mockResolvedValue(undefined);
    mocks.enqueueHlsEncode.mockResolvedValue(undefined);
    headOnlyMp4(10 * 1024 * 1024);
  });

  it('passes an external video straight through without touching storage', async () => {
    const resolved = await resolveLessonVideos(ORG_ID, ACTOR_ID, [
      { type: 'youtube', link: 'https://youtube.com/watch?v=abc' }
    ]);

    expect(resolved).toEqual([{ type: 'youtube', link: 'https://youtube.com/watch?v=abc' }]);
    expect(mocks.headVideoObject).not.toHaveBeenCalled();
  });

  it('completes an upload and queues both the media pipeline and the encode', async () => {
    const resolved = await resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo);

    expect(resolved).toEqual([{ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID }]);
    expect(mocks.markAssetUploadComplete).toHaveBeenCalledWith(ASSET_ID, ORG_ID, SOURCE_KEY);
    expect(mocks.startMediaJob).toHaveBeenCalledOnce();
    expect(mocks.enqueueHlsEncode).toHaveBeenCalledOnce();
  });

  it('rejects an object whose real size exceeds the limit, and deletes it', async () => {
    headOnlyMp4(900 * 1024 * 1024);

    await expect(resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo)).rejects.toMatchObject({ statusCode: 413 });
    expect(mocks.deleteVideoObject).toHaveBeenCalledWith(SOURCE_KEY);
    expect(mocks.markAssetUploadComplete).not.toHaveBeenCalled();
    expect(mocks.enqueueHlsEncode).not.toHaveBeenCalled();
  });

  it('reuses the winner rather than failing when a concurrent attach completed first', async () => {
    mocks.markAssetUploadComplete.mockResolvedValue(null);
    mocks.getAssetById
      .mockResolvedValueOnce({ id: ASSET_ID, kind: 'video', provider: 'upload', storageKey: null })
      .mockResolvedValueOnce({ id: ASSET_ID, kind: 'video', provider: 'upload', storageKey: SOURCE_KEY });

    const resolved = await resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo);

    expect(resolved).toEqual([{ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID }]);
    expect(mocks.enqueueHlsEncode).not.toHaveBeenCalled();
  });

  it('conflicts when the completion is lost and no key turns up', async () => {
    mocks.markAssetUploadComplete.mockResolvedValue(null);

    await expect(resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('reuses an asset an earlier attach already completed', async () => {
    mocks.getAssetById.mockResolvedValue({
      id: ASSET_ID,
      kind: 'video',
      provider: 'upload',
      storageKey: SOURCE_KEY
    });

    const resolved = await resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo);

    expect(resolved).toEqual([{ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID }]);
    expect(mocks.headVideoObject).not.toHaveBeenCalled();
    expect(mocks.enqueueHlsEncode).not.toHaveBeenCalled();
  });

  it('tells the caller to upload the bytes when no object exists', async () => {
    mocks.headVideoObject.mockResolvedValue({ exists: false, byteSize: 0 });

    await expect(resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('ignores a zero-byte object rather than treating the upload as landed', async () => {
    headOnlyMp4(0);

    await expect(resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('refuses an asset from another organization', async () => {
    mocks.getAssetById.mockResolvedValue(null);

    await expect(resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('refuses an asset that is not an uploaded video', async () => {
    mocks.getAssetById.mockResolvedValue({ id: ASSET_ID, kind: 'image', provider: 'upload', storageKey: null });

    await expect(resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('marks the encode failed when queueing it throws, without failing the attach', async () => {
    mocks.enqueueHlsEncode.mockRejectedValue(new Error('redis down'));

    const resolved = await resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo);

    expect(resolved[0].key).toBe(SOURCE_KEY);
    expect(mocks.setAssetHlsStatus).toHaveBeenCalledWith(ASSET_ID, ORG_ID, 'failed');
  });

  it('skips queueing entirely when Redis is not configured', async () => {
    mocks.isRedisConfigured.mockReturnValue(false);

    const resolved = await resolveLessonVideos(ORG_ID, ACTOR_ID, uploadVideo);

    expect(resolved[0].key).toBe(SOURCE_KEY);
    expect(mocks.startMediaJob).not.toHaveBeenCalled();
    expect(mocks.enqueueHlsEncode).not.toHaveBeenCalled();
  });
});
