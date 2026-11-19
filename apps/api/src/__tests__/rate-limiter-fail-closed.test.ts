import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

const mocks = vi.hoisted(() => ({
  isAllowed: vi.fn(),
  log: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({ env: { NODE_ENV: 'production' } }));

vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: {},
  logRedisUnavailableOnce: mocks.log
}));

vi.mock('@api/utils/redis/limiter', () => ({
  RedisRateLimiter: class {
    isAllowed = mocks.isAllowed;
  }
}));

import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { ErrorCodes } from '@api/utils/errors';

const handler = vi.fn();

function buildApp(failClosed?: boolean) {
  return new Hono()
    .use('*', createRateLimiter({ keyGenerator: () => 'key', failClosed }))
    .get('/', (c) => {
      handler();
      return c.json({ ok: true });
    })
    .get('/boom', () => {
      throw new Error('handler failed');
    })
    .onError((error, c) => c.json({ error: error.message }, 500));
}

describe('createRateLimiter when Redis cannot decide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAllowed.mockRejectedValue(new Error('ECONNREFUSED'));
  });

  it('refuses a fail-closed request with 503 and never runs the handler', async () => {
    const response = await buildApp(true).request('/');

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.RATE_LIMIT_UNAVAILABLE });
    expect(handler).not.toHaveBeenCalled();
  });

  it('still lets other limiters fail open', async () => {
    const response = await buildApp().request('/');

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('createRateLimiter when Redis answers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the handler once when the request is allowed', async () => {
    mocks.isAllowed.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 1000 });

    expect((await buildApp(true).request('/')).status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('returns 429 over the limit', async () => {
    mocks.isAllowed.mockResolvedValue({ allowed: false, remaining: 0, resetTime: Date.now() + 1000 });

    expect((await buildApp(true).request('/')).status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not treat a handler error as a Redis failure', async () => {
    mocks.isAllowed.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 1000 });

    const response = await buildApp(true).request('/boom');

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'handler failed' });
    expect(mocks.log).not.toHaveBeenCalled();
  });
});
