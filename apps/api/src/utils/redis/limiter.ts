import {
  DEFAULT_MAX_REQUESTS,
  DEFAULT_WINDOW_MS,
  ERROR_MESSAGES,
  RATE_LIMIT_KEY_PREFIX
} from '@api/constants/rate-limiter';

import { redis, type RedisClient } from './redis';

export class RedisRateLimiter {
  private redis: RedisClient;
  private windowMs: number;
  private maxRequests: number;

  constructor(redis: RedisClient, windowMs: number = DEFAULT_WINDOW_MS, maxRequests: number = DEFAULT_MAX_REQUESTS) {
    this.redis = redis;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const keyWithPrefix = `${RATE_LIMIT_KEY_PREFIX}${key}`;

    // Use Redis multi (transaction) for atomic operations
    const multi = this.redis.multi();

    // Remove expired entries
    multi.zRemRangeByScore(keyWithPrefix, '-inf', windowStart);

    // Count current requests in window
    multi.zCard(keyWithPrefix);

    // Add current request
    multi.zAdd(keyWithPrefix, { score: now, value: `${now}-${Math.random()}` });

    // Set expiration for the key
    multi.expire(keyWithPrefix, Math.ceil(this.windowMs / 1000));

    const results = await multi.exec();

    if (!results || results.some((result) => result === null)) {
      throw new Error(ERROR_MESSAGES.REDIS_PIPELINE_FAILED);
    }

    // results[0] is zRemRangeByScore result (number of removed elements)
    // results[1] is zCard result (current count before adding new request)
    const currentCount = results[1] as number;
    const remaining = Math.max(0, this.maxRequests - currentCount - 1);
    const resetTime = now + this.windowMs;

    return {
      allowed: currentCount < this.maxRequests,
      remaining,
      resetTime
    };
  }

  async reset(key: string): Promise<void> {
    const keyWithPrefix = `${RATE_LIMIT_KEY_PREFIX}${key}`;
    await this.redis.del(keyWithPrefix);
  }
}

export const rateLimiter = new RedisRateLimiter(redis);
