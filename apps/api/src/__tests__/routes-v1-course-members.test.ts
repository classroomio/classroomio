import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/course-member', () => ({
  listCourseMembersService: vi.fn(),
  addCourseMemberService: vi.fn(),
  getCourseMemberService: vi.fn(),
  updateCourseMemberService: vi.fn(),
  deleteCourseMemberService: vi.fn(),
  resetCourseMemberProgressService: vi.fn(),
  getCourseMemberAnalyticsService: vi.fn()
}));

vi.mock('@api/services/v1/course-invite', () => ({
  listCourseInvitesService: vi.fn(),
  createCourseInviteService: vi.fn(),
  revokeCourseInviteService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { listCourseMembersService } from '@api/services/v1/course-member';
import { listCourseInvitesService } from '@api/services/v1/course-invite';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

describe('v1CoursesRouter nested course-member/course-invite mounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes GET /:courseId/members to the members router with courseId from the parent path', async () => {
    vi.mocked(listCourseMembersService).mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    } as Awaited<ReturnType<typeof listCourseMembersService>>);

    const courseId = '11111111-1111-4111-8111-111111111111';
    const response = await app.request(`/${courseId}/members`);

    expect(response.status).toBe(200);
    expect(listCourseMembersService).toHaveBeenCalledWith(
      'org-1',
      { courseId },
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('routes GET /:courseId/invites to the invites router with courseId from the parent path', async () => {
    vi.mocked(listCourseInvitesService).mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    } as Awaited<ReturnType<typeof listCourseInvitesService>>);

    const courseId = '22222222-2222-4222-8222-222222222222';
    const response = await app.request(`/${courseId}/invites`);

    expect(response.status).toBe(200);
    expect(listCourseInvitesService).toHaveBeenCalledWith(
      'org-1',
      { courseId },
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('rejects a non-UUID courseId with a validation error, not a 404 route miss', async () => {
    const response = await app.request('/not-a-uuid/members');

    expect(response.status).toBe(400);
    expect(listCourseMembersService).not.toHaveBeenCalled();
  });
});
