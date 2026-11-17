import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { createRateLimiter, isTrustedServerApiKeyRequest } from '@api/middlewares/rate-limiter';
import { getVerifyCertificatePublicView } from '@api/services/certificate/verify';
import { getConnInfo } from '@hono/node-server/conninfo';

const verifyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyGenerator: (c) => {
    if (isTrustedServerApiKeyRequest(c)) {
      const visitorIp = c.req.header('x-visitor-ip')?.trim();
      if (visitorIp) return `verify:${visitorIp}`;
    }

    const conn = getConnInfo(c);
    const remote = conn.remote.address?.replace(/^::ffff:/, '') ?? 'unknown';
    return `verify:${remote}`;
  },
  standardHeaders: true
});

export const verifyRouter = new Hono().use('*', verifyRateLimiter).get('/:code', async (c) => {
  try {
    const rawCode = c.req.param('code');

    const data = await getVerifyCertificatePublicView(rawCode);

    if (!data) {
      return c.json(
        {
          success: false as const,
          error: 'Certificate not found',
          code: 'NOT_FOUND'
        },
        404
      );
    }

    return c.json({ success: true as const, data });
  } catch (error) {
    return handleError(c, error, 'Failed to verify certificate');
  }
});
