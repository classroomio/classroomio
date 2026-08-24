import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getFailureStatus: vi.fn(),
  isAllowed: vi.fn(),
  recordFailure: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter:
    (options: { keyGenerator: (context: Context) => string }) => async (context: Context, next: Next) => {
      const authHeader = context.req.header('Authorization');

      if (!authHeader?.startsWith('Bearer ')) {
        return next();
      }

      const key = options.keyGenerator(context);
      const status = await mocks.getFailureStatus(key);

      if (!status.allowed) {
        return context.json({ error: 'Too Many Requests' }, 429);
      }

      await next();

      if (!context.get('automationKey')) {
        await mocks.recordFailure(key);
      }
    },
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
const FAILED_AUTH_KEY = `public_api_failed_auth:${CLIENT_IP}`;

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
    mocks.getFailureStatus.mockReset();
    mocks.isAllowed.mockReset();
    mocks.recordFailure.mockReset();
    mocks.touchLastUsed.mockReset();
    mocks.getFailureStatus.mockResolvedValue({
      allowed: true,
      remaining: 1000,
      resetTime: Date.now() + 60_000
    });
    mocks.isAllowed.mockResolvedValue({
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60_000
    });
  });

  it('rejects a missing token without consuming the failed-authentication budget', async () => {
    const unauthorizedResponse = await requestWithToken();

    expect(unauthorizedResponse.status).toBe(401);
    expect(mocks.getFailureStatus).not.toHaveBeenCalled();
    expect(mocks.recordFailure).not.toHaveBeenCalled();
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it('records invalid tokens and blocks another authentication lookup after the budget is exhausted', async () => {
    mocks.authenticate.mockRejectedValue(new Error('Invalid organization API key'));

    const unauthorizedResponse = await requestWithToken('invalid-key');

    expect(unauthorizedResponse.status).toBe(401);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
    expect(mocks.recordFailure).toHaveBeenCalledWith(FAILED_AUTH_KEY);

    mocks.getFailureStatus.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });

    const limitedResponse = await requestWithToken('invalid-key');

    expect(limitedResponse.status).toBe(429);
    expect(mocks.getFailureStatus).toHaveBeenCalledTimes(2);
    expect(mocks.getFailureStatus).toHaveBeenNthCalledWith(1, FAILED_AUTH_KEY);
    expect(mocks.getFailureStatus).toHaveBeenNthCalledWith(2, FAILED_AUTH_KEY);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
    expect(mocks.recordFailure).toHaveBeenCalledOnce();
  });

  it('does not consume the failed-authentication budget for an authenticated out-of-scope key', async () => {
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
    expect(mocks.getFailureStatus).toHaveBeenCalledWith(FAILED_AUTH_KEY);
    expect(mocks.recordFailure).not.toHaveBeenCalled();
  });

  it('retains the per-key limiter for valid tokens', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'key-id',
      organizationId: 'org-id',
      createdByProfileId: 'profile-id',
      scopes: ['public_api:*']
    });
    mocks.isAllowed.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });

    const response = await requestWithToken('valid-key');

    expect(response.status).toBe(429);
    expect(mocks.getFailureStatus).toHaveBeenCalledWith(FAILED_AUTH_KEY);
    expect(mocks.recordFailure).not.toHaveBeenCalled();
    expect(mocks.isAllowed).toHaveBeenCalledOnce();
    expect(mocks.isAllowed).toHaveBeenCalledWith('automation_key:key-id');
    expect(mocks.authenticate).toHaveBeenCalledWith('valid-key');
  });
});
