import { randomUUID } from 'crypto';
import { Hono } from '@api/utils/hono';
import { AppError } from '@api/utils/errors';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { pluginApiAuthMiddleware } from '@api/middlewares/plugin-api-auth';
import { pluginApiAuthorizationMiddleware } from '@api/middlewares/plugin-api-authorization';
import { pluginApiRequestSizeMiddleware } from '@api/middlewares/plugin-api-request-size';
import { pluginApiKeyGenerator } from '@api/utils/redis/key-generators';
import { pluginApiV1Router } from './v1';
import { handlePluginApiError } from './errors';
import type { MiddlewareHandler } from 'hono';
import type { AuthSession } from '@api/types/auth';

const basePluginApiRateLimiter = createRateLimiter({
  maxRequests: 120,
  windowMs: 60_000,
  keyGenerator: pluginApiKeyGenerator,
  message: 'Plugin API rate limit exceeded'
});

const pluginApiRateLimiter: MiddlewareHandler<AuthSession> = async (c, next) => {
  const response = await basePluginApiRateLimiter(c, next);
  if (!response || response.status !== 429) return response;

  const requestId = c.get('pluginApiRequestId')!;
  const retryAfter = Number(response.headers.get('retry-after') ?? '60');

  return c.json(
    {
      success: false as const,
      error: {
        code: 'rate_limited',
        message: 'Plugin API rate limit exceeded',
        retryable: true,
        details: { retryAfter }
      },
      requestId
    },
    429
  );
};

export const pluginApiRouter = new Hono()
  .use('*', async (c, next) => {
    c.set('pluginApiRequestId', randomUUID());
    await next();
  })
  .use('*', pluginApiRequestSizeMiddleware)
  .use('*', pluginApiAuthMiddleware)
  .use('*', pluginApiAuthorizationMiddleware)
  .use('*', pluginApiRateLimiter)
  .route('/v1', pluginApiV1Router)
  .notFound((c) =>
    handlePluginApiError(c, new AppError('Plugin API resource not found', 'NOT_FOUND', 404), 'Not found')
  );
