import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from '@api/services/notification/notification-preferences';
import { zValidator } from '@hono/zod-validator';
import { ROLE } from '@cio/utils/constants/roles';
import type { TNotificationAudienceRole } from '@cio/utils/constants/notifications';
import { ZNotificationPreferencesUpdate } from '@cio/utils/validation/notifications';

function audienceRoleOf(orgRoles: unknown, orgId: string): TNotificationAudienceRole {
  const roleId = ((orgRoles as Record<string, number> | undefined) ?? {})[orgId];
  if (roleId === ROLE.ADMIN) return 'admin';
  if (roleId === ROLE.TUTOR) return 'tutor';

  return 'student';
}

export const accountNotificationPreferencesRouter = new Hono()
  /**
   * GET /account/notification-preferences
   * Push, in-app and email switches per category for the caller's org role, and quiet hours. Email switches apply to
   * the active organization.
   */
  .get('/notification-preferences', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await getNotificationPreferences(user.id, orgId, audienceRoleOf(c.get('orgRoles'), orgId));

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
        const data = await updateNotificationPreferences(
          user.id,
          orgId,
          audienceRoleOf(c.get('orgRoles'), orgId),
          update
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update notification preferences');
      }
    }
  );
