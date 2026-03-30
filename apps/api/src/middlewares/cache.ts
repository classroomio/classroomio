import { createMiddleware } from 'hono/factory';
import { redis } from '@api/utils/redis/redis';
import type { Context } from 'hono';
import { invalidateCacheIndex, invalidateCacheKey, registerCacheKey } from '@api/utils/redis/cache';

const DEFAULT_TTL_SECONDS = 3600;

export interface CacheOptions {
  ttlSeconds?: number;
  keyGenerator: (c: Context) => string | null | Promise<string | null>;
  indexKey?: (c: Context) => string | null | Promise<string | null>; // e.g. orgId
}

export interface InvalidateCacheOptions {
  keys?: (c: Context) => string | string[] | null | Promise<string | string[] | null>;
  indexes?: (c: Context) => string | string[] | null | Promise<string | string[] | null>;
}

export const cacheResponseMiddleware = (options: CacheOptions) =>
  createMiddleware(async (c, next) => {
    const key = await options.keyGenerator(c);
    if (!key) return next();

    try {
      const cached = await redis.get(key);
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
        });
      }
    } catch (err) {
      console.error(`Cache read error for key "${key}":`, err);
    }

    await next();

    const { status, headers } = c.res;
    if (status >= 200 && status < 300 && headers.get('Content-Type')?.includes('application/json')) {
      try {
        const body = await c.res.clone().text();
        const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
        await redis.set(key, body, { EX: ttl });

        // Register against an index so we can invalidate without SCAN
        const indexKey = await options.indexKey?.(c);
        if (indexKey) {
          await registerCacheKey(indexKey, key, ttl);
        }

        c.header('X-Cache', 'MISS');
      } catch (err) {
        console.error(`Cache write error for key "${key}":`, err);
      }
    }
  });



export const invalidateCacheMiddleware = (options?: InvalidateCacheOptions) =>
  createMiddleware(async (c, next) => {
    await next();

    const { status } = c.res;
    if (status < 200 || status >= 300) return;

    const [keys, indexesResolved] = await Promise.all([
      options?.keys?.(c),
      options?.indexes?.(c),
    ]);

    const indexes = Array.isArray(indexesResolved) ? indexesResolved : (indexesResolved ? [indexesResolved] : []);
    const orgId = c.req.header('cio-org-id');
    
    if (orgId && !indexes.includes(orgId)) {
      indexes.push(orgId);
    }

    await Promise.all([
      keys && invalidateCacheKey(Array.isArray(keys) ? keys : [keys]),
      indexes.length > 0 && Promise.all(
        indexes.map(invalidateCacheIndex)
      ),
    ]);
  });