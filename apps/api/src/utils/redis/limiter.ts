import {
  DEFAULT_MAX_REQUESTS,
  DEFAULT_WINDOW_MS,
  ERROR_MESSAGES,
  RATE_LIMIT_KEY_PREFIX
} from '$src/constants/rate-limiter';

import { Redis } from 'ioredis';
import { redis } from './redis';

export class RedisRateLimiter {
  private redis: Redis;
  private windowMs: number;
  private maxRequests: number;

  constructor(
    redis: Redis,
    windowMs: number = DEFAULT_WINDOW_MS,
    maxRequests: number = DEFAULT_MAX_REQUESTS
  ) {
    this.redis = redis;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async isAllowed(
    key: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const keyWithPrefix = `${RATE_LIMIT_KEY_PREFIX}${key}`;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(keyWithPrefix, '-inf', windowStart);

    // Count current requests in window
    pipeline.zcard(keyWithPrefix);

    // Add current request
    pipeline.zadd(keyWithPrefix, now, `${now}-${Math.random()}`);

    // Set expiration for the key
    pipeline.expire(keyWithPrefix, Math.ceil(this.windowMs / 1000));

    const results = await pipeline.exec();

    if (!results || results.some((result) => result[0] !== null)) {
      throw new Error(ERROR_MESSAGES.REDIS_PIPELINE_FAILED);
    }

    const currentCount = results[1][1] as number;
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
