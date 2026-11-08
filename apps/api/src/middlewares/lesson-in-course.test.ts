import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

import { lessonInCourseMiddleware } from './lesson-in-course';

const mocks = vi.hoisted(() => ({
  getLessonRowById: vi.fn()
}));

vi.mock('@cio/db/queries/lesson', () => ({
  getLessonRowById: (lessonId: string) => mocks.getLessonRowById(lessonId)
}));

const COURSE_A = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const COURSE_B = '9a1c3e5f-2b4d-4f6a-8c0e-1d3f5a7b9c2e';
const LESSON_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function buildApp() {
  return new Hono().get('/course/:courseId/lesson/:lessonId/blocks', lessonInCourseMiddleware, (c) =>
    c.json({ success: true })
  );
}

describe('lessonInCourseMiddleware', () => {
  beforeEach(() => {
    mocks.getLessonRowById.mockReset();
  });

  it('allows a lesson that belongs to the course in the URL', async () => {
    mocks.getLessonRowById.mockResolvedValue({ id: LESSON_ID, courseId: COURSE_A });

    const response = await buildApp().request(`/course/${COURSE_A}/lesson/${LESSON_ID}/blocks`);

    expect(response.status).toBe(200);
  });

  it('rejects a lesson from another course', async () => {
    mocks.getLessonRowById.mockResolvedValue({ id: LESSON_ID, courseId: COURSE_B });

    const response = await buildApp().request(`/course/${COURSE_A}/lesson/${LESSON_ID}/blocks`);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.LESSON_NOT_FOUND);
  });

  it('rejects a lesson that does not exist', async () => {
    mocks.getLessonRowById.mockResolvedValue(null);

    const response = await buildApp().request(`/course/${COURSE_A}/lesson/${LESSON_ID}/blocks`);

    expect(response.status).toBe(404);
  });
});
