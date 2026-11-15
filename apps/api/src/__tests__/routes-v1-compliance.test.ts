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
import {
  getPublicApiComplianceAnalyticsService,
  listPublicApiComplianceStudentsService
} from '@api/services/v1/compliance';
import { v1AnalyticsRouter } from '@api/routes/v1/analytics';

const EMPTY_PAGE = { items: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } };
const COMPLIANCE_RESULT = {
  data: { summary: { totalStudents: 3, totalCourses: 1, counts: {} }, courses: [] },
  meta: { generatedAt: '2026-09-27T10:00:00.000Z' }
};

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/analytics', v1AnalyticsRouter);

describe('GET /analytics/compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the summary and courses with meta and a no-store cache header', async () => {
    vi.mocked(getPublicApiComplianceAnalyticsService).mockResolvedValue(COMPLIANCE_RESULT as never);

    const response = await app.request('/analytics/compliance');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, ...COMPLIANCE_RESULT });
    expect(getPublicApiComplianceAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1');
  });

  it('returns 403 when the service rejects the actor', async () => {
    vi.mocked(getPublicApiComplianceAnalyticsService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await app.request('/analytics/compliance');

    expect(response.status).toBe(403);
  });
});

describe('GET /analytics/compliance/students', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('paginates compliance students', async () => {
    vi.mocked(listPublicApiComplianceStudentsService).mockResolvedValue(EMPTY_PAGE as never);

    const response = await app.request('/analytics/compliance/students?page=2&limit=5');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [], pagination: EMPTY_PAGE.pagination });
    expect(listPublicApiComplianceStudentsService).toHaveBeenCalledWith('org-1', 'actor-1', { page: 2, limit: 5 });
  });

  it('rejects a limit over 100', async () => {
    const response = await app.request('/analytics/compliance/students?limit=101');

    expect(response.status).toBe(400);
    expect(listPublicApiComplianceStudentsService).not.toHaveBeenCalled();
  });

  it('no longer answers the learners path', async () => {
    const response = await app.request('/analytics/compliance/learners');

    expect(response.status).toBe(404);
  });
});
