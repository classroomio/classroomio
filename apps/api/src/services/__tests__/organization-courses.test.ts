import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCoursesById: vi.fn(),
  getEnrolledCourses: vi.fn(),
  getExploreCourses: vi.fn()
}));

vi.mock('@cio/db/queries/course', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/db/queries/course')>();

  return {
    ...actual,
    getCoursesById: mocks.getCoursesById,
    getEnrolledCourses: mocks.getEnrolledCourses,
    getExploreCourses: mocks.getExploreCourses
  };
});

import { getCoursesByOrgId, getRecommendedCourses, getUserEnrolledCourses } from '../organization';

describe('organization course fetchers', () => {
  it('a rejected query turns into an AppError with COURSES_FETCH_FAILED', async () => {
    mocks.getEnrolledCourses.mockRejectedValueOnce(new Error('db down'));
    mocks.getExploreCourses.mockRejectedValueOnce(new Error('db down'));
    mocks.getCoursesById.mockRejectedValueOnce(new Error('db down'));

    await expect(getUserEnrolledCourses('org-1', 'user-1')).rejects.toMatchObject({
      code: 'COURSES_FETCH_FAILED',
      statusCode: 500
    });
    await expect(getRecommendedCourses('org-1', 'user-1')).rejects.toMatchObject({
      code: 'COURSES_FETCH_FAILED',
      statusCode: 500
    });
    await expect(getCoursesByOrgId('org-1')).rejects.toMatchObject({
      code: 'COURSES_FETCH_FAILED',
      statusCode: 500
    });
  });
});
