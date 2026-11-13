import { Hono } from '@api/utils/hono';
import { ZComplianceOverview } from '@cio/utils/validation/compliance';
import { authMiddleware } from '@api/middlewares/auth';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

export const orgComplianceRouter = new Hono().get(
  '/overview',
  authMiddleware,
  orgAdminMiddleware,
  zValidator('query', ZComplianceOverview),
  async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const result = await getOrgComplianceOverview(orgId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load compliance overview');
    }
  }
);
