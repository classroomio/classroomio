import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1' });
    c.set('orgRoles', { 'org-own': 1 });
    await next();
  }
}));

vi.mock('@api/services/dash', () => ({
  getCurrentUserLoginStreak: vi.fn(),
  getOrganisationAnalytics: vi.fn().mockResolvedValue({}),
  getStudentLoginActivity: vi.fn().mockResolvedValue([])
}));

vi.mock('@api/services/course/compliance', () => ({
  getOrgComplianceOverview: vi.fn().mockResolvedValue({})
}));

vi.mock('@api/services/analytics', () => ({
  getCountryBreakdown: vi.fn().mockResolvedValue([]),
  getCourseFunnel: vi.fn().mockResolvedValue({ steps: [] }),
  getLandingStats: vi.fn().mockResolvedValue({}),
  getPopularTypes: vi.fn().mockResolvedValue([]),
  getTopCoursesByViews: vi.fn().mockResolvedValue([]),
  ingestEventBatch: vi.fn()
}));

import { getOrganisationAnalytics, getStudentLoginActivity } from '@api/services/dash';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import { getCountryBreakdown, getCourseFunnel, getLandingStats, getPopularTypes } from '@api/services/analytics';
import { dashAnalyticsRouter } from '@api/routes/dash';

const OWN_ORG = 'org-own';
const OTHER_ORG = '99999999-9999-4999-8999-999999999999';

const get = (path: string) => dashAnalyticsRouter.request(path, { headers: { 'cio-org-id': OWN_ORG } });

describe('dash analytics routes read the org verified by the middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores a query orgId or siteName that differs from the verified header org', async () => {
    await get(`/stats?orgId=${OTHER_ORG}`);
    await get('/stats?siteName=someone-else');

    expect(getOrganisationAnalytics).toHaveBeenNthCalledWith(1, OWN_ORG, undefined, false);
    expect(getOrganisationAnalytics).toHaveBeenNthCalledWith(2, OWN_ORG, undefined, false);
  });

  it.each([
    ['/landing-stats', getLandingStats],
    ['/country-breakdown', getCountryBreakdown],
    ['/popular-types', getPopularTypes]
  ])('%s uses the verified org', async (path, service) => {
    const response = await get(`${path}?orgId=${OTHER_ORG}`);

    expect(response.status).toBe(200);
    expect(service).toHaveBeenCalledWith(OWN_ORG, 30, false);
  });

  it('/course-funnel uses the verified org', async () => {
    await get(`/course-funnel?orgId=${OTHER_ORG}`);

    expect(getCourseFunnel).toHaveBeenCalledWith(OWN_ORG, 30, undefined, false);
  });

  it('/login-activity and /compliance-overview use the verified org', async () => {
    await get(`/login-activity?orgId=${OTHER_ORG}`);
    await get(`/compliance-overview?orgId=${OTHER_ORG}`);

    expect(getStudentLoginActivity).toHaveBeenCalledWith(OWN_ORG, 90);
    expect(getOrgComplianceOverview).toHaveBeenCalledWith(OWN_ORG);
  });

  it('still rejects a header org the user does not belong to', async () => {
    const response = await dashAnalyticsRouter.request(`/landing-stats?orgId=${OTHER_ORG}`, {
      headers: { 'cio-org-id': OTHER_ORG }
    });

    expect(response.status).toBe(403);
    expect(getLandingStats).not.toHaveBeenCalled();
  });
});
