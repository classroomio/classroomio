import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/v1/analytics', () => ({
  getPublicApiAnalyticsCatalogService: vi.fn(),
  queryPublicApiAnalyticsService: vi.fn(),
  getPublicApiAnalyticsSnapshotService: vi.fn(),
  listPublicApiAnalyticsStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/marketing', () => ({
  getPublicApiMarketingAnalyticsService: vi.fn(),
  getPublicApiCourseMarketingService: vi.fn()
}));

vi.mock('@api/services/v1/compliance', () => ({
  getPublicApiComplianceAnalyticsService: vi.fn(),
  listPublicApiComplianceStudentsService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getPublicApiCourseMarketingService, getPublicApiMarketingAnalyticsService } from '@api/services/v1/marketing';
import { v1AnalyticsRouter } from '@api/routes/v1/analytics';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MARKETING_RESULT = {
  data: { traffic: { totals: { landingViews: 3 }, sparkline: [] } },
  meta: { include: ['traffic'], days: 30, limit: 5, generatedAt: '2026-09-27T10:00:00.000Z' }
};

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/analytics', v1AnalyticsRouter);

describe('GET /analytics/marketing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the traffic section with data, meta and a no-store cache header', async () => {
    vi.mocked(getPublicApiMarketingAnalyticsService).mockResolvedValue(MARKETING_RESULT as never);

    const response = await app.request('/analytics/marketing');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, ...MARKETING_RESULT });
    expect(getPublicApiMarketingAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', {
      include: ['traffic'],
      days: 30,
      limit: 5
    });
  });

  it('parses a comma-separated include with days and limit', async () => {
    vi.mocked(getPublicApiMarketingAnalyticsService).mockResolvedValue(MARKETING_RESULT as never);

    await app.request('/analytics/marketing?include=countries,%20funnel,courseTypes,topCourses&days=90&limit=10');

    expect(getPublicApiMarketingAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', {
      include: ['countries', 'funnel', 'courseTypes', 'topCourses'],
      days: 90,
      limit: 10
    });
  });

  it.each([
    'days=14',
    'days=0',
    'days=abc',
    'include=bogus',
    'include=overview',
    'include=compliance',
    'include=',
    'limit=0',
    'limit=21'
  ])('rejects %s with 400', async (query) => {
    const response = await app.request(`/analytics/marketing?${query}`);

    expect(response.status).toBe(400);
    expect(getPublicApiMarketingAnalyticsService).not.toHaveBeenCalled();
  });

  it('returns 403 when the service rejects the actor', async () => {
    vi.mocked(getPublicApiMarketingAnalyticsService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await app.request('/analytics/marketing');

    expect(response.status).toBe(403);
  });
});

describe('GET /analytics/marketing/courses/:courseId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the course funnel with its meta and passes the params and days', async () => {
    const result = {
      data: { steps: [] },
      meta: { days: 7, generatedAt: '2026-09-27T10:00:00.000Z' }
    };
    vi.mocked(getPublicApiCourseMarketingService).mockResolvedValue(result as never);

    const response = await app.request(`/analytics/marketing/courses/${COURSE_ID}?days=7`);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, ...result });
    expect(getPublicApiCourseMarketingService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { days: 7 }
    );
  });

  it('defaults days to 30', async () => {
    vi.mocked(getPublicApiCourseMarketingService).mockResolvedValue({ data: {}, meta: {} } as never);

    await app.request(`/analytics/marketing/courses/${COURSE_ID}`);

    expect(getPublicApiCourseMarketingService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { days: 30 }
    );
  });

  it.each([
    ['a non-uuid courseId', '/analytics/marketing/courses/nope'],
    ['days=14', `/analytics/marketing/courses/${COURSE_ID}?days=14`]
  ])('rejects %s with 400', async (_name, path) => {
    const response = await app.request(path);

    expect(response.status).toBe(400);
    expect(getPublicApiCourseMarketingService).not.toHaveBeenCalled();
  });

  it('maps a course outside the organization to 404', async () => {
    vi.mocked(getPublicApiCourseMarketingService).mockRejectedValue(
      new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404)
    );

    const response = await app.request(`/analytics/marketing/courses/${COURSE_ID}`);

    expect(response.status).toBe(404);
  });
});
