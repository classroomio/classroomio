import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { getDetailedUsage } from '@api/services/agent/usage';

/**
 * GET /agent/usage
 * Returns detailed usage stats for the current org:
 * used, allowance, creditBalance, remaining, and daily history for the current month.
 */
export const agentUsageRouter = new Hono().get('/usage', authMiddleware, orgMemberMiddleware, async (c) => {
  try {
    const orgId = c.req.header('cio-org-id')!;
    const usage = await getDetailedUsage(orgId);

    return c.json({ success: true, data: usage });
  } catch (error) {
    return handleError(c, error, 'Failed to fetch usage stats');
  }
});
