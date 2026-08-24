import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  isAllowed: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createRateLimiter:
    (options: { keyGenerator: (context: Context) => string }) => async (context: Context, next: Next) => {
      const key = options.keyGenerator(context);
      const result = await mocks.isAllowed(key);

      if (!result.allowed) {
        return context.json({ error: 'Too Many Requests' }, 429);
      }

      await next();
    }
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope)),
  touchOrganizationApiKeyLastUsedService: mocks.touchLastUsed
}));

vi.mock('@api/routes/v1/audience', () => ({
  v1AudienceRouter: new Hono().get('/', (c) => c.json({ success: true }))
}));

vi.mock('@api/routes/v1/courses', () => ({
  v1CoursesRouter: new Hono().get('/', (c) => c.json({ success: true }))
}));

import { v1Router } from './index';

const CLIENT_IP = '203.0.113.10';
const PRE_AUTH_KEY = `public_api_ip:${CLIENT_IP}`;

function requestWithToken(token?: string) {
  const headers = new Headers({ 'cf-connecting-ip': CLIENT_IP });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return v1Router.request('/courses', { headers });
}

describe('public API rate limiting', () => {
  beforeEach(() => {
    mocks.authenticate.mockReset();
    mocks.isAllowed.mockReset();
    mocks.touchLastUsed.mockReset();
    mocks.isAllowed.mockResolvedValue({
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60_000
    });
  });

  it('rate limits requests with a missing token before authentication', async () => {
    const unauthorizedResponse = await requestWithToken();

    expect(unauthorizedResponse.status).toBe(401);

    mocks.isAllowed.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });

    const limitedResponse = await requestWithToken();

    expect(limitedResponse.status).toBe(429);
    expect(mocks.isAllowed).toHaveBeenCalledTimes(2);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(1, PRE_AUTH_KEY);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(2, PRE_AUTH_KEY);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it('rate limits invalid tokens before another authentication lookup', async () => {
    mocks.authenticate.mockRejectedValue(new Error('Invalid organization API key'));

    const unauthorizedResponse = await requestWithToken('invalid-key');

    expect(unauthorizedResponse.status).toBe(401);
    expect(mocks.authenticate).toHaveBeenCalledOnce();

    mocks.isAllowed.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });

    const limitedResponse = await requestWithToken('invalid-key');

    expect(limitedResponse.status).toBe(429);
    expect(mocks.isAllowed).toHaveBeenCalledTimes(2);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(1, PRE_AUTH_KEY);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(2, PRE_AUTH_KEY);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
  });

  it('rate limits out-of-scope tokens before another authentication lookup or last-used update', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'out-of-scope-key-id',
      organizationId: 'org-id',
      createdByProfileId: 'profile-id',
      scopes: []
    });

    const forbiddenResponse = await requestWithToken('out-of-scope-key');

    expect(forbiddenResponse.status).toBe(403);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
    expect(mocks.touchLastUsed).toHaveBeenCalledOnce();

    mocks.isAllowed.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });

    const limitedResponse = await requestWithToken('out-of-scope-key');

    expect(limitedResponse.status).toBe(429);
    expect(mocks.isAllowed).toHaveBeenCalledTimes(2);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(1, PRE_AUTH_KEY);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(2, PRE_AUTH_KEY);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
    expect(mocks.touchLastUsed).toHaveBeenCalledOnce();
  });

  it('retains the per-key limiter for valid tokens', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'key-id',
      organizationId: 'org-id',
      createdByProfileId: 'profile-id',
      scopes: ['public_api:*']
    });
    mocks.isAllowed
      .mockResolvedValueOnce({ allowed: true, remaining: 999, resetTime: Date.now() + 60_000 })
      .mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });

    const response = await requestWithToken('valid-key');

    expect(response.status).toBe(429);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(1, PRE_AUTH_KEY);
    expect(mocks.isAllowed).toHaveBeenNthCalledWith(2, 'automation_key:key-id');
    expect(mocks.authenticate).toHaveBeenCalledWith('valid-key');
  });
});
