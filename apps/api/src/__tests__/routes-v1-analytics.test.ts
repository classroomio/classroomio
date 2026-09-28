import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/analytics/org', () => ({
  getPublicApiOrgAnalyticsService: vi.fn(),
  listPublicApiComplianceLearnersService: vi.fn()
}));

vi.mock('@api/services/v1/analytics/course', () => ({
  getPublicApiCourseAnalyticsService: vi.fn(),
  listPublicApiCourseAnalyticsStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/analytics/learner', () => ({
  getPublicApiLearnerAnalyticsService: vi.fn()
}));

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

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getPublicApiCourseAnalyticsService,
  listPublicApiCourseAnalyticsStudentsService
} from '@api/services/v1/analytics/course';
import {
  getPublicApiOrgAnalyticsService,
  listPublicApiComplianceLearnersService
} from '@api/services/v1/analytics/org';
import { getCourseService } from '@api/services/v1/courses/course';
import { getPublicApiLearnerAnalyticsService } from '@api/services/v1/analytics/learner';
import { v1AnalyticsRouter } from '@api/routes/v1/analytics';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const PROFILE_ID = '22222222-2222-4222-8222-222222222222';
const EMPTY_PAGE = { items: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } };
const ORG_RESULT = {
  data: { overview: { totalStudents: 3 } },
  meta: { include: ['overview'], days: 30, limit: 5, omitted: [], generatedAt: '2026-09-27T10:00:00.000Z' }
};

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/analytics', v1AnalyticsRouter)
  .route('/courses', v1CoursesRouter);

describe('GET /analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the overview section with data, meta and a no-store cache header', async () => {
    vi.mocked(getPublicApiOrgAnalyticsService).mockResolvedValue(ORG_RESULT as never);

    const response = await app.request('/analytics');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, ...ORG_RESULT });
    expect(getPublicApiOrgAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', {
      include: ['overview'],
      days: 30,
      limit: 5
    });
  });

  it('parses a comma-separated include with days and limit', async () => {
    vi.mocked(getPublicApiOrgAnalyticsService).mockResolvedValue(ORG_RESULT as never);

    await app.request('/analytics?include=traffic,%20compliance&days=90&limit=10');

    expect(getPublicApiOrgAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', {
      include: ['traffic', 'compliance'],
      days: 90,
      limit: 10
    });
  });

  it.each(['days=14', 'days=0', 'days=abc', 'include=bogus', 'include=', 'limit=0', 'limit=21'])(
    'rejects %s with 400',
    async (query) => {
      const response = await app.request(`/analytics?${query}`);

      expect(response.status).toBe(400);
      expect(getPublicApiOrgAnalyticsService).not.toHaveBeenCalled();
    }
  );

  it('returns 403 when the service rejects the actor', async () => {
    vi.mocked(getPublicApiOrgAnalyticsService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await app.request('/analytics');

    expect(response.status).toBe(403);
  });
});

describe('GET /analytics/compliance/learners and /analytics/learners/:profileId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});

describe('GET /courses/:courseId/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to course analytics, not the course detail handler, defaulting to the summary', async () => {
    const result = {
      data: { summary: { totalStudents: 1 } },
      meta: { include: ['summary'], days: 30, generatedAt: null }
    };
    vi.mocked(getPublicApiCourseAnalyticsService).mockResolvedValue(result as never);

    const response = await app.request(`/courses/${COURSE_ID}/analytics`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, ...result });
    expect(getPublicApiCourseAnalyticsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { include: ['summary'], days: 30 }
    );
    expect(getCourseService).not.toHaveBeenCalled();
  });

  it('accepts the funnel section and rejects org-only sections', async () => {
    vi.mocked(getPublicApiCourseAnalyticsService).mockResolvedValue({ data: {}, meta: {} } as never);

    const ok = await app.request(`/courses/${COURSE_ID}/analytics?include=summary,funnel&days=7`);
    const bad = await app.request(`/courses/${COURSE_ID}/analytics?include=traffic`);

    expect(ok.status).toBe(200);
    expect(bad.status).toBe(400);
    expect(getPublicApiCourseAnalyticsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { include: ['summary', 'funnel'], days: 7 }
    );
  });

  it('paginates course analytics students and caps limit at 50', async () => {
    vi.mocked(listPublicApiCourseAnalyticsStudentsService).mockResolvedValue(EMPTY_PAGE as never);

    const response = await app.request(`/courses/${COURSE_ID}/analytics/students?page=2&limit=5`);
    const tooMany = await app.request(`/courses/${COURSE_ID}/analytics/students?limit=51`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [], pagination: EMPTY_PAGE.pagination });
    expect(tooMany.status).toBe(400);
    expect(listPublicApiCourseAnalyticsStudentsService).toHaveBeenCalledTimes(1);
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
