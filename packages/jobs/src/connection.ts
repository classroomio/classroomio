import IORedis, { type Redis, type RedisOptions } from 'ioredis';

/**
 * Shared Redis connection factory for BullMQ.
 *
 * BullMQ requires a dedicated `ioredis` connection per Worker (the worker
 * `BLPOP`s on it indefinitely). For Queues / FlowProducers we can reuse a
 * single shared connection. This module exposes both a singleton (for
 * enqueue paths in the API) and a factory (for each Worker process).
 *
 * Self-hosted note: Redis is required to enqueue or process jobs. Callers
 * should fail loudly when `REDIS_URL` is not configured rather than silently
 * dropping work.
 */

const DEFAULT_OPTIONS: RedisOptions = {
  // Required by BullMQ - blocking commands need this disabled to work.
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

export interface RedisConnectionOptions extends RedisOptions {
  /** Override the URL; falls back to REDIS_URL env. */
  url?: string;
}

export class RedisNotConfiguredError extends Error {
  constructor() {
    super(
      'REDIS_URL is not set. ClassroomIO requires Redis for the BullMQ job queue. ' +
        'Set REDIS_URL in your environment to a reachable Redis instance.'
    );
    this.name = 'RedisNotConfiguredError';
  }
}

function resolveUrl(override?: string): string {
  const url = override ?? process.env.REDIS_URL ?? '';
  if (!url) {
    throw new RedisNotConfiguredError();
  }

  return url;
}

/**
 * Create a brand new ioredis connection. Use this for each Worker process.
 */
export function createRedisConnection(options: RedisConnectionOptions = {}): Redis {
  const { url, ...rest } = options;
  const resolved = resolveUrl(url);
  return new IORedis(resolved, { ...DEFAULT_OPTIONS, ...rest });
}

let sharedConnection: Redis | undefined;

/**
 * Lazily-created shared connection used by Queue/FlowProducer instances on
 * the API side. Throws `RedisNotConfiguredError` if `REDIS_URL` is missing.
 */
export function getSharedRedisConnection(): Redis {
  if (!sharedConnection) {
    sharedConnection = createRedisConnection();
  }

  return sharedConnection;
}

/**
 * Returns true when `REDIS_URL` is set. Useful for graceful enqueue fallbacks
 * during local development without Redis.
 */
export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}
