import { Hono } from '@api/utils/hono';
import { ZDashStats } from '@cio/utils/validation/dash';
import { authMiddleware } from '@api/middlewares/auth';
import { getOrganisationAnalytics } from '@api/services/dash';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const dashAnalyticsRouter = new Hono().post(
  '/stats',
  authMiddleware,
  zValidator('json', ZDashStats),
  async (c) => {
    try {
      const { orgId, siteName } = c.req.valid('json');

      const result = await getOrganisationAnalytics(orgId, siteName);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to load organisation analytics');
    }
  }
);
