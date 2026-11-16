import { Hono } from '@api/utils/hono';
import { ZDashStats, ZIngestBatch, ZLoginActivity } from '@cio/utils/validation/dash';
import { authMiddleware } from '@api/middlewares/auth';
import { getCurrentUserLoginStreak, getOrganizationOverview, getStudentLoginActivity } from '@api/services/dash';
import { handleError } from '@api/utils/errors';
import { ingestEventBatch } from '@api/services/tracking';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const dashRouter = new Hono()
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
      const { bust } = c.req.valid('query');
      const orgId = c.get('orgId')!;

      const result = await getOrganizationOverview(orgId, undefined, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load organisation analytics');
    }
  })
  .get('/login-activity', authMiddleware, orgAdminMiddleware, zValidator('query', ZLoginActivity), async (c) => {
    try {
      const { days } = c.req.valid('query');
      const orgId = c.req.header('cio-org-id')!;

      const result = await getStudentLoginActivity(orgId, days);

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
