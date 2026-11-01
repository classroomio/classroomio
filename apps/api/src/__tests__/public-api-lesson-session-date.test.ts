import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createLesson: vi.fn(),
  updateLessonService: vi.fn(),
  getLessonById: vi.fn(),
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/core/services/lesson/lesson', () => ({
  createLesson: mocks.createLesson,
  updateLessonService: mocks.updateLessonService
}));

vi.mock('@cio/db/queries/assets', () => ({
  createAssetUsage: vi.fn(),
  deleteAssetUsagesByTargetSlots: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({ db: { transaction: vi.fn() } }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: mocks.getLessonById }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: mocks.getCourseOrganizationId }));
vi.mock('@api/services/v1/lessons/videos', () => ({ resolveLessonVideos: vi.fn() }));

import { ZPublicApiUpdateLesson } from '@cio/utils/validation/public-api';
import { createPublicApiLessonService, updatePublicApiLessonService } from '@api/services/v1/lessons/lesson';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const COURSE_ID = 'a79703b5-b47b-46af-a1c4-ed591893d7a7';
const LESSON_ID = 'ca51eeb5-3e1c-4370-9ecb-76f1f09e3988';
const params = { courseId: COURSE_ID, lessonId: LESSON_ID } as never;

describe('public API lesson live-session date', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);
    mocks.getLessonById.mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID });
    mocks.createLesson.mockResolvedValue({ id: LESSON_ID });
    mocks.updateLessonService.mockResolvedValue({ id: LESSON_ID });
  });

  it('does not stamp a date on a lesson created through the API', async () => {
    await createPublicApiLessonService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID } as never, {
      title: 'Intro',
      order: 1
    });

    const [, createdFields] = mocks.createLesson.mock.calls[0];
    expect(createdFields).not.toHaveProperty('lessonAt');
  });

  it('clears the date when lessonAt is null', async () => {
    await updatePublicApiLessonService(ORG_ID, ACTOR_ID, params, { lessonAt: null });

    expect(mocks.updateLessonService).toHaveBeenCalledWith(LESSON_ID, expect.objectContaining({ lessonAt: null }));
  });

  it('sets the date when lessonAt is a timestamp', async () => {
    await updatePublicApiLessonService(ORG_ID, ACTOR_ID, params, { lessonAt: '2026-11-05T18:00:00+01:00' });

    expect(mocks.updateLessonService).toHaveBeenCalledWith(
      LESSON_ID,
      expect.objectContaining({ lessonAt: '2026-11-05T18:00:00+01:00' })
    );
  });

  it('leaves the date untouched when lessonAt is omitted', async () => {
    await updatePublicApiLessonService(ORG_ID, ACTOR_ID, params, { title: 'Renamed' });

    const [, updatedFields] = mocks.updateLessonService.mock.calls[0];
    expect(updatedFields.lessonAt).toBeUndefined();
  });

  it('accepts null and offset timestamps and rejects anything else', () => {
    expect(ZPublicApiUpdateLesson.safeParse({ lessonAt: null }).success).toBe(true);
    expect(ZPublicApiUpdateLesson.safeParse({ lessonAt: '2026-11-05T17:00:00Z' }).success).toBe(true);
    expect(ZPublicApiUpdateLesson.safeParse({ lessonAt: 'Tue Oct 27 2026' }).success).toBe(false);
    expect(ZPublicApiUpdateLesson.safeParse({ lessonAt: '' }).success).toBe(false);
  });
});
