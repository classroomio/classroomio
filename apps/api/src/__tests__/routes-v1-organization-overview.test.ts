import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/v1/organization/overview', () => ({
  getPublicApiOrganizationOverviewService: vi.fn()
}));

vi.mock('@api/services/v1/organization/organization', () => ({
  getOrganizationService: vi.fn(),
  updateOrganizationService: vi.fn(),
  deleteOrganizationService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getPublicApiOrganizationOverviewService } from '@api/services/v1/organization/overview';
import { v1OrganizationOverviewRouter } from '@api/routes/v1/organization/overview';

const OVERVIEW_RESULT = {
  data: { summary: { totalStudents: 3 } },
  meta: { include: ['summary'], days: 30, limit: 5, omitted: [], generatedAt: '2026-09-27T10:00:00.000Z' }
};

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/organization/overview', v1OrganizationOverviewRouter);

describe('GET /organization/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the summary section with data, meta and a no-store cache header', async () => {
    vi.mocked(getPublicApiOrganizationOverviewService).mockResolvedValue(OVERVIEW_RESULT as never);

    const response = await app.request('/organization/overview');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, ...OVERVIEW_RESULT });
    expect(getPublicApiOrganizationOverviewService).toHaveBeenCalledWith('org-1', 'actor-1', {
      include: ['summary'],
      days: 30,
      limit: 5
    });
  });

  it('parses a comma-separated include with days and limit', async () => {
    vi.mocked(getPublicApiOrganizationOverviewService).mockResolvedValue(OVERVIEW_RESULT as never);

    await app.request('/organization/overview?include=summary,%20loginActivity&days=90&limit=10');

    expect(getPublicApiOrganizationOverviewService).toHaveBeenCalledWith('org-1', 'actor-1', {
      include: ['summary', 'loginActivity'],
      days: 90,
      limit: 10
    });
  });

  it.each(['days=14', 'days=abc', 'include=overview', 'include=traffic', 'include=', 'limit=0', 'limit=21'])(
    'rejects %s with 400',
    async (query) => {
      const response = await app.request(`/organization/overview?${query}`);

      expect(response.status).toBe(400);
      expect(getPublicApiOrganizationOverviewService).not.toHaveBeenCalled();
    }
  );

  it('returns 403 when the service rejects the actor', async () => {
    vi.mocked(getPublicApiOrganizationOverviewService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await app.request('/organization/overview');

    expect(response.status).toBe(403);
  });
});
