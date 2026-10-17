import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/content', () => ({
  reorderPublicApiCourseContentService: vi.fn(),
  updatePublicApiCourseContentLockService: vi.fn(),
  deletePublicApiCourseContentService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  deletePublicApiCourseContentService,
  reorderPublicApiCourseContentService,
  updatePublicApiCourseContentLockService
} from '@api/services/v1/courses/content';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const SECTION_ID = '33333333-3333-4333-8333-333333333333';
const courseParams = { courseId: COURSE_ID };

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1 course content routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reorders content', async () => {
    vi.mocked(reorderPublicApiCourseContentService).mockResolvedValue({
      updatedSections: 1,
      updatedLessons: 1,
      updatedExercises: 0
    });
    const body = {
      sections: [{ id: SECTION_ID, order: 1 }],
      items: [{ id: LESSON_ID, type: 'LESSON', sectionId: SECTION_ID, order: 1 }]
    };

    const response = await app.request(`/${COURSE_ID}/content/reorder`, jsonRequest('PUT', body));

    expect(response.status).toBe(200);
    expect(reorderPublicApiCourseContentService).toHaveBeenCalledWith('org-1', 'actor-1', courseParams, body);
  });

  it('locks content and deletes content in batches', async () => {
    vi.mocked(updatePublicApiCourseContentLockService).mockResolvedValue({ items: [] } as never);
    vi.mocked(deletePublicApiCourseContentService).mockResolvedValue({ items: [] } as never);

    const lock = { items: [{ id: LESSON_ID, type: 'LESSON', isUnlocked: false }] };
    const del = { items: [{ id: LESSON_ID, type: 'LESSON' }] };

    expect((await app.request(`/${COURSE_ID}/content`, jsonRequest('PATCH', lock))).status).toBe(200);
    expect((await app.request(`/${COURSE_ID}/content/delete`, jsonRequest('POST', del))).status).toBe(200);
    expect(updatePublicApiCourseContentLockService).toHaveBeenCalledWith('org-1', 'actor-1', courseParams, lock);
    expect(deletePublicApiCourseContentService).toHaveBeenCalledWith('org-1', 'actor-1', courseParams, del);
  });

  it('rejects invalid batches with 400', async () => {
    const dup = { id: LESSON_ID, type: 'LESSON' };

    expect((await app.request(`/${COURSE_ID}/content/reorder`, jsonRequest('PUT', {}))).status).toBe(400);
    expect((await app.request(`/${COURSE_ID}/content/delete`, jsonRequest('POST', { items: [dup, dup] }))).status).toBe(
      400
    );
    expect(
      (await app.request(`/${COURSE_ID}/content`, jsonRequest('PATCH', { items: [{ id: 'x', type: 'LESSON' }] })))
        .status
    ).toBe(400);
    expect(reorderPublicApiCourseContentService).not.toHaveBeenCalled();
    expect(deletePublicApiCourseContentService).not.toHaveBeenCalled();
  });
});
