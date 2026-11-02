import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { getHomeDigest } from '@api/services/account/home-digest';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';

export const accountHomeDigestRouter = new Hono()
  /**
   * GET /account/home-digest
   * The signed-in learner's Home summary in the active organization: compliance due soon, overdue count and the next
   * live class.
   */
  .get('/home-digest', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await getHomeDigest(orgId, user.id);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load the home digest');
    }
  });
