import { authMiddleware } from '@api/middlewares/auth';

import { handleError } from '@api/utils/errors';
import { ZDashStats } from '@cio/utils/validation/dash';
import { zValidator } from '@hono/zod-validator';
import { Hono } from '@api/utils/hono';
import { getOrganisationAnalytics } from '@api/services/dash';

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
