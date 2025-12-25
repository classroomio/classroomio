import { redis } from './redis';

export interface CacheOptions {
  /**
   * Time to live in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;
  /**
   * Whether to skip caching if Redis is unavailable
   * @default true
   */
  skipOnError?: boolean;
}

export interface CacheResult<T> {
  cached: boolean;
  data: T | null;
}

/**
 * Cache utility class for Redis-based caching
 */
export class Cache {
  /**
   * Get cached value by key
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple cached values by pattern
   */
  static async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch and cache
    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by key
   */
  static async invalidate(key: string): Promise<boolean> {
    return this.del(key);
  }

  /**
   * Invalidate cache by pattern (e.g., "org:123:*")
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    return this.delPattern(pattern);
  }

  /**
   * Get cache key with namespace
   */
  static key(namespace: string, ...parts: (string | number)[]): string {
    const keyParts = [namespace, ...parts.map(String)];
    return keyParts.join(':');
  }
}

export const cache = Cache;