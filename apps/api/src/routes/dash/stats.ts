import { Hono } from '@api/utils/hono';
import { ZDashStats, ZLoginActivity } from '@cio/utils/validation/dash';
import { authMiddleware } from '@api/middlewares/auth';
import { getCurrentUserLoginStreak, getOrganisationAnalytics, getStudentLoginActivity } from '@api/services/dash';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const dashAnalyticsRouter = new Hono()
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
  });
