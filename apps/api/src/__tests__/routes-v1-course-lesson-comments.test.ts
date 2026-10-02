import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/lesson-comments', () => ({
  listPublicApiCourseLessonCommentsService: vi.fn(),
  createPublicApiCourseLessonCommentService: vi.fn(),
  updatePublicApiCourseLessonCommentService: vi.fn(),
  deletePublicApiCourseLessonCommentService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  createPublicApiCourseLessonCommentService,
  deletePublicApiCourseLessonCommentService,
  listPublicApiCourseLessonCommentsService,
  updatePublicApiCourseLessonCommentService
} from '@api/services/v1/courses/lesson-comments';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LESSON_ID = '22222222-2222-4222-8222-222222222222';
const lessonParams = { courseId: COURSE_ID, lessonId: LESSON_ID };
const base = `/${COURSE_ID}/lessons/${LESSON_ID}/comments`;

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

describe('v1 lesson comment routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists comments with a cursor', async () => {
    vi.mocked(listPublicApiCourseLessonCommentsService).mockResolvedValue({ items: [], total: 0, nextCursor: null });

    const cursor = '2026-09-30 10:00:00.123456+00|42';
    const response = await app.request(`${base}?cursor=${encodeURIComponent(cursor)}&limit=5`);

    expect(response.status).toBe(200);
    expect(listPublicApiCourseLessonCommentsService).toHaveBeenCalledWith('org-1', 'actor-1', lessonParams, {
      cursor,
      limit: 5
    });
    expect((await app.request(`${base}?cursor=42`)).status).toBe(400);
  });

  it('creates a comment with 201', async () => {
    vi.mocked(createPublicApiCourseLessonCommentService).mockResolvedValue({ id: 1 } as never);

    const response = await app.request(base, jsonRequest('POST', { comment: 'Nice' }));

    expect(response.status).toBe(201);
    expect(createPublicApiCourseLessonCommentService).toHaveBeenCalledWith('org-1', 'actor-1', lessonParams, {
      comment: 'Nice'
    });
  });

  it('edits and deletes by numeric comment id', async () => {
    vi.mocked(updatePublicApiCourseLessonCommentService).mockResolvedValue({ id: 7 } as never);
    vi.mocked(deletePublicApiCourseLessonCommentService).mockResolvedValue({ id: 7 } as never);

    expect((await app.request(`${base}/7`, jsonRequest('PUT', { comment: 'Edit' }))).status).toBe(200);
    expect((await app.request(`${base}/7`, { method: 'DELETE' })).status).toBe(200);
    expect(deletePublicApiCourseLessonCommentService).toHaveBeenCalledWith('org-1', 'actor-1', {
      ...lessonParams,
      commentId: 7
    });
  });

  it('rejects bad ids and empty comments with 400', async () => {
    expect((await app.request(`${base}/abc`, { method: 'DELETE' })).status).toBe(400);
    expect((await app.request(`${base}?cursor=abc`)).status).toBe(400);
    expect((await app.request(base, jsonRequest('POST', { comment: '' }))).status).toBe(400);
    expect(createPublicApiCourseLessonCommentService).not.toHaveBeenCalled();
  });
});
