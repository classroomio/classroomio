import {
  DEFAULT_RATE_LIMITER_OPTIONS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  RATE_LIMIT_HEADERS
} from '@api/constants/rate-limiter';

import type { Context, MiddlewareHandler } from 'hono';
import { RedisRateLimiter, type RateLimitResult } from '@api/utils/redis/limiter';
import { userKeyGenerator } from '../utils/redis/key-generators';
import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

/** Dashboard SSR and other internal callers authenticate with PRIVATE_SERVER_KEY. */
export function isTrustedServerApiKeyRequest(c: Context): boolean {
  const expectedKey = env.PRIVATE_SERVER_KEY;
  if (!expectedKey) return false;

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  return authHeader.slice('Bearer '.length).trim() === expectedKey;
}

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

function setRateLimitHeaders(c: Context, maxRequests: number, result: RateLimitResult): void {
  c.header(RATE_LIMIT_HEADERS.LIMIT, maxRequests.toString());
  c.header(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString());
  c.header(RATE_LIMIT_HEADERS.RESET, new Date(result.resetTime).toISOString());
}

function createRateLimitResponse(
  c: Context,
  message: string,
  result: RateLimitResult,
  includeStandardHeaders: boolean
): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

  if (includeStandardHeaders) {
    c.header(RATE_LIMIT_HEADERS.RETRY_AFTER, retryAfter.toString());
  }

  return c.json(
    {
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      message,
      retryAfter
    },
    HTTP_STATUS.TOO_MANY_REQUESTS
  );
}

export const createRateLimiter = (options: RateLimiterOptions = {}): MiddlewareHandler => {
  const opts = { ...defaultOptions, ...options };

  return async (c, next) => {
    if (env.NODE_ENV !== 'production' || opts.skip(c)) {
      return await next();
    }

    try {
      const maxRequests = typeof opts.maxRequests === 'function' ? opts.maxRequests(c) : opts.maxRequests;
      const limiter = new RedisRateLimiter(redis, opts.windowMs, maxRequests);

      const key = opts.keyGenerator(c);
      const result = await limiter.isAllowed(key);

      if (opts.standardHeaders) {
        setRateLimitHeaders(c, maxRequests, result);
      }

      if (opts.legacyHeaders) {
        c.header(RATE_LIMIT_HEADERS.LIMIT, maxRequests.toString());
        c.header(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString());
        c.header(RATE_LIMIT_HEADERS.RESET, Math.ceil(result.resetTime / 1000).toString());
      }

      if (!result.allowed) {
        return createRateLimitResponse(c, opts.message, result, opts.standardHeaders);
      }

      await next();
    } catch (error) {
      logRedisUnavailableOnce('Redis rate limiter unavailable, allowing requests without rate limiting', error);
      await next();
    }
  };
};

export const createAuthenticationFailureRateLimiter = (options: RateLimiterOptions = {}): MiddlewareHandler => {
  const opts = { ...defaultOptions, ...options };

  return async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (env.NODE_ENV !== 'production' || !authHeader?.startsWith('Bearer ') || opts.skip(c)) {
      return await next();
    }

    const maxRequests = typeof opts.maxRequests === 'function' ? opts.maxRequests(c) : opts.maxRequests;
    const limiter = new RedisRateLimiter(redis, opts.windowMs, maxRequests);
    const key = opts.keyGenerator(c);

    try {
      const status = await limiter.getStatus(key);

      if (!status.allowed) {
        if (opts.standardHeaders) {
          setRateLimitHeaders(c, maxRequests, status);
        }

        return createRateLimitResponse(c, opts.message, status, opts.standardHeaders);
      }
    } catch (error) {
      logRedisUnavailableOnce('Redis authentication failure limiter unavailable, allowing request', error);

      return await next();
    }

    await next();

    if (c.get('automationKey')) {
      return;
    }

    try {
      const result = await limiter.isAllowed(key);

      if (opts.standardHeaders) {
        setRateLimitHeaders(c, maxRequests, result);
      }

      if (!result.allowed) {
        c.res = createRateLimitResponse(c, opts.message, result, opts.standardHeaders);
      }
    } catch (error) {
      logRedisUnavailableOnce('Redis authentication failure limiter unavailable, allowing request', error);
    }
  };
};

function defaultMaxRequests(c: Context): number {
  // Org lookup runs on every SSR layout load; keep it out of the tight global bucket.
  if (c.req.method === 'GET' && c.req.path === '/organization') return 500;

  return DEFAULT_RATE_LIMITER_OPTIONS.maxRequests;
}

function shouldSkipRateLimit(c: Context): boolean {
  if (isTrustedServerApiKeyRequest(c)) return true;

  if (c.req.path.startsWith('/public-api/')) return true;

  return c.req.path === '/api/auth/get-session';
}

// Default rate limiter middleware with standard configuration
export default createRateLimiter({
  maxRequests: defaultMaxRequests,
  skip: shouldSkipRateLimit
});
