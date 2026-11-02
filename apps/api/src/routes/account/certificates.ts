import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { listLearnerCertificates } from '@api/services/course/learner-certificates';
import { orgMemberMiddleware } from '@api/middlewares/org-member';

export const accountCertificatesRouter = new Hono()
  /**
   * GET /account/certificates
   * Certificates the signed-in learner has earned in the organization, and the ones still to earn.
   */
  .get('/certificates', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await listLearnerCertificates(orgId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch certificates');
    }
  });
