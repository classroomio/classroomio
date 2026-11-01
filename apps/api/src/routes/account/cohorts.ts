import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { getOrgEnrolledCohorts } from '@api/services/cohort/cohort';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';

export const accountCohortsRouter = new Hono()
  /**
   * GET /account/cohorts
   * Cohorts the signed-in user belongs to in the active organization, with course and student counts.
   */
  .get('/cohorts', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await getOrgEnrolledCohorts(orgId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load cohorts');
    }
  });
