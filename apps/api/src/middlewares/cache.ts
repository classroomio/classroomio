import type { MiddlewareHandler } from 'hono';
import { Cache } from '@api/utils/redis/cache';
import { routeCacheKey } from '@api/utils/redis/cache-keys';
import { env } from '@api/config/env';

export interface CacheMiddlewareOptions {
  /**
   * Time to live in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;
  /**
   * Custom cache key generator function
   * If not provided, uses route-based key generation
   */
  keyGenerator?: (c: any) => string;
  /**
   * Cache namespace prefix
   * @default 'api'
   */
  namespace?: string;
  /**
   * Whether to skip caching for authenticated users
   * @default false
   */
  skipForAuthenticated?: boolean;
  /**
   * Whether to skip caching if Redis is unavailable
   * @default true
   */
  skipOnError?: boolean;
  /**
   * HTTP methods to cache (default: GET only)
   * @default ['GET']
   */
  methods?: string[];
  /**
   * Custom condition function to determine if request should be cached
   */
  shouldCache?: (c: any) => boolean;
}

const defaultOptions: Required<Omit<CacheMiddlewareOptions, 'keyGenerator' | 'shouldCache'>> & {
  keyGenerator?: (c: any) => string;
  shouldCache?: (c: any) => boolean;
} = {
  ttl: 300,
  namespace: 'api',
  skipForAuthenticated: false,
  skipOnError: true,
  methods: ['GET']
};

/**
 * Cache middleware for Hono routes
 * Automatically caches GET responses and serves cached data when available
 *
 * @example
 * ```typescript
 * // Basic usage with default options
 * .get('/courses', cacheMiddleware(), async (c) => {
 *   // Route handler
 * });
 *
 * // Custom TTL and key generator
 * .get('/courses', cacheMiddleware({
 *   ttl: 600, // 10 minutes
 *   keyGenerator: (c) => `courses:${c.req.query('siteName')}`
 * }), async (c) => {
 *   // Route handler
 * });
 *
 * // Skip caching for authenticated users
 * .get('/user/profile', cacheMiddleware({
 *   skipForAuthenticated: true
 * }), async (c) => {
 *   // Route handler
 * });
 * ```
 */
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}): MiddlewareHandler => {
  const opts = { ...defaultOptions, ...options };

  return async (c, next) => {
    // Skip caching in non-production environments (optional - remove if you want caching in dev)
    if (env.NODE_ENV !== 'production' && !opts.skipOnError) {
      return await next();
    }

    // Only cache specified HTTP methods
    const method = c.req.method;
    if (!opts.methods.includes(method)) {
      return await next();
    }

    // Check custom shouldCache condition
    if (opts.shouldCache && !opts.shouldCache(c)) {
      return await next();
    }

    // Skip caching for authenticated users if configured
    if (opts.skipForAuthenticated) {
      const user = c.get('user');
      if (user) {
        return await next();
      }
    }

    try {
      // Generate cache key
      const cacheKey = opts.keyGenerator
        ? opts.keyGenerator(c)
        : routeCacheKey(c, opts.namespace);

      // Try to get from cache
      const cached = await Cache.get(cacheKey);

      if (cached !== null) {
        // Set cache headers
        c.header('X-Cache', 'HIT');
        c.header('Cache-Control', `public, max-age=${opts.ttl}`);

        // Return cached response
        return c.json(cached);
      }

      // Cache miss - continue to handler
      await next();

      // Cache the response if successful
      if (c.res.status === 200) {
        const response = await c.res.clone().json().catch(() => null);
        if (response) {
          await Cache.set(cacheKey, response, opts.ttl);
          c.header('X-Cache', 'MISS');
        }
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      // If caching fails and skipOnError is true, continue without caching
      if (opts.skipOnError) {
        return await next();
      }
      // Otherwise, let the error propagate
      throw error;
    }
  };
};

/**
 * Simple cache middleware with default options
 * Use this for quick caching of GET endpoints
 */
export default cacheMiddleware();