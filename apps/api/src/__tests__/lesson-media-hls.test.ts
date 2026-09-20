import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enrichLessonWithPresignedUrls } from '@cio/core/utils/lesson-media';

const mocks = vi.hoisted(() => ({
  getAssetsByIds: vi.fn(),
  generateVideoDownloadPresignedUrls: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetsByIds: (ids: string[]) => mocks.getAssetsByIds(ids)
}));

vi.mock('@cio/core/services/assets/assets', () => ({
  queueVimeoBackfill: () => undefined
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateVideoDownloadPresignedUrls: (keys: string[]) => mocks.generateVideoDownloadPresignedUrls(keys),
  generateDocumentDownloadPresignedUrls: async () => ({})
}));

const ASSET_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

function meta(video: { metadata?: unknown } | undefined) {
  return (video?.metadata ?? {}) as Record<string, unknown>;
}

function lessonWithVideo(video: Record<string, unknown>) {
  return { videos: [{ type: 'upload', assetId: ASSET_ID, ...video }], documents: [] } as never;
}

function asset(overrides: Record<string, unknown>) {
  return {
    id: ASSET_ID,
    provider: 'upload',
    title: 'Welcome',
    description: null,
    thumbnailUrl: null,
    durationSeconds: 60,
    aspectRatio: '16:9',
    storageKey: null,
    hlsManifestKey: null,
    sourceUrl: null,
    metadata: {},
    ...overrides
  };
}

describe('enrichLessonWithPresignedUrls HLS handling', () => {
  beforeEach(() => {
    mocks.getAssetsByIds.mockReset();
    mocks.generateVideoDownloadPresignedUrls.mockReset();
    mocks.generateVideoDownloadPresignedUrls.mockImplementation(async (keys: string[]) =>
      Object.fromEntries(keys.map((key) => [key, `https://signed.example/${key}`]))
    );
  });

  it('serves a raw upload as a presigned MP4 link', async () => {
    mocks.getAssetsByIds.mockResolvedValue([asset({ storageKey: 'raw.mp4' })]);

    const result = await enrichLessonWithPresignedUrls(lessonWithVideo({ link: 'stale', key: 'raw.mp4' }));
    const video = result.videos?.[0];

    expect(video?.link).toBe('https://signed.example/raw.mp4');
    expect(video?.key).toBe('raw.mp4');
    expect(meta(video).hls).toBeUndefined();
  });

  it('prefers HLS over the raw MP4 when a raw upload was converted on the server', async () => {
    mocks.getAssetsByIds.mockResolvedValue([
      asset({
        storageKey: 'raw.mp4',
        hlsManifestKey: `${ASSET_ID}/master.m3u8`,
        metadata: { format: 'hls', hlsRenditions: ['p720'], sourceWidth: 1280, sourceHeight: 720 }
      })
    ]);

    const result = await enrichLessonWithPresignedUrls(lessonWithVideo({ link: 'stale', key: 'raw.mp4' }));
    const video = result.videos?.[0];

    expect(video?.link).toBe(`/hls/${ASSET_ID}/master.m3u8`);
    expect(video?.key).toBeUndefined();
    expect(meta(video).hls).toBe(true);
    expect(meta(video).hlsRenditions).toEqual(['p720']);
    expect(mocks.generateVideoDownloadPresignedUrls).not.toHaveBeenCalled();
  });

  it('sets hls even if the asset metadata is missing format', async () => {
    mocks.getAssetsByIds.mockResolvedValue([
      asset({ storageKey: 'raw.mp4', hlsManifestKey: `${ASSET_ID}/master.m3u8` })
    ]);

    const result = await enrichLessonWithPresignedUrls(lessonWithVideo({ link: 'stale', key: 'raw.mp4' }));

    expect(meta(result.videos?.[0]).hls).toBe(true);
  });

  it('still serves a browser-encoded HLS asset (no storageKey) as HLS', async () => {
    mocks.getAssetsByIds.mockResolvedValue([
      asset({ hlsManifestKey: `${ASSET_ID}/master.m3u8`, metadata: { format: 'hls' } })
    ]);

    const result = await enrichLessonWithPresignedUrls(lessonWithVideo({ link: `/hls/${ASSET_ID}/master.m3u8` }));

    expect(result.videos?.[0]?.link).toBe(`/hls/${ASSET_ID}/master.m3u8`);
    expect(meta(result.videos?.[0]).hls).toBe(true);
  });

  it('leaves non-upload providers alone', async () => {
    mocks.getAssetsByIds.mockResolvedValue([
      asset({ provider: 'youtube', sourceUrl: 'https://youtu.be/abc', hlsManifestKey: `${ASSET_ID}/master.m3u8` })
    ]);

    const result = await enrichLessonWithPresignedUrls(lessonWithVideo({ type: 'youtube', link: 'stale' }));

    expect(result.videos?.[0]?.link).toBe('https://youtu.be/abc');
    expect(meta(result.videos?.[0]).hls).toBeUndefined();
  });
});
