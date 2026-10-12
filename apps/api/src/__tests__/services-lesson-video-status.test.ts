import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLessonById: vi.fn(),
  getAssetsByIds: vi.fn()
}));

vi.mock('@cio/db/queries/lesson', () => ({
  getLessonById: mocks.getLessonById
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetsByIds: mocks.getAssetsByIds
}));

import { getLessonVideoHlsStatusesService } from '@api/services/lesson/video-status';

const LESSON_ID = '7c1f4b2e-0f6d-4a3b-9c5e-1d2a3b4c5d6e';
const ASSET_A = '9c858901-8a57-4791-81fe-4c455b099bc9';
const ASSET_B = '2b7d6e51-3f42-4c88-9a10-7e5f4c3b2a19';

describe('getLessonVideoHlsStatusesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAssetsByIds.mockResolvedValue([]);
  });

  it('reports the live status of each uploaded video, keyed by asset', async () => {
    mocks.getLessonById.mockResolvedValue({
      id: LESSON_ID,
      videos: [
        { type: 'upload', assetId: ASSET_A },
        { type: 'upload', assetId: ASSET_B }
      ]
    });
    mocks.getAssetsByIds.mockResolvedValue([
      { id: ASSET_A, hlsStatus: 'converting' },
      { id: ASSET_B, hlsStatus: 'ready' }
    ]);

    const statuses = await getLessonVideoHlsStatusesService(LESSON_ID);

    expect(statuses).toEqual({ [ASSET_A]: 'converting', [ASSET_B]: 'ready' });
  });

  it('ignores videos that are links rather than uploads', async () => {
    mocks.getLessonById.mockResolvedValue({
      id: LESSON_ID,
      videos: [
        { type: 'youtube', link: 'https://youtube.com/watch?v=abc' },
        { type: 'upload', assetId: ASSET_A }
      ]
    });
    mocks.getAssetsByIds.mockResolvedValue([{ id: ASSET_A, hlsStatus: 'pending' }]);

    await getLessonVideoHlsStatusesService(LESSON_ID);

    expect(mocks.getAssetsByIds).toHaveBeenCalledWith([ASSET_A]);
  });

  it('does not query storage for a lesson with no uploads', async () => {
    mocks.getLessonById.mockResolvedValue({
      id: LESSON_ID,
      videos: [{ type: 'vimeo', link: 'https://vimeo.com/1' }]
    });

    expect(await getLessonVideoHlsStatusesService(LESSON_ID)).toEqual({});
    expect(mocks.getAssetsByIds).not.toHaveBeenCalled();
  });

  it('treats a column that was never written as none', async () => {
    mocks.getLessonById.mockResolvedValue({
      id: LESSON_ID,
      videos: [{ type: 'upload', assetId: ASSET_A }]
    });
    mocks.getAssetsByIds.mockResolvedValue([{ id: ASSET_A, hlsStatus: null }]);

    expect(await getLessonVideoHlsStatusesService(LESSON_ID)).toEqual({ [ASSET_A]: 'none' });
  });

  it('omits an asset the lesson references but the org no longer owns', async () => {
    mocks.getLessonById.mockResolvedValue({
      id: LESSON_ID,
      videos: [
        { type: 'upload', assetId: ASSET_A },
        { type: 'upload', assetId: ASSET_B }
      ]
    });
    mocks.getAssetsByIds.mockResolvedValue([{ id: ASSET_A, hlsStatus: 'ready' }]);

    expect(await getLessonVideoHlsStatusesService(LESSON_ID)).toEqual({ [ASSET_A]: 'ready' });
  });

  it('handles a lesson whose videos column is null', async () => {
    mocks.getLessonById.mockResolvedValue({ id: LESSON_ID, videos: null });

    expect(await getLessonVideoHlsStatusesService(LESSON_ID)).toEqual({});
  });

  it('reports a missing lesson rather than an empty result', async () => {
    mocks.getLessonById.mockResolvedValue(null);

    await expect(getLessonVideoHlsStatusesService(LESSON_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});
