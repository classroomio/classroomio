import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAssetsByIds: vi.fn(),
  queueVimeoBackfill: vi.fn(),
  generateVideoDownloadPresignedUrls: vi.fn(),
  generateDocumentDownloadPresignedUrls: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetsByIds: mocks.getAssetsByIds
}));

vi.mock('@cio/core/services/assets/assets', () => ({
  queueVimeoBackfill: mocks.queueVimeoBackfill
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateVideoDownloadPresignedUrls: mocks.generateVideoDownloadPresignedUrls,
  generateDocumentDownloadPresignedUrls: mocks.generateDocumentDownloadPresignedUrls
}));

import { enrichLessonWithPresignedUrls } from '@cio/core/utils/lesson-media';

function hlsFlag(video: { metadata?: unknown }): unknown {
  return (video.metadata as Record<string, unknown> | undefined)?.hls;
}

const ASSET_ID = '414807ff-909b-47a3-ad82-48233a501fc3';
const SOURCE_KEY = `${ASSET_ID}/source.mp4`;
const MANIFEST_KEY = `${ASSET_ID}/master.m3u8`;

function lessonWithUpload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lesson-1',
    videos: [{ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID }],
    documents: [],
    ...overrides
  } as never;
}

function asset(overrides: Record<string, unknown> = {}) {
  return {
    id: ASSET_ID,
    provider: 'upload',
    storageKey: SOURCE_KEY,
    hlsManifestKey: null,
    title: 'intro.mp4',
    description: null,
    thumbnailUrl: null,
    durationSeconds: 49,
    aspectRatio: '1920:1080',
    sourceUrl: null,
    metadata: {},
    ...overrides
  };
}

describe('enrichLessonWithPresignedUrls — uploaded video links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateVideoDownloadPresignedUrls.mockResolvedValue({
      [SOURCE_KEY]: 'https://r2.example.com/source.mp4?X-Amz-Signature=abc'
    });
    mocks.generateDocumentDownloadPresignedUrls.mockResolvedValue({});
  });

  it('serves the ladder once the asset has a manifest, not the source file', async () => {
    mocks.getAssetsByIds.mockResolvedValue([asset({ hlsManifestKey: MANIFEST_KEY, metadata: { format: 'hls' } })]);

    const lesson = await enrichLessonWithPresignedUrls(lessonWithUpload());
    const [video] = lesson.videos!;

    expect(video.link).toBe(`/hls/${MANIFEST_KEY}`);
    expect(hlsFlag(video)).toBe(true);
  });

  it('does not presign the source for a video that has a manifest', async () => {
    mocks.getAssetsByIds.mockResolvedValue([asset({ hlsManifestKey: MANIFEST_KEY, metadata: { format: 'hls' } })]);

    const lesson = await enrichLessonWithPresignedUrls(lessonWithUpload());

    expect(mocks.generateVideoDownloadPresignedUrls).not.toHaveBeenCalled();
    expect(lesson.videos![0]).not.toHaveProperty('key');
  });

  it('still presigns the source while the encode has not finished', async () => {
    mocks.getAssetsByIds.mockResolvedValue([asset()]);

    const lesson = await enrichLessonWithPresignedUrls(lessonWithUpload());
    const [video] = lesson.videos!;

    expect(video.link).toBe('https://r2.example.com/source.mp4?X-Amz-Signature=abc');
    expect(hlsFlag(video)).toBeUndefined();
  });

  it('never reports hls without a link that can serve it', async () => {
    mocks.getAssetsByIds.mockResolvedValue([asset({ metadata: { format: 'hls' } })]);

    const [video] = (await enrichLessonWithPresignedUrls(lessonWithUpload())).videos!;

    expect(hlsFlag(video)).toBeUndefined();
    expect(video.link).toBe('https://r2.example.com/source.mp4?X-Amz-Signature=abc');
  });

  it('leaves a browser-encoded video that already stores its manifest link alone', async () => {
    const storedLink = `/hls/${ASSET_ID}/master.m3u8`;
    mocks.getAssetsByIds.mockResolvedValue([
      asset({ hlsManifestKey: MANIFEST_KEY, storageKey: null, metadata: { format: 'hls' } })
    ]);

    const lesson = await enrichLessonWithPresignedUrls(
      lessonWithUpload({
        videos: [{ type: 'upload', link: storedLink, assetId: ASSET_ID }]
      })
    );

    expect(lesson.videos![0].link).toBe(storedLink);
  });

  it('leaves an external video untouched', async () => {
    mocks.getAssetsByIds.mockResolvedValue([
      asset({ provider: 'youtube', storageKey: null, sourceUrl: 'https://youtube.com/watch?v=abc' })
    ]);

    const lesson = await enrichLessonWithPresignedUrls(
      lessonWithUpload({
        videos: [{ type: 'youtube', link: 'https://youtube.com/watch?v=abc', assetId: ASSET_ID }]
      })
    );

    expect(lesson.videos![0].link).toBe('https://youtube.com/watch?v=abc');
  });
});
