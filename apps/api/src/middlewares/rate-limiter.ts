import {
  DEFAULT_RATE_LIMITER_OPTIONS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  RATE_LIMIT_HEADERS
} from '@api/constants/rate-limiter';

import type { MiddlewareHandler } from 'hono';
import { RedisRateLimiter } from '@api/utils/redis/limiter';
import { userKeyGenerator } from '../utils/redis/key-generators';
import { env } from '@api/config/env';
import { redis } from '@api/utils/redis/redis';

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number | ((c: any) => number);
  keyGenerator?: (c: any) => string;
  skip?: (c: any) => boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

const defaultOptions: Required<RateLimiterOptions> = {
  ...DEFAULT_RATE_LIMITER_OPTIONS,
  keyGenerator: userKeyGenerator,
  skip: () => false
};

export const createRateLimiter = (options: RateLimiterOptions = {}): MiddlewareHandler => {
  const opts = { ...defaultOptions, ...options };

  return async (c, next) => {
    // Skip rate limiting if not in production
    if (env.NODE_ENV !== 'production' || opts.skip(c)) {
      return await next();
    }

    try {
      const maxRequests = typeof opts.maxRequests === 'function' ? opts.maxRequests(c) : opts.maxRequests;
      const limiter = new RedisRateLimiter(redis, opts.windowMs, maxRequests);

      // Generate rate limit key
      const key = opts.keyGenerator(c);

      // Check rate limit
      const result = await limiter.isAllowed(key);

      // Set rate limit headers
      if (opts.standardHeaders) {
        c.header(RATE_LIMIT_HEADERS.LIMIT, maxRequests.toString());
        c.header(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString());
        c.header(RATE_LIMIT_HEADERS.RESET, new Date(result.resetTime).toISOString());
      }

      if (opts.legacyHeaders) {
        c.header(RATE_LIMIT_HEADERS.LIMIT, maxRequests.toString());
        c.header(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString());
        c.header(RATE_LIMIT_HEADERS.RESET, Math.ceil(result.resetTime / 1000).toString());
      }

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

        if (opts.standardHeaders) {
          c.header(RATE_LIMIT_HEADERS.RETRY_AFTER, retryAfter.toString());
        }

        return c.json(
          {
            error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
            message: opts.message,
            retryAfter
          },
          HTTP_STATUS.TOO_MANY_REQUESTS
        );
      }

      await next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If Redis is down, allow the request but log the error
      await next();
    }
  };
};

// Default rate limiter middleware with standard configuration
export default createRateLimiter({
  maxRequests: (c) =>
    c.req.path === '/api/auth/get-session'
      ? DEFAULT_RATE_LIMITER_OPTIONS.maxRequests * 3
      : DEFAULT_RATE_LIMITER_OPTIONS.maxRequests
});
