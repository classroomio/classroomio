import { ZCreateContentReport } from '@cio/utils/validation/report';
import { submitContentReport } from '@api/services/report';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

const createReportRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many reports. Please try again later.',
  keyGenerator: (c) => `content_report:${c.get('user')?.id ?? 'anonymous'}`
});

export const reportRouter = new Hono().post(
  '/',
  authMiddleware,
  orgMemberMiddleware,
  createReportRateLimit,
  zValidator('json', ZCreateContentReport),
  async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const payload = c.req.valid('json');
      const result = await submitContentReport({
        orgId,
        reporterId: user.id,
        payload
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to submit report');
    }
  }
);
