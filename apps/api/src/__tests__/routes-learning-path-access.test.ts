import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

import { ROLE } from '@cio/utils/constants';

const { ORG_ID, PATH_ID, COURSE_ID, MEMBER_ID, caller } = vi.hoisted(() => ({
  ORG_ID: '11111111-1111-4111-8111-111111111111',
  PATH_ID: '22222222-2222-4222-8222-222222222222',
  COURSE_ID: '33333333-3333-4333-8333-333333333333',
  MEMBER_ID: '44444444-4444-4444-8444-444444444444',
  caller: { role: 2 }
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1' });
    c.set('orgRoles', { [ORG_ID]: caller.role });
    await next();
  }
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/learning-path/learner', () => ({
  enrollInLearningPathService: vi.fn(),
  getLearnerLearningPathService: vi.fn(),
  listEnrolledLearningPathsService: vi.fn(),
  listExploreLearningPathsService: vi.fn()
}));

vi.mock('@api/services/learning-path/learning-path', () => ({
  addLearningPathCourseService: vi.fn().mockResolvedValue({ courseId: COURSE_ID, enrolledStudents: 0 }),
  addLearningPathMembersService: vi.fn().mockResolvedValue({ added: [], skipped: [] }),
  createLearningPathService: vi.fn(),
  deleteLearningPathService: vi.fn(),
  getLearningPathDetailService: vi.fn().mockResolvedValue({ id: PATH_ID, courses: [] }),
  listLearningPathCourseOptionsService: vi.fn().mockResolvedValue([]),
  listLearningPathMembersService: vi.fn().mockResolvedValue([]),
  listLearningPathsService: vi.fn().mockResolvedValue({ paths: [], overview: {} }),
  removeLearningPathCourseService: vi.fn().mockResolvedValue({ courseId: COURSE_ID }),
  removeLearningPathMemberService: vi.fn().mockResolvedValue({ id: MEMBER_ID }),
  reorderLearningPathCoursesService: vi.fn().mockResolvedValue({ courseIds: [COURSE_ID] }),
  updateLearningPathService: vi.fn().mockResolvedValue({ id: PATH_ID })
}));

import { learningPathRouter } from '@api/routes/learning-path/learning-path';

const request = (method: string, path: string, body?: unknown) =>
  learningPathRouter.request(path, {
    method,
    headers: { 'cio-org-id': ORG_ID, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

const managementRequests: [string, string, unknown?][] = [
  ['PUT', `/${PATH_ID}`, { name: 'Renamed' }],
  ['GET', `/${PATH_ID}/course-options`],
  ['POST', `/${PATH_ID}/courses`, { courseId: COURSE_ID }],
  ['PUT', `/${PATH_ID}/courses/order`, { courseIds: [COURSE_ID] }],
  ['DELETE', `/${PATH_ID}/courses/${COURSE_ID}`],
  ['GET', `/${PATH_ID}/members`],
  ['POST', `/${PATH_ID}/members`, { emails: ['learner@example.com'] }],
  ['DELETE', `/${PATH_ID}/members/${MEMBER_ID}`]
];

describe('learning path management is admin-only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(managementRequests)('refuses a tutor: %s %s', async (method, path, body) => {
    caller.role = ROLE.TUTOR;

    const response = await request(method, path, body);

    expect(response.status).toBe(403);
  });

  it.each(managementRequests)('lets an admin through: %s %s', async (method, path, body) => {
    caller.role = ROLE.ADMIN;

    const response = await request(method, path, body);

    expect(response.status).toBeLessThan(400);
  });

  it('lets a tutor read the path list and a path', async () => {
    caller.role = ROLE.TUTOR;

    expect((await request('GET', '/')).status).toBe(200);
    expect((await request('GET', `/${PATH_ID}`)).status).toBe(200);
  });
});
