import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { PUBLIC_API_FAILED_AUTH_MAX_REQUESTS } from '@api/constants/rate-limiter';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  isAllowed: vi.fn(),
  releaseFailure: vi.fn(),
  reserveFailure: vi.fn(),
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
      const reservation = await mocks.reserveFailure(key);

      if (!reservation.allowed) {
        return context.json({ error: 'Too Many Requests' }, 429);
      }

      await next();

      if (context.get('automationKey')) {
        await mocks.releaseFailure(key, reservation.reservationId);
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
    const defaultResetTime = Date.now() + 60_000;

    mocks.authenticate.mockReset();
    mocks.isAllowed.mockReset();
    mocks.releaseFailure.mockReset();
    mocks.reserveFailure.mockReset();
    mocks.touchLastUsed.mockReset();
    mocks.reserveFailure.mockResolvedValue({
      allowed: true,
      remaining: 1000,
      reservationId: 'failure-reservation',
      resetTime: defaultResetTime
    });
    mocks.isAllowed.mockResolvedValue({
      allowed: true,
      remaining: 999,
      reservationId: 'per-key-reservation',
      resetTime: defaultResetTime
    });
  });

  it('rejects a missing token without consuming the failed-authentication budget', async () => {
    const unauthorizedResponse = await requestWithToken();

    expect(unauthorizedResponse.status).toBe(401);
    expect(mocks.reserveFailure).not.toHaveBeenCalled();
    expect(mocks.releaseFailure).not.toHaveBeenCalled();
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it('keeps reservations for invalid tokens and blocks another authentication lookup when exhausted', async () => {
    mocks.authenticate.mockRejectedValue(new Error('Invalid organization API key'));

    const unauthorizedResponse = await requestWithToken('invalid-key');

    expect(unauthorizedResponse.status).toBe(401);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
    expect(mocks.releaseFailure).not.toHaveBeenCalled();

    const exhaustedLimitResetTime = Date.now() + 60_000;
    mocks.reserveFailure.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      reservationId: 'exhausted-reservation',
      resetTime: exhaustedLimitResetTime
    });

    const limitedResponse = await requestWithToken('invalid-key');

    expect(limitedResponse.status).toBe(429);
    expect(mocks.reserveFailure).toHaveBeenCalledTimes(2);
    expect(mocks.reserveFailure).toHaveBeenNthCalledWith(1, FAILED_AUTH_KEY);
    expect(mocks.reserveFailure).toHaveBeenNthCalledWith(2, FAILED_AUTH_KEY);
    expect(mocks.authenticate).toHaveBeenCalledOnce();
    expect(mocks.releaseFailure).not.toHaveBeenCalled();
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
    expect(mocks.reserveFailure).toHaveBeenCalledWith(FAILED_AUTH_KEY);
    expect(mocks.releaseFailure).toHaveBeenCalledWith(FAILED_AUTH_KEY, 'failure-reservation');
  });

  it('retains the per-key limiter for valid tokens', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'key-id',
      organizationId: 'org-id',
      createdByProfileId: 'profile-id',
      scopes: ['public_api:*']
    });
    const perKeyResetTime = Date.now() + 60_000;
    mocks.isAllowed.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      reservationId: 'per-key-reservation',
      resetTime: perKeyResetTime
    });

    const response = await requestWithToken('valid-key');

    expect(response.status).toBe(429);
    expect(mocks.reserveFailure).toHaveBeenCalledWith(FAILED_AUTH_KEY);
    expect(mocks.releaseFailure).toHaveBeenCalledWith(FAILED_AUTH_KEY, 'failure-reservation');
    expect(mocks.isAllowed).toHaveBeenCalledOnce();
    expect(mocks.isAllowed).toHaveBeenCalledWith('automation_key:key-id');
    expect(mocks.authenticate).toHaveBeenCalledWith('valid-key');
  });

  it('atomically bounds concurrent invalid-token authentication attempts', async () => {
    let reservedFailures = 0;
    const concurrentResetTime = Date.now() + 60_000;
    mocks.authenticate.mockRejectedValue(new Error('Invalid organization API key'));
    mocks.reserveFailure.mockImplementation(async () => {
      const allowed = reservedFailures < PUBLIC_API_FAILED_AUTH_MAX_REQUESTS;
      reservedFailures += 1;
      const remaining = Math.max(0, PUBLIC_API_FAILED_AUTH_MAX_REQUESTS - reservedFailures);
      const reservationId = `failure-reservation-${reservedFailures}`;

      return {
        allowed,
        remaining,
        reservationId,
        resetTime: concurrentResetTime
      };
    });

    const requests = Array.from({ length: PUBLIC_API_FAILED_AUTH_MAX_REQUESTS + 1 }, () =>
      requestWithToken('invalid-key')
    );
    const responses = await Promise.all(requests);
    const responseStatuses = responses.map((response) => response.status);

    expect(responseStatuses.filter((status) => status === 401)).toHaveLength(PUBLIC_API_FAILED_AUTH_MAX_REQUESTS);
    expect(responseStatuses.filter((status) => status === 429)).toHaveLength(1);
    expect(mocks.authenticate).toHaveBeenCalledTimes(PUBLIC_API_FAILED_AUTH_MAX_REQUESTS);
    expect(mocks.releaseFailure).not.toHaveBeenCalled();
  });
});
