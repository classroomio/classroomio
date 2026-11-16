import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZMathNotationSettings } from '@cio/utils/validation/math';

import { getOrgMathNotationService, updateOrgMathNotationService } from '@api/services/math/notation';

export const organizationMathNotationRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const settings = await getOrgMathNotationService(orgId);

      return c.json({ success: true as const, data: settings });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch math notation settings');
    }
  })
  .put('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZMathNotationSettings), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const updated = await updateOrgMathNotationService(orgId, c.req.valid('json'));

      return c.json({ success: true as const, data: updated });
    } catch (error) {
      return handleError(c, error, 'Failed to update math notation settings');
    }
  });
