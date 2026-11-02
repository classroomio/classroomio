import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import {
  deleteNotification,
  listNotifications,
  readAllNotifications,
  readNotification,
  unreadNotification
} from '@api/services/notification/notification-center';
import { zValidator } from '@hono/zod-validator';
import { ZNotificationIdParam, ZNotificationListQuery } from '@cio/utils/validation/notifications';

export const accountNotificationsRouter = new Hono()
  /**
   * GET /account/notifications
   * The signed-in user's notifications in the active organization, newest first, with the unread count.
   */
  .get(
    '/notifications',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('query', ZNotificationListQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const query = c.req.valid('query');
        const data = await listNotifications(user.id, orgId, query);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch notifications');
      }
    }
  )
  /**
   * POST /account/notifications/read-all
   * Marks every notification in the active organization read.
   */
  .post('/notifications/read-all', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await readAllNotifications(user.id, orgId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to mark notifications read');
    }
  })
  /**
   * POST /account/notifications/:notificationId/read
   * Marks one notification read and returns the new unread count.
   */
  .post(
    '/notifications/:notificationId/read',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNotificationIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { notificationId } = c.req.valid('param');
        const data = await readNotification(user.id, orgId, notificationId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to mark notification read');
      }
    }
  )
  /**
   * POST /account/notifications/:notificationId/unread
   * Marks one notification unread and returns the new unread count.
   */
  .post(
    '/notifications/:notificationId/unread',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNotificationIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { notificationId } = c.req.valid('param');
        const data = await unreadNotification(user.id, orgId, notificationId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to mark notification unread');
      }
    }
  )
  /**
   * DELETE /account/notifications/:notificationId
   * Deletes one of the signed-in user's notifications and returns the new unread count.
   */
  .delete(
    '/notifications/:notificationId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNotificationIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { notificationId } = c.req.valid('param');
        const data = await deleteNotification(user.id, orgId, notificationId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete notification');
      }
    }
  );
