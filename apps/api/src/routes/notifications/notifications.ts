import { ZNotificationListQuery, ZNotificationParam } from '@cio/utils/validation/course-comment';
import {
  listMyNotifications,
  readAllMyNotifications,
  readMyNotification
} from '@api/services/notification/notifications';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { zValidator } from '@hono/zod-validator';

export const notificationsRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('query', ZNotificationListQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const query = c.req.valid('query');
      const page = await listMyNotifications(user.id, organizationId, query);

      return c.json({ success: true, data: page }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load notifications');
    }
  })
  .post('/read-all', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      await readAllMyNotifications(user.id, organizationId);

      return c.json({ success: true, data: { ok: true } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to mark notifications read');
    }
  })
  .post(
    '/:notificationId/read',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNotificationParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { notificationId } = c.req.valid('param');
        await readMyNotification(user.id, notificationId);

        return c.json({ success: true, data: { ok: true } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to mark notification read');
      }
    }
  );
