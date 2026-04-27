import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { getPublishedWidgetPayload } from '@api/services/widget';
import { ZWidgetPublicKeyParams } from '@cio/utils/validation/widget';
import { zValidator } from '@hono/zod-validator';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { DEFAULT_WINDOW_MS } from '@api/constants/rate-limiter';

const widgetPayloadIpLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: DEFAULT_WINDOW_MS,
  keyGenerator: (c) =>
    `widget_payload_ip:${c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'}`
});

const widgetPayloadKeyLimiter = createRateLimiter({
  maxRequests: 1000,
  windowMs: DEFAULT_WINDOW_MS,
  keyGenerator: (c) => `widget_payload_key:${c.req.param('publicKey')}`
});

export const publicWidgetsRouter = new Hono().get(
  '/:publicKey/payload',
  zValidator('param', ZWidgetPublicKeyParams),
  widgetPayloadIpLimiter,
  widgetPayloadKeyLimiter,
  async (c) => {
    try {
      const { publicKey } = c.req.valid('param');
      const payload = await getPublishedWidgetPayload(publicKey);

      c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

      return c.json({ success: true, data: payload });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch widget payload');
    }
  }
);
