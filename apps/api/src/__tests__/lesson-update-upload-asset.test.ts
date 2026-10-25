import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLessonById: vi.fn(),
  updateLesson: vi.fn(),
  updateLessonWithOrder: vi.fn(),
  resolveItemSlug: vi.fn(),
  touchCourseUpdatedAt: vi.fn(),
  enqueueSessionReminders: vi.fn(),
  cancelSessionReminders: vi.fn()
}));

vi.mock('@cio/db/queries/lesson', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getLessonById: mocks.getLessonById,
  updateLesson: mocks.updateLesson,
  updateLessonWithOrder: mocks.updateLessonWithOrder
}));

import { updateLessonService } from '@cio/core/services/lesson/lesson';

const LESSON_ID = 'ca51eeb5-3e1c-4370-9ecb-76f1f09e3988';
const ASSET_ID = '414807ff-909b-47a3-ad82-48233a501fc3';
const SOURCE_KEY = `${ASSET_ID}/source.mp4`;
const LEGACY_KEY = 'abc-intro.mp4';

const legacyVideo = { type: 'upload', link: 'https://storage.example.com/abc.mp4', key: LEGACY_KEY };

function storedLesson(videos: unknown[]) {
  return { id: LESSON_ID, courseId: 'course-1', slug: 'intro', videos, lessonLanguages: [] };
}

describe('updateLessonService — uploaded videos must name their asset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLessonById.mockResolvedValue(storedLesson([]));
    mocks.updateLesson.mockResolvedValue({ id: LESSON_ID });
  });

  it('rejects an upload that names no asset', async () => {
    await expect(
      updateLessonService(LESSON_ID, {
        videos: [{ type: 'upload', link: 'https://storage.example.com/new.mp4', key: SOURCE_KEY }]
      } as never)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mocks.updateLesson).not.toHaveBeenCalled();
  });

  it('accepts an upload that names its asset', async () => {
    await updateLessonService(LESSON_ID, {
      videos: [{ type: 'upload', link: '', key: SOURCE_KEY, assetId: ASSET_ID }]
    } as never);

    expect(mocks.updateLesson).toHaveBeenCalled();
  });

  it('lets a lesson holding a legacy upload save unchanged', async () => {
    mocks.getLessonById.mockResolvedValue(storedLesson([legacyVideo]));

    await updateLessonService(LESSON_ID, { videos: [legacyVideo] } as never);

    expect(mocks.updateLesson).toHaveBeenCalled();
  });

  it('rejects a new orphan even when the lesson already holds a legacy one', async () => {
    mocks.getLessonById.mockResolvedValue(storedLesson([legacyVideo]));

    await expect(
      updateLessonService(LESSON_ID, {
        videos: [legacyVideo, { type: 'upload', link: 'https://storage.example.com/new.mp4', key: SOURCE_KEY }]
      } as never)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('leaves link-based videos alone', async () => {
    await updateLessonService(LESSON_ID, {
      videos: [{ type: 'youtube', link: 'https://youtube.com/watch?v=abc' }]
    } as never);

    expect(mocks.updateLesson).toHaveBeenCalled();
  });

  it('does not read the lesson when the update does not touch videos', async () => {
    await updateLessonService(LESSON_ID, { title: 'Renamed' } as never);

    expect(mocks.getLessonById).not.toHaveBeenCalled();
    expect(mocks.updateLesson).toHaveBeenCalled();
  });
});
