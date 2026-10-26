import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPublicCourseItem: vi.fn(),
  getAssetsByIds: vi.fn(),
  generateVideoDownloadPresignedUrls: vi.fn(),
  getMediaTranscriptByAsset: vi.fn()
}));

vi.mock('@cio/db/queries/course', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getPublicCourseItem: mocks.getPublicCourseItem
}));

vi.mock('@cio/db/queries/assets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAssetsByIds: mocks.getAssetsByIds
}));

vi.mock('@cio/core/utils/s3', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  generateVideoDownloadPresignedUrls: mocks.generateVideoDownloadPresignedUrls
}));

vi.mock('@cio/db/queries', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getMediaTranscriptByAsset: mocks.getMediaTranscriptByAsset
}));

import { getPublicCourseItemService } from '@api/services/course/public-course';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ASSET_ID = '414807ff-909b-47a3-ad82-48233a501fc3';
const SOURCE_KEY = `${ASSET_ID}/source.mp4`;
const ASSET_POSTER = 'https://cdn.example.com/thumbs/asset.jpg';
const STORED_POSTER = 'https://cdn.example.com/thumbs/stored.jpg';

function lessonItem(video: Record<string, unknown> | null) {
  return {
    kind: 'lesson' as const,
    id: 'lesson-1',
    title: 'Intro',
    sectionTitle: null,
    isUnlocked: true,
    body: '<p>hi</p>',
    video,
    courseOrganizationId: ORG_ID
  };
}

function asset(overrides: Record<string, unknown> = {}) {
  return { id: ASSET_ID, storageKey: SOURCE_KEY, hlsManifestKey: null, thumbnailUrl: null, ...overrides };
}

describe('public course lesson video poster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateVideoDownloadPresignedUrls.mockResolvedValue({ [SOURCE_KEY]: 'https://r2/source.mp4?sig=x' });
    mocks.getMediaTranscriptByAsset.mockResolvedValue(null);
    mocks.getAssetsByIds.mockResolvedValue([asset()]);
  });

  it('keeps the poster a dashboard upload stored on the lesson', async () => {
    mocks.getPublicCourseItem.mockResolvedValue(
      lessonItem({
        type: 'upload',
        link: '',
        key: SOURCE_KEY,
        assetId: ASSET_ID,
        metadata: { thumbnailUrl: STORED_POSTER }
      })
    );

    const item = await getPublicCourseItemService('course', 'lesson');

    expect(item?.video?.metadata?.thumbnailUrl).toBe(STORED_POSTER);
  });

  it('falls back to the asset poster when the lesson entry has none', async () => {
    mocks.getPublicCourseItem.mockResolvedValue(
      lessonItem({ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID })
    );
    mocks.getAssetsByIds.mockResolvedValue([asset({ thumbnailUrl: ASSET_POSTER })]);

    const item = await getPublicCourseItemService('course', 'lesson');

    expect(item?.video?.metadata?.thumbnailUrl).toBe(ASSET_POSTER);
  });

  it('prefers the stored poster over the asset, so a chosen thumbnail is not overwritten', async () => {
    mocks.getPublicCourseItem.mockResolvedValue(
      lessonItem({
        type: 'upload',
        link: '',
        key: SOURCE_KEY,
        assetId: ASSET_ID,
        metadata: { thumbnailUrl: STORED_POSTER }
      })
    );
    mocks.getAssetsByIds.mockResolvedValue([asset({ thumbnailUrl: ASSET_POSTER })]);

    const item = await getPublicCourseItemService('course', 'lesson');

    expect(item?.video?.metadata?.thumbnailUrl).toBe(STORED_POSTER);
  });

  it('still carries the poster when the video plays from its HLS ladder', async () => {
    mocks.getPublicCourseItem.mockResolvedValue(
      lessonItem({ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID })
    );
    mocks.getAssetsByIds.mockResolvedValue([
      asset({ storageKey: null, hlsManifestKey: `${ASSET_ID}/master.m3u8`, thumbnailUrl: ASSET_POSTER })
    ]);

    const item = await getPublicCourseItemService('course', 'lesson');

    expect(item?.video?.link).toBe(`/hls/${ASSET_ID}/master.m3u8`);
    expect(item?.video?.metadata?.thumbnailUrl).toBe(ASSET_POSTER);
  });

  it('leaves a video with no poster anywhere without one', async () => {
    mocks.getPublicCourseItem.mockResolvedValue(
      lessonItem({ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID })
    );

    const item = await getPublicCourseItemService('course', 'lesson');

    expect(item?.video?.metadata?.thumbnailUrl).toBeUndefined();
  });
});
