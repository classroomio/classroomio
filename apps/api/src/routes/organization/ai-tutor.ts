import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZAiTutorSettingsUpdate } from '@cio/utils/validation/agent';

import { getResolvedOrgAiTutorSettings, updateOrgAiTutorSettingsService } from '@api/services/agent/tutor-config';

/**
 * Org-level AI tutor configuration.
 *
 * GET /organization/ai-tutor  — any org member can read the resolved settings.
 * PUT /organization/ai-tutor  — org admin only; merges the patch into stored settings.
 */
export const organizationAiTutorRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const settings = await getResolvedOrgAiTutorSettings(orgId);

      return c.json({ success: true as const, data: settings });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch AI tutor settings');
    }
  })
  .put('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZAiTutorSettingsUpdate), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const patch = c.req.valid('json');
      const updated = await updateOrgAiTutorSettingsService(orgId, patch);

      return c.json({ success: true as const, data: updated });
    } catch (error) {
      return handleError(c, error, 'Failed to update AI tutor settings');
    }
  });
