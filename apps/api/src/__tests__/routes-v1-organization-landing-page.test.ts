import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope)),
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));

vi.mock('@api/services/v1/organization/landing-page', () => ({
  setPublicApiFeaturedCoursesService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import { setPublicApiFeaturedCoursesService } from '@api/services/v1/organization/landing-page';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const PATH = '/organization/landing-page/featured-courses';
const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '22222222-2222-4222-8222-222222222222';

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], payload: unknown) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request(`/public-api/v1${PATH}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json' }
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(setPublicApiFeaturedCoursesService).mockImplementation(async (_orgId, _actorId, payload) => payload);
});

describe('PUT /public-api/v1/organization/landing-page/featured-courses', () => {
  it('sets featured courses in order as the key creator', async () => {
    const payload = { courseIds: [OTHER_COURSE_ID, COURSE_ID] };
    const response = await requestAs('api', ['public_api:*'], payload);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: payload });
    expect(setPublicApiFeaturedCoursesService).toHaveBeenCalledWith('org-1', 'actor-1', payload);
  });

  it('accepts an empty list to clear the featured courses', async () => {
    const response = await requestAs('api', ['public_api:*'], { courseIds: [] });

    expect(response.status).toBe(200);
  });

  it.each([
    [
      'more than four ids',
      { courseIds: Array.from({ length: 5 }, (_, i) => `0000000${i}-0000-4000-8000-000000000000`) }
    ],
    ['duplicate ids', { courseIds: [COURSE_ID, COURSE_ID] }],
    ['a non-uuid id', { courseIds: ['nope'] }],
    ['a missing list', {}]
  ])('returns 400 for %s', async (_label, payload) => {
    const response = await requestAs('api', ['public_api:*'], payload);

    expect(response.status).toBe(400);
    expect(setPublicApiFeaturedCoursesService).not.toHaveBeenCalled();
  });
});

describe('MCP keys on the featured courses route', () => {
  it('meters set_featured_courses at 1 credit with organization:write', async () => {
    const response = await requestAs('mcp', ['organization:read', 'organization:write'], { courseIds: [COURSE_ID] });

    expect(response.status).toBe(200);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'set_featured_courses', 1);
  });

  it.each([
    ['organization:read', ['organization:read']],
    ['course:write', ['course:read', 'course:write']]
  ])('refuses a key with only %s before the handler runs', async (_label, scopes) => {
    const response = await requestAs('mcp', scopes, { courseIds: [COURSE_ID] });

    expect(response.status).toBe(403);
    expect(setPublicApiFeaturedCoursesService).not.toHaveBeenCalled();
  });
});
