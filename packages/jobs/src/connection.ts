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
 *
 * Redis Cloud note: scheduled maintenance / failover commonly surfaces as
 * `ECONNABORTED` / `ECONNRESET` / `READONLY`. Clients must keep reconnecting
 * (with DNS refresh) and must attach `error` listeners on every connection —
 * including BullMQ `duplicate()` copies — or Node exits on unhandled errors.
 * See https://redis.io/docs/latest/operate/rc/resilient-apps/
 */

const DEFAULT_OPTIONS: RedisOptions = {
  // Required by BullMQ - blocking commands need this disabled to work.
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Keep reconnecting through Redis Cloud maintenance windows (minutes, not seconds).
  // Caps delay at 2s; always returns a number so ioredis never gives up.
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
  // After a replica promotion, Redis may reply READONLY until we reconnect to the new primary.
  reconnectOnError(error) {
    const message = error.message.toUpperCase();
    if (message.includes('READONLY') || message.includes('LOADING')) {
      // 2 = reconnect AND resend the failed command against the new primary.
      return 2;
    }

    return false;
  },
  // Detect half-open sockets during provider maintenance (0 = OS default; 10s is safer for cloud).
  keepAlive: 10_000,
  // Queue commands while reconnecting so producers/workers ride out brief handoffs.
  enableOfflineQueue: true,
  autoResendUnfulfilledCommands: true
};

/** Marker so we don't stack duplicate error listeners when wrapping `duplicate()`. */
const ERROR_HANDLER_ATTACHED = Symbol.for('cio.bullmq.redisErrorHandler');

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

function attachRedisLifecycleHandlers(connection: Redis): void {
  const flagged = connection as Redis & { [ERROR_HANDLER_ATTACHED]?: boolean };

  if (flagged[ERROR_HANDLER_ATTACHED]) {
    return;
  }

  flagged[ERROR_HANDLER_ATTACHED] = true;

  connection.on('error', (error) => {
    // Transient disconnects (ECONNABORTED / ECONNRESET / ETIMEDOUT) are expected
    // during Redis Cloud maintenance; ioredis reconnects automatically. Log only.
    console.error('BullMQ Redis connection error:', error);
  });

  connection.on('reconnecting', (delay: number) => {
    console.warn(`BullMQ Redis reconnecting in ${delay}ms`);
  });

  connection.on('ready', () => {
    console.log('BullMQ Redis connection ready');
  });
}

/**
 * BullMQ calls `connection.duplicate()` for blocking / secondary clients.
 * Duplicates inherit options but NOT event listeners. An `error` event on a
 * listener-less ioredis client becomes an uncaught exception and exits the
 * Node process (seen in production as cascading `read ECONNABORTED` crashes
 * during Redis Cloud maintenance).
 */
function wrapDuplicate(connection: Redis): void {
  const originalDuplicate = connection.duplicate.bind(connection);

  connection.duplicate = ((options?: object) => {
    const duplicated = originalDuplicate(options);
    prepareRedisConnection(duplicated);
    return duplicated;
  }) as typeof connection.duplicate;
}

/**
 * Attach lifecycle handlers and recursively wrap `duplicate()` so every
 * connection BullMQ derives from this one is crash-safe. Exported so tests can
 * assert against the real implementation instead of a copy.
 */
export function prepareRedisConnection(connection: Redis): void {
  attachRedisLifecycleHandlers(connection);
  wrapDuplicate(connection);
}

/**
 * Create a brand new ioredis connection. Use this for each Worker process.
 */
export function createRedisConnection(options: RedisConnectionOptions = {}): Redis {
  const { url, ...rest } = options;
  const resolved = resolveUrl(url);
  const connection = new IORedis(resolved, { ...DEFAULT_OPTIONS, ...rest });

  prepareRedisConnection(connection);

  return connection;
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
