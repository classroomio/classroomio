import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZMemberEmailNotificationPreferencesUpdate } from '@cio/utils/validation/notifications';

import {
  getMemberEmailNotificationPreferences,
  updateMemberEmailNotificationPreferences
} from '@api/services/notification/member-email-notifications';

/**
 * Per-org personal email notification preferences for the authenticated member.
 *
 * GET /organization/member/email-notifications
 * PUT /organization/member/email-notifications
 */
export const organizationMemberEmailNotificationsRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const preferences = await getMemberEmailNotificationPreferences(user.id, orgId);

      return c.json({ success: true as const, data: preferences });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch email notification preferences');
    }
  })
  .put(
    '/',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZMemberEmailNotificationPreferencesUpdate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const preferences = c.req.valid('json');
        const updated = await updateMemberEmailNotificationPreferences(user.id, orgId, preferences);

        return c.json({ success: true as const, data: updated });
      } catch (error) {
        return handleError(c, error, 'Failed to update email notification preferences');
      }
    }
  );
