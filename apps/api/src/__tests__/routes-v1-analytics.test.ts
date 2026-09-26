import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/analytics', () => ({
  getPublicApiAnalyticsOverviewService: vi.fn(),
  getPublicApiAnalyticsTrafficService: vi.fn(),
  getPublicApiAnalyticsCountriesService: vi.fn(),
  getPublicApiAnalyticsFunnelService: vi.fn(),
  getPublicApiAnalyticsCourseTypesService: vi.fn(),
  getPublicApiAnalyticsTopCoursesService: vi.fn(),
  getPublicApiLoginActivityService: vi.fn(),
  getPublicApiComplianceOverviewService: vi.fn(),
  listPublicApiComplianceLearnersService: vi.fn(),
  getPublicApiLearnerAnalyticsService: vi.fn(),
  getPublicApiCourseAnalyticsService: vi.fn(),
  listPublicApiCourseAnalyticsStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/course', () => ({
  createPublicApiCourseService: vi.fn(),
  deletePublicApiCourseService: vi.fn(),
  exportCourseService: vi.fn(),
  getCourseService: vi.fn(),
  listCoursesService: vi.fn(),
  listCourseStudentsService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getPublicApiAnalyticsFunnelService,
  getPublicApiAnalyticsOverviewService,
  getPublicApiAnalyticsTrafficService,
  getPublicApiCourseAnalyticsService,
  getPublicApiLearnerAnalyticsService,
  getPublicApiLoginActivityService,
  listPublicApiComplianceLearnersService,
  listPublicApiCourseAnalyticsStudentsService
} from '@api/services/v1/analytics';
import { getCourseService } from '@api/services/v1/course';
import { v1AnalyticsRouter } from '@api/routes/v1/analytics';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const PROFILE_ID = '22222222-2222-4222-8222-222222222222';
const EMPTY_PAGE = { items: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } };

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/analytics', v1AnalyticsRouter)
  .route('/courses', v1CoursesRouter);

describe('v1 analytics routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the overview for the key org and actor', async () => {
    vi.mocked(getPublicApiAnalyticsOverviewService).mockResolvedValue({ totalStudents: 3 } as never);

    const response = await app.request('/analytics/overview');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { totalStudents: 3 } });
    expect(getPublicApiAnalyticsOverviewService).toHaveBeenCalledWith('org-1', 'actor-1');
  });

  it('defaults the traffic window to 30 days and coerces days', async () => {
    vi.mocked(getPublicApiAnalyticsTrafficService).mockResolvedValue({} as never);

    await app.request('/analytics/traffic');
    await app.request('/analytics/traffic?days=7');

    expect(getPublicApiAnalyticsTrafficService).toHaveBeenNthCalledWith(1, 'org-1', 'actor-1', { days: 30 });
    expect(getPublicApiAnalyticsTrafficService).toHaveBeenNthCalledWith(2, 'org-1', 'actor-1', { days: 7 });
  });

  it.each(['days=0', 'days=366', 'days=abc'])('rejects %s with 400', async (query) => {
    const response = await app.request(`/analytics/traffic?${query}`);

    expect(response.status).toBe(400);
    expect(getPublicApiAnalyticsTrafficService).not.toHaveBeenCalled();
  });

  it('defaults login activity to 90 days', async () => {
    vi.mocked(getPublicApiLoginActivityService).mockResolvedValue([] as never);

    await app.request('/analytics/login-activity');

    expect(getPublicApiLoginActivityService).toHaveBeenCalledWith('org-1', 'actor-1', { days: 90 });
  });

  it('passes the funnel courseId and rejects a non-uuid one', async () => {
    vi.mocked(getPublicApiAnalyticsFunnelService).mockResolvedValue({ steps: [] } as never);

    const ok = await app.request(`/analytics/funnel?courseId=${COURSE_ID}`);
    const bad = await app.request('/analytics/funnel?courseId=nope');

    expect(ok.status).toBe(200);
    expect(bad.status).toBe(400);
    expect(getPublicApiAnalyticsFunnelService).toHaveBeenCalledTimes(1);
    expect(getPublicApiAnalyticsFunnelService).toHaveBeenCalledWith('org-1', 'actor-1', {
      days: 30,
      courseId: COURSE_ID
    });
  });

  it('paginates compliance learners', async () => {
    vi.mocked(listPublicApiComplianceLearnersService).mockResolvedValue(EMPTY_PAGE as never);

    const response = await app.request('/analytics/compliance/learners?page=2&limit=5');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [], pagination: EMPTY_PAGE.pagination });
    expect(listPublicApiComplianceLearnersService).toHaveBeenCalledWith('org-1', 'actor-1', { page: 2, limit: 5 });
  });

  it('rejects a compliance learners limit over 100', async () => {
    const response = await app.request('/analytics/compliance/learners?limit=101');

    expect(response.status).toBe(400);
  });

  it('validates the learner profileId and maps service errors', async () => {
    vi.mocked(getPublicApiLearnerAnalyticsService).mockRejectedValue(
      new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404)
    );

    const bad = await app.request('/analytics/learners/not-a-uuid');
    const missing = await app.request(`/analytics/learners/${PROFILE_ID}`);

    expect(bad.status).toBe(400);
    expect(missing.status).toBe(404);
    expect(getPublicApiLearnerAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', { profileId: PROFILE_ID });
  });

  it('returns 403 when the service rejects the actor', async () => {
    vi.mocked(getPublicApiLoginActivityService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await app.request('/analytics/login-activity');

    expect(response.status).toBe(403);
  });
});

describe('v1 course analytics routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes /courses/:courseId/analytics to course analytics, not the course detail handler', async () => {
    vi.mocked(getPublicApiCourseAnalyticsService).mockResolvedValue({ totalStudents: 1 } as never);

    const response = await app.request(`/courses/${COURSE_ID}/analytics`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { totalStudents: 1 } });
    expect(getPublicApiCourseAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', { courseId: COURSE_ID });
    expect(getCourseService).not.toHaveBeenCalled();
  });

  it('paginates course analytics students', async () => {
    vi.mocked(listPublicApiCourseAnalyticsStudentsService).mockResolvedValue(EMPTY_PAGE as never);

    const response = await app.request(`/courses/${COURSE_ID}/analytics/students?page=2&limit=5`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [], pagination: EMPTY_PAGE.pagination });
    expect(listPublicApiCourseAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { page: 2, limit: 5 }
    );
  });

  it('rejects a non-uuid courseId with 400', async () => {
    const response = await app.request('/courses/nope/analytics');

    expect(response.status).toBe(400);
    expect(getPublicApiCourseAnalyticsService).not.toHaveBeenCalled();
  });
});
