import { Hono } from '@api/utils/hono';
import { ZDashStats } from '@cio/utils/validation/dash';
import { authMiddleware } from '@api/middlewares/auth';
import { getOrganisationAnalytics } from '@api/services/dash';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';
import { cacheResponseMiddleware } from '@api/middlewares/cache';

const cacheResponse = cacheResponseMiddleware({
  ttlSeconds: 300,
  keyGenerator: (c) => {
    const orgId = c.req.query('orgId');
    const siteName = c.req.query('siteName');
    if (!orgId) return null;
    return `dash:stats:${orgId}:${siteName || 'default'}`;
  },
  indexKey: (c) => c.req.query('orgId') ?? null,
})

export const dashAnalyticsRouter = new Hono().get(
  '/stats',
  authMiddleware,
  orgMemberMiddleware,
  zValidator('query', ZDashStats),
  cacheResponse,

  async (c) => {
    try {
      const { orgId, siteName } = c.req.valid('query');
      const result = await getOrganisationAnalytics(orgId, siteName);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load organisation analytics');
    }
  }
);
