import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { getLatestCourseBuildSummary } from '@cio/core/services/course-builder/build';

/**
 * Website course builds of an organization.
 *
 * GET /organization/course-build/latest — org admin only; the latest build's sources and courses, or null.
 */
export const organizationCourseBuildRouter = new Hono().get(
  '/latest',
  authMiddleware,
  orgAdminMiddleware,
  async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const summary = await getLatestCourseBuildSummary(orgId);

      return c.json({ success: true as const, data: summary });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch the course build');
    }
  }
);
