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

import { createPublicApiLessonService, updatePublicApiLessonService } from '@api/services/v1/lessons/lesson';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const COURSE_ID = 'a79703b5-b47b-46af-a1c4-ed591893d7a7';
const LESSON_ID = 'ca51eeb5-3e1c-4370-9ecb-76f1f09e3988';

describe('public API lesson writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);
    mocks.getLessonById.mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID });
    mocks.createLesson.mockResolvedValue({ id: LESSON_ID, title: 'Intro', createdVia: 'mcp' });
    mocks.updateLessonService.mockResolvedValue({ id: LESSON_ID, title: 'Intro', createdVia: 'mcp' });
  });

  it.each([
    ['an MCP key', { source: 'mcp' as const }, 'mcp'],
    ['a public API key', { source: 'api' as const }, 'public_api'],
    ['no attribution', {}, 'public_api']
  ])('records the channel of %s on the lesson it creates', async (_label, attribution, expected) => {
    await createPublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID } as never,
      { title: 'Intro' } as never,
      attribution
    );

    expect(mocks.createLesson).toHaveBeenCalledWith(
      COURSE_ID,
      expect.anything(),
      expect.objectContaining({ createdVia: expected })
    );
  });

  it('does not expose the channel in the lesson it returns', async () => {
    const created = await createPublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID } as never,
      { title: 'Intro' } as never
    );
    const updated = await updatePublicApiLessonService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID, lessonId: LESSON_ID } as never,
      { title: 'Intro' } as never
    );

    expect(created).toEqual({ id: LESSON_ID, title: 'Intro' });
    expect(updated).toEqual({ id: LESSON_ID, title: 'Intro' });
  });
});
