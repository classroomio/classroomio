import { Hono } from '@api/utils/hono';
import { ZDashStats } from '@cio/utils/validation/dash';
import { authMiddleware } from '@api/middlewares/auth';
import { getOrganisationAnalytics } from '@api/services/dash';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const dashAnalyticsRouter = new Hono().get(
  '/stats',
  authMiddleware,
  orgMemberMiddleware,
  zValidator('query', ZDashStats),
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
