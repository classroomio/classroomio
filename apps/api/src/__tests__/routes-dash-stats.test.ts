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
  getOrganizationOverview: vi.fn().mockResolvedValue({}),
  getStudentLoginActivity: vi.fn().mockResolvedValue([])
}));

vi.mock('@api/services/course/compliance', () => ({
  getOrgComplianceOverview: vi.fn().mockResolvedValue({})
}));

vi.mock('@api/services/marketing', () => ({
  getCountryBreakdown: vi.fn().mockResolvedValue([]),
  getCourseFunnel: vi.fn().mockResolvedValue({ steps: [] }),
  getLandingStats: vi.fn().mockResolvedValue({}),
  getPopularTypes: vi.fn().mockResolvedValue([]),
  getTopCoursesByViews: vi.fn().mockResolvedValue([])
}));

vi.mock('@api/services/tracking', () => ({
  ingestEventBatch: vi.fn()
}));

import { getOrganizationOverview, getStudentLoginActivity } from '@api/services/dash';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import {
  getCountryBreakdown,
  getCourseFunnel,
  getLandingStats,
  getPopularTypes,
  getTopCoursesByViews
} from '@api/services/marketing';
import { dashRouter } from '@api/routes/dash';
import { marketingRouter } from '@api/routes/marketing';
import { orgComplianceRouter } from '@api/routes/compliance';

const OWN_ORG = 'org-own';
const OTHER_ORG = '99999999-9999-4999-8999-999999999999';

const request = (router: { request: typeof dashRouter.request }, path: string, orgId = OWN_ORG) =>
  router.request(path, { headers: { 'cio-org-id': orgId } });

describe('dash routes read the org verified by the middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores a query orgId or siteName that differs from the verified header org', async () => {
    await request(dashRouter, `/stats?orgId=${OTHER_ORG}`);
    await request(dashRouter, '/stats?siteName=someone-else');

    expect(getOrganizationOverview).toHaveBeenNthCalledWith(1, OWN_ORG, undefined, false);
    expect(getOrganizationOverview).toHaveBeenNthCalledWith(2, OWN_ORG, undefined, false);
  });

  it('/login-activity uses the verified org', async () => {
    await request(dashRouter, `/login-activity?orgId=${OTHER_ORG}`);

    expect(getStudentLoginActivity).toHaveBeenCalledWith(OWN_ORG, 90);
  });

  it('no longer serves the marketing and compliance reads', async () => {
    const paths = ['/landing-stats', '/country-breakdown', '/course-funnel', '/popular-types', '/compliance-overview'];

    for (const path of paths) {
      const response = await request(dashRouter, path);

      expect(response.status).toBe(404);
    }
  });
});

describe('marketing routes read the org verified by the middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['/landing-stats', getLandingStats],
    ['/country-breakdown', getCountryBreakdown],
    ['/popular-types', getPopularTypes]
  ])('%s uses the verified org', async (path, service) => {
    const response = await request(marketingRouter, `${path}?orgId=${OTHER_ORG}`);

    expect(response.status).toBe(200);
    expect(service).toHaveBeenCalledWith(OWN_ORG, 30, false);
  });

  it('/course-funnel uses the verified org', async () => {
    await request(marketingRouter, `/course-funnel?orgId=${OTHER_ORG}`);

    expect(getCourseFunnel).toHaveBeenCalledWith(OWN_ORG, 30, undefined, false);
  });

  it('/top-courses uses the verified org', async () => {
    const response = await request(marketingRouter, `/top-courses?orgId=${OTHER_ORG}`);

    expect(response.status).toBe(200);
    expect(getTopCoursesByViews).toHaveBeenCalledWith(OWN_ORG, 30, false);
  });

  it('still rejects a header org the user does not belong to', async () => {
    const response = await request(marketingRouter, `/landing-stats?orgId=${OTHER_ORG}`, OTHER_ORG);

    expect(response.status).toBe(403);
    expect(getLandingStats).not.toHaveBeenCalled();
  });
});

describe('org compliance routes read the org verified by the middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('/overview uses the verified org', async () => {
    const response = await request(orgComplianceRouter, `/overview?orgId=${OTHER_ORG}`);

    expect(response.status).toBe(200);
    expect(getOrgComplianceOverview).toHaveBeenCalledWith(OWN_ORG);
  });

  it('still rejects a header org the user does not belong to', async () => {
    const response = await request(orgComplianceRouter, '/overview', OTHER_ORG);

    expect(response.status).toBe(403);
    expect(getOrgComplianceOverview).not.toHaveBeenCalled();
  });
});
