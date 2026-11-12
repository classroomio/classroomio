import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createLesson: vi.fn(),
  updateLessonService: vi.fn(),
  resolveLessonVideos: vi.fn(),
  createAssetUsage: vi.fn(),
  deleteAssetUsagesByTargetSlots: vi.fn(),
  transaction: vi.fn(),
  getLessonById: vi.fn(),
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/core/services/lesson/lesson', () => ({
  createLesson: mocks.createLesson,
  updateLessonService: mocks.updateLessonService
}));

vi.mock('@cio/db/queries/assets', () => ({
  createAssetUsage: mocks.createAssetUsage,
  deleteAssetUsagesByTargetSlots: mocks.deleteAssetUsagesByTargetSlots
}));

vi.mock('@cio/db/drizzle', () => ({ db: { transaction: mocks.transaction } }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: mocks.getLessonById }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: mocks.getCourseOrganizationId }));
vi.mock('@api/services/v1/lessons/videos', () => ({ resolveLessonVideos: mocks.resolveLessonVideos }));

import { createPublicApiLessonService, updatePublicApiLessonService } from '@api/services/v1/lessons/lesson';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const COURSE_ID = 'a79703b5-b47b-46af-a1c4-ed591893d7a7';
const LESSON_ID = 'ca51eeb5-3e1c-4370-9ecb-76f1f09e3988';
const ASSET_A = '414807ff-909b-47a3-ad82-48233a501fc3';
const ASSET_B = '5d570433-a343-4481-8d80-51abca2f944e';
const txClient = { id: 'transaction-client' };

describe('public API lesson videos record asset usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);
    mocks.getLessonById.mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID });
    mocks.createLesson.mockResolvedValue({ id: LESSON_ID });
    mocks.updateLessonService.mockResolvedValue({ id: LESSON_ID });
    mocks.createAssetUsage.mockResolvedValue({ id: 'usage-1' });
    mocks.deleteAssetUsagesByTargetSlots.mockResolvedValue(0);
    mocks.transaction.mockImplementation(async (run) => run(txClient));
    mocks.resolveLessonVideos.mockResolvedValue([{ type: 'upload', link: '', key: 'k', assetId: ASSET_A }]);
  });

  it('attaches the asset to the lesson it was created on', async () => {
    await createPublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID } as never,
      {
        title: 'Intro',
        videos: [{ type: 'upload', assetId: ASSET_A }]
      } as never
    );

    expect(mocks.createAssetUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        assetId: ASSET_A,
        targetType: 'lesson',
        targetId: LESSON_ID,
        slotType: 'lesson_video',
        position: 0
      }),
      txClient
    );
  });

  it('records one usage per video, in order', async () => {
    mocks.resolveLessonVideos.mockResolvedValue([
      { type: 'upload', link: '', assetId: ASSET_A },
      { type: 'upload', link: '', assetId: ASSET_B }
    ]);

    await createPublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID } as never,
      {
        title: 'Intro',
        videos: [
          { type: 'upload', assetId: ASSET_A },
          { type: 'upload', assetId: ASSET_B }
        ]
      } as never
    );

    const positions = mocks.createAssetUsage.mock.calls.map(([usage]) => [usage.assetId, usage.position]);
    expect(positions).toEqual([
      [ASSET_A, 0],
      [ASSET_B, 1]
    ]);
  });

  it('replaces the lesson video slots on update, so a removed video stops counting as used', async () => {
    await updatePublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID, lessonId: LESSON_ID } as never,
      {
        videos: [{ type: 'upload', assetId: ASSET_A }]
      } as never
    );

    expect(mocks.deleteAssetUsagesByTargetSlots).toHaveBeenCalledWith('lesson', LESSON_ID, ['lesson_video'], txClient);
    expect(mocks.createAssetUsage).toHaveBeenCalledOnce();
  });

  it('replaces the slots on one transaction client, so a failed insert cannot half-apply', async () => {
    mocks.resolveLessonVideos.mockResolvedValue([
      { type: 'upload', link: '', assetId: ASSET_A },
      { type: 'upload', link: '', assetId: ASSET_B }
    ]);

    await createPublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID } as never,
      {
        title: 'Intro',
        videos: [
          { type: 'upload', assetId: ASSET_A },
          { type: 'upload', assetId: ASSET_B }
        ]
      } as never
    );

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.deleteAssetUsagesByTargetSlots).toHaveBeenCalledWith('lesson', LESSON_ID, ['lesson_video'], txClient);
    for (const [, client] of mocks.createAssetUsage.mock.calls) {
      expect(client).toBe(txClient);
    }
  });

  it('propagates a usage failure so the transaction rolls the delete back', async () => {
    const usageError = new Error('usage insert failed');
    mocks.createAssetUsage.mockRejectedValue(usageError);
    mocks.transaction.mockImplementation(async (run) => run(txClient));

    await expect(
      createPublicApiLessonService(
        ORG_ID,
        ACTOR_ID,
        { courseId: COURSE_ID } as never,
        {
          title: 'Intro',
          videos: [{ type: 'upload', assetId: ASSET_A }]
        } as never
      )
    ).rejects.toBe(usageError);
  });

  it('skips link-based videos, which have no asset to attach', async () => {
    mocks.resolveLessonVideos.mockResolvedValue([{ type: 'youtube', link: 'https://youtube.com/watch?v=a' }]);

    await createPublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID } as never,
      {
        title: 'Intro',
        videos: [{ type: 'youtube', link: 'https://youtube.com/watch?v=a' }]
      } as never
    );

    expect(mocks.resolveLessonVideos).toHaveBeenCalled();
    expect(mocks.createAssetUsage).not.toHaveBeenCalled();
  });

  it('leaves usage untouched when the update does not mention videos', async () => {
    await updatePublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID, lessonId: LESSON_ID } as never,
      {
        title: 'Renamed'
      } as never
    );

    expect(mocks.deleteAssetUsagesByTargetSlots).not.toHaveBeenCalled();
    expect(mocks.createAssetUsage).not.toHaveBeenCalled();
  });
});
