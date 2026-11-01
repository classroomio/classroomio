import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from '@api/services/notification/notification-preferences';
import { zValidator } from '@hono/zod-validator';
import { ZNotificationPreferencesUpdate } from '@cio/utils/validation/notifications';

export const accountNotificationPreferencesRouter = new Hono()
  /**
   * GET /account/notification-preferences
   * Push, in-app and email switches per category, and quiet hours. Email switches apply to the active organization.
   */
  .get('/notification-preferences', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await getNotificationPreferences(user.id, orgId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch notification preferences');
    }
  })
  /**
   * PUT /account/notification-preferences
   * Updates the given category switches and quiet hours (null clears them). Returns the full preferences.
   */
  .put(
    '/notification-preferences',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZNotificationPreferencesUpdate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const update = c.req.valid('json');
        const data = await updateNotificationPreferences(user.id, orgId, update);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update notification preferences');
      }
    }
  );
