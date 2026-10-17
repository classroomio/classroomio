import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/lessons', () => ({
  listPublicApiCourseLessonsService: vi.fn(),
  getPublicApiCourseLessonService: vi.fn(),
  deletePublicApiCourseLessonService: vi.fn(),
  notifyPublicApiCourseLessonSessionService: vi.fn(),
  toPublicTranslation: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  deletePublicApiCourseLessonService,
  getPublicApiCourseLessonService,
  listPublicApiCourseLessonsService,
  notifyPublicApiCourseLessonSessionService
} from '@api/services/v1/courses/lessons';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const SECTION_ID = '33333333-3333-4333-8333-333333333333';
const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

describe('v1 course lessons routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists lessons filtered by section', async () => {
    vi.mocked(listPublicApiCourseLessonsService).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    });

    const response = await app.request(`/${COURSE_ID}/lessons?sectionId=${SECTION_ID}`);

    expect(response.status).toBe(200);
    expect(listPublicApiCourseLessonsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { page: 1, limit: 20, sectionId: SECTION_ID }
    );
  });

  it('gets and deletes a lesson', async () => {
    vi.mocked(getPublicApiCourseLessonService).mockResolvedValue({ id: LESSON_ID } as never);
    vi.mocked(deletePublicApiCourseLessonService).mockResolvedValue({ id: LESSON_ID } as never);

    const got = await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}`);
    expect(got.status).toBe(200);
    expect(await got.json()).toEqual({ success: true, data: { id: LESSON_ID } });
    expect((await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}`, { method: 'DELETE' })).status).toBe(200);
    expect(deletePublicApiCourseLessonService).toHaveBeenCalledWith('org-1', 'actor-1', lessonParams);
  });

  it('queues a session notification with 202', async () => {
    vi.mocked(notifyPublicApiCourseLessonSessionService).mockResolvedValue({ jobId: 'job-1' });

    const response = await app.request(`/${COURSE_ID}/lessons/${LESSON_ID}/notify-session-update`, {
      method: 'POST'
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ success: true, data: { jobId: 'job-1' } });
  });

  it('returns 400 for a bad lesson id', async () => {
    expect((await app.request(`/${COURSE_ID}/lessons/nope`)).status).toBe(400);
    expect(getPublicApiCourseLessonService).not.toHaveBeenCalled();
  });
});
