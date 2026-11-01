import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { getLearnerComplianceOverview } from '@api/services/course/compliance';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';

export const accountComplianceRouter = new Hono()
  /**
   * GET /account/compliance
   * The signed-in learner's compliance across the organization's compliance courses, ordered by urgency.
   */
  .get('/compliance', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await getLearnerComplianceOverview(orgId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch compliance');
    }
  });
