import {
  DEFAULT_RATE_LIMITER_OPTIONS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  RATE_LIMIT_HEADERS
} from '$src/constants/rate-limiter';

import type { MiddlewareHandler } from 'hono';
import { rateLimiter } from '$src/utils/redis/limiter';
import { userKeyGenerator } from '../utils/redis/key-generators';

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (c: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

const defaultOptions: Required<RateLimiterOptions> = {
  ...DEFAULT_RATE_LIMITER_OPTIONS,
  keyGenerator: userKeyGenerator
};

export const createRateLimiter = (options: RateLimiterOptions = {}): MiddlewareHandler => {
  const opts = { ...defaultOptions, ...options };

  return async (c, next) => {
    try {
      // Generate rate limit key
      const key = opts.keyGenerator(c);

      // Check rate limit
      const result = await rateLimiter.isAllowed(key);

      // Set rate limit headers
      if (opts.standardHeaders) {
        c.header(RATE_LIMIT_HEADERS.LIMIT, opts.maxRequests.toString());
        c.header(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString());
        c.header(RATE_LIMIT_HEADERS.RESET, new Date(result.resetTime).toISOString());
      }

      if (opts.legacyHeaders) {
        c.header(RATE_LIMIT_HEADERS.LIMIT, opts.maxRequests.toString());
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
export const rateLimiterMiddleware = createRateLimiter();
