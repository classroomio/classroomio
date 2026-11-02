import { Hono } from '@api/utils/hono';
import { ZCheckInSubmit } from '@cio/utils/validation/attendance';
import { authMiddleware } from '@api/middlewares/auth';
import { checkInToLesson } from '@api/services/attendance/check-in';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { extractClientIp } from '@api/utils/redis/key-generators';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

const checkInRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  failClosed: true,
  message: 'Too many check-in attempts. Please try again later.',
  keyGenerator: (c) => {
    const user = c.get('user');

    return `check_in:${user?.id ?? extractClientIp(c)}`;
  }
});

export const accountCheckInRouter = new Hono()
  /**
   * POST /account/check-in
   * Checks the signed-in learner in to a live session lesson with the code their tutor shared.
   */
  .post(
    '/check-in',
    authMiddleware,
    orgMemberMiddleware,
    checkInRateLimit,
    zValidator('json', ZCheckInSubmit),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const input = c.req.valid('json');
        const data = await checkInToLesson(orgId, user.id, input);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to check in');
      }
    }
  );
