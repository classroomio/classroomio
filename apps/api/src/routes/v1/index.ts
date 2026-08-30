import {
  DEFAULT_MAX_REQUESTS,
  DEFAULT_WINDOW_MS,
  PUBLIC_API_FAILED_AUTH_MAX_REQUESTS
} from '@api/constants/rate-limiter';
import { Hono } from '@api/utils/hono';
import { automationKeyMiddleware } from '@api/middlewares/automation-key';
import { automationKeyScopesMiddleware } from '@api/middlewares/automation-key-scopes';
import { createAuthenticationFailureRateLimiter, createRateLimiter } from '@api/middlewares/rate-limiter';
import { publicApiCors } from '@api/middlewares/cors';
import { publicApiFailedAuthKeyGenerator, publicApiKeyGenerator } from '@api/utils/redis/key-generators';
import { v1AudienceRouter } from './audience';
import { v1CoursesRouter } from './courses';

export const v1Router = new Hono()
  .use('*', publicApiCors)
  .use(
    '*',
    createAuthenticationFailureRateLimiter({
      maxRequests: PUBLIC_API_FAILED_AUTH_MAX_REQUESTS,
      windowMs: DEFAULT_WINDOW_MS,
      keyGenerator: publicApiFailedAuthKeyGenerator
    })
  )
  .use('*', automationKeyMiddleware)
  .use('*', automationKeyScopesMiddleware(['public_api:*']))
  .use(
    '*',
    createRateLimiter({
      maxRequests: DEFAULT_MAX_REQUESTS,
      windowMs: DEFAULT_WINDOW_MS,
      keyGenerator: publicApiKeyGenerator
    })
  )
  .route('/audience', v1AudienceRouter)
  .route('/courses', v1CoursesRouter);
