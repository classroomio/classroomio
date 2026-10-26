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

vi.mock('@api/services/v1/organization/organization', () => ({
  getPublicApiOrganizationService: vi.fn(),
  updatePublicApiOrganizationService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import {
  getPublicApiOrganizationService,
  updatePublicApiOrganizationService
} from '@api/services/v1/organization/organization';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const ORGANIZATION = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Acme Academy',
  siteName: 'acme',
  avatarUrl: 'https://cdn.example.com/logo.png',
  theme: 'blue'
};

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], method: 'GET' | 'PATCH', payload?: unknown) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request('/public-api/v1/organization', {
    method,
    body: method === 'GET' ? undefined : JSON.stringify(payload),
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json' }
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(getPublicApiOrganizationService).mockResolvedValue(ORGANIZATION);
  vi.mocked(updatePublicApiOrganizationService).mockImplementation(async (_orgId, _actorId, payload) => ({
    ...ORGANIZATION,
    ...payload
  }));
});

describe('GET /public-api/v1/organization', () => {
  it('returns the organization as the key creator, uncached', async () => {
    const response = await requestAs('api', ['public_api:*'], 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: ORGANIZATION });
    expect(getPublicApiOrganizationService).toHaveBeenCalledWith('org-1', 'actor-1');
  });
});

describe('PATCH /public-api/v1/organization', () => {
  it.each([
    ['a name', { name: 'Acme School' }],
    ['a logo', { avatarUrl: 'https://cdn.example.com/new.png' }],
    ['a preset theme', { theme: 'purple' }],
    ['a hex theme', { theme: '#1a2B3c' }],
    ['a hex theme with alpha', { theme: '#1a2b3c80' }],
    ['every field', { name: 'Acme School', avatarUrl: 'http://cdn.example.com/a.png', theme: 'green' }]
  ])('updates %s', async (_label, payload) => {
    const response = await requestAs('api', ['public_api:*'], 'PATCH', payload);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { ...ORGANIZATION, ...payload } });
    expect(updatePublicApiOrganizationService).toHaveBeenCalledWith('org-1', 'actor-1', payload);
  });

  it('drops fields this route does not own', async () => {
    const response = await requestAs('api', ['public_api:*'], 'PATCH', {
      theme: 'rose',
      siteName: 'hijack',
      customDomain: 'evil.example.com'
    });

    expect(response.status).toBe(200);
    expect(updatePublicApiOrganizationService).toHaveBeenCalledWith('org-1', 'actor-1', { theme: 'rose' });
  });

  it.each([
    ['an empty body', {}],
    ['only fields this route does not own', { siteName: 'hijack' }],
    ['a short name', { name: 'Acme' }],
    ['a name ending with a hyphen', { name: 'Acme Academy-' }],
    ['a logo that is not a URL', { avatarUrl: 'logo.png' }],
    ['a javascript: logo', { avatarUrl: 'javascript:alert(1)' }],
    ['an unknown preset', { theme: 'red' }],
    ['a short hex', { theme: '#fff' }],
    ['CSS in the theme', { theme: '#000000"]{}body{display:none}' }],
    ['a null theme', { theme: null }]
  ])('returns 400 for %s', async (_label, payload) => {
    const response = await requestAs('api', ['public_api:*'], 'PATCH', payload);

    expect(response.status).toBe(400);
    expect(updatePublicApiOrganizationService).not.toHaveBeenCalled();
  });
});

describe('MCP keys on the organization route', () => {
  it('meters get_organization at 0 credits with organization:read', async () => {
    const response = await requestAs('mcp', ['organization:read'], 'GET');

    expect(response.status).toBe(200);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'get_organization', 0);
  });

  it('meters update_organization at 1 credit with organization:write', async () => {
    const response = await requestAs('mcp', ['organization:read', 'organization:write'], 'PATCH', { theme: 'rose' });

    expect(response.status).toBe(200);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'update_organization', 1);
  });

  it('refuses a PATCH from a key with only organization:read before the handler runs', async () => {
    const response = await requestAs('mcp', ['organization:read'], 'PATCH', { theme: 'rose' });

    expect(response.status).toBe(403);
    expect(updatePublicApiOrganizationService).not.toHaveBeenCalled();
  });

  it.each(['GET', 'PATCH'] as const)('refuses a %s from a key with only course scopes', async (method) => {
    const response = await requestAs('mcp', ['course:read', 'course:write'], method, { theme: 'rose' });

    expect(response.status).toBe(403);
    expect(getPublicApiOrganizationService).not.toHaveBeenCalled();
    expect(updatePublicApiOrganizationService).not.toHaveBeenCalled();
  });
});
