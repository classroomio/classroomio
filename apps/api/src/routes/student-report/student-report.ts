import { ZStudentReportToken } from '@cio/utils/validation/student-report';
import { getPublicStudentReport } from '@api/services/student-report/student-report';

import { Hono } from '@api/utils/hono';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { extractClientIp } from '@api/utils/redis/key-generators';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const publicReportRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 30,
  message: 'Too many requests. Please try again shortly.',
  keyGenerator: (c) => `student_report_view:${extractClientIp(c)}`,
  failClosed: true
});

/** The unauthenticated view behind a report share link. */
export const studentReportPublicRouter = new Hono().get(
  '/:token',
  publicReportRateLimit,
  zValidator('param', ZStudentReportToken),
  async (c) => {
    c.header('Cache-Control', 'private, no-store');
    c.header('X-Robots-Tag', 'noindex, nofollow');
    c.header('Referrer-Policy', 'no-referrer');

    try {
      const { token } = c.req.valid('param');
      const data = await getPublicStudentReport(token);

      return c.json({ success: true as const, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load report');
    }
  }
);
