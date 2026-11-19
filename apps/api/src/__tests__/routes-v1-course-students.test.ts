import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/course', () => ({
  createPublicApiCourseService: vi.fn(),
  deletePublicApiCourseService: vi.fn(),
  exportCourseService: vi.fn(),
  getCourseService: vi.fn(),
  listCoursesService: vi.fn(),
  listCourseStudentsService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

vi.mock('@api/services/v1/courses/members', () => ({
  listCourseMembersService: vi.fn(),
  addCourseMemberService: vi.fn(),
  getCourseMemberService: vi.fn(),
  updateCourseMemberService: vi.fn(),
  deleteCourseMemberService: vi.fn(),
  resetCourseMemberProgressService: vi.fn(),
  getCourseMemberAnalyticsService: vi.fn()
}));

vi.mock('@api/services/v1/courses/invites', () => ({
  listCourseInvitesService: vi.fn(),
  createCourseInviteService: vi.fn(),
  revokeCourseInviteService: vi.fn()
}));

vi.mock('@api/services/v1/shared', () => ({
  assertCourseBelongsToOrganization: vi.fn(),
  assertCourseTeamMemberOrOrgAdmin: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { listCourseStudentsService } from '@api/services/v1/courses/course';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

const studentPage = {
  items: [{ id: 'member-1' }],
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1
};

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CoursesRouter);

describe('GET /:courseId/students', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCourseStudentsService).mockResolvedValue(
      studentPage as Awaited<ReturnType<typeof listCourseStudentsService>>
    );
  });

  it('applies the default page and limit and returns the paginated envelope', async () => {
    const response = await app.request(`/${COURSE_ID}/students`);

    expect(response.status).toBe(200);
    expect(listCourseStudentsService).toHaveBeenCalledWith('org-1', { courseId: COURSE_ID }, { page: 1, limit: 20 });
    expect(await response.json()).toEqual({
      success: true,
      data: studentPage.items,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    });
  });

  it('forwards an explicit page and limit and echoes them in the pagination block', async () => {
    vi.mocked(listCourseStudentsService).mockResolvedValue({
      ...studentPage,
      page: 3,
      limit: 5,
      total: 11,
      totalPages: 3
    } as Awaited<ReturnType<typeof listCourseStudentsService>>);

    const response = await app.request(`/${COURSE_ID}/students?page=3&limit=5`);

    expect(response.status).toBe(200);
    expect(listCourseStudentsService).toHaveBeenCalledWith('org-1', { courseId: COURSE_ID }, { page: 3, limit: 5 });
    expect(await response.json()).toEqual({
      success: true,
      data: studentPage.items,
      pagination: { page: 3, limit: 5, total: 11, totalPages: 3 }
    });
  });

  it('rejects a limit above the maximum before the service runs', async () => {
    const response = await app.request(`/${COURSE_ID}/students?limit=500`);

    expect(response.status).toBe(400);
    expect(listCourseStudentsService).not.toHaveBeenCalled();
  });

  it('rejects a page below 1 before the service runs', async () => {
    const response = await app.request(`/${COURSE_ID}/students?page=0`);

    expect(response.status).toBe(400);
    expect(listCourseStudentsService).not.toHaveBeenCalled();
  });

  it('rejects a non-UUID courseId with a validation error, not a 404 route miss', async () => {
    const response = await app.request('/not-a-uuid/students');

    expect(response.status).toBe(400);
    expect(listCourseStudentsService).not.toHaveBeenCalled();
  });
});
