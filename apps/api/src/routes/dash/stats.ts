import { Hono } from '@api/utils/hono';
import {
  ZDashAnalyticsRange,
  ZDashComplianceOverview,
  ZDashCourseFunnel,
  ZDashStats,
  ZIngestBatch,
  ZLoginActivity
} from '@cio/utils/validation/dash';
import { authMiddleware } from '@api/middlewares/auth';
import { getCurrentUserLoginStreak, getOrganisationAnalytics, getStudentLoginActivity } from '@api/services/dash';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';
import {
  getCountryBreakdown,
  getCourseFunnel,
  getLandingStats,
  getPopularTypes,
  ingestEventBatch
} from '@api/services/analytics';

export const dashAnalyticsRouter = new Hono()
  .post('/track', zValidator('json', ZIngestBatch), async (c) => {
    try {
      const batch = c.req.valid('json');
      const user = c.get('user');

      const result = await ingestEventBatch(batch, {
        country: c.req.header('cf-ipcountry') ?? c.req.header('CF-IPCountry') ?? null,
        userAgent: c.req.header('user-agent') ?? null,
        userId: user?.id ?? null
      });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to ingest analytics events');
    }
  })
  .get('/stats', authMiddleware, orgMemberMiddleware, zValidator('query', ZDashStats), async (c) => {
    try {
      const { orgId, siteName } = c.req.valid('query');

      const result = await getOrganisationAnalytics(orgId, siteName);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load organisation analytics');
    }
  })
  .get('/login-activity', authMiddleware, orgAdminMiddleware, zValidator('query', ZLoginActivity), async (c) => {
    try {
      const { orgId, days } = c.req.valid('query');

      const result = await getStudentLoginActivity(orgId!, days);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load login activity');
    }
  })
  .get('/login-streak', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const result = await getCurrentUserLoginStreak(user.id);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load login streak');
    }
  })
  .get('/landing-stats', authMiddleware, orgMemberMiddleware, zValidator('query', ZDashAnalyticsRange), async (c) => {
    try {
      const { orgId, days } = c.req.valid('query');
      const bust = c.req.query('bust') === '1';
      const result = await getLandingStats(orgId, days, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load landing stats');
    }
  })
  .get(
    '/country-breakdown',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('query', ZDashAnalyticsRange),
    async (c) => {
      try {
        const { orgId, days } = c.req.valid('query');
        const bust = c.req.query('bust') === '1';
        const result = await getCountryBreakdown(orgId, days, bust);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load country breakdown');
      }
    }
  )
  .get('/course-funnel', authMiddleware, orgMemberMiddleware, zValidator('query', ZDashCourseFunnel), async (c) => {
    try {
      const { orgId, days, courseId } = c.req.valid('query');
      const bust = c.req.query('bust') === '1';
      const result = await getCourseFunnel(orgId, days, courseId, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load course funnel');
    }
  })
  .get('/popular-types', authMiddleware, orgMemberMiddleware, zValidator('query', ZDashAnalyticsRange), async (c) => {
    try {
      const { orgId, days } = c.req.valid('query');
      const bust = c.req.query('bust') === '1';
      const result = await getPopularTypes(orgId, days, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load popular course types');
    }
  })
  .get(
    '/compliance-overview',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('query', ZDashComplianceOverview),
    async (c) => {
      try {
        const { orgId } = c.req.valid('query');
        const result = await getOrgComplianceOverview(orgId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load compliance overview');
      }
    }
  );
