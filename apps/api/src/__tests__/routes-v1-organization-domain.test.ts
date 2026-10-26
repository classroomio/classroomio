import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  complete: vi.fn(),
  release: vi.fn(),
  domain: {
    getDomainService: vi.fn(),
    updateDomainService: vi.fn(),
    connectCustomDomainService: vi.fn(),
    refreshCustomDomainService: vi.fn(),
    removeCustomDomainService: vi.fn()
  }
}));

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

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn().mockResolvedValue('reservation-id'),
  completeMcpAutomationUsage: mocks.complete,
  releaseMcpAutomationUsage: mocks.release
}));

vi.mock('@api/services/v1/organization/domain', () => mocks.domain);

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { v1Router } from '@api/routes/v1';

const SCOPES = ['organization:read', 'organization:write', 'organization:domain:write'];

const domain = {
  siteName: 'myschool',
  siteUrl: 'https://myschool.myclassroomio.com',
  favicon: null,
  customDomain: { hostname: 'courses.example.com', verified: false }
};
const setup = {
  hostname: 'courses.example.com',
  status: 'pending_dns',
  verified: false,
  reconnectRequired: false,
  message: 'Add the DNS A record below, then refresh verification.',
  provider: 'approximated',
  dnsRecords: [{ type: 'A', name: 'courses.example.com', value: '1.2.3.4', status: 'pending' }],
  validationErrors: []
};

const app = new Hono().route('/public-api/v1', v1Router);

const request = (method: string, path: string, body?: unknown) =>
  app.request(`/public-api/v1${path}`, {
    method,
    headers: { Authorization: 'Bearer cio_mcp_test', 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

const useKey = (type: 'mcp' | 'api', scopes: string[]) =>
  mocks.authenticate.mockResolvedValue({
    id: 'key-id',
    organizationId: 'org-id',
    createdByProfileId: 'actor-id',
    type,
    scopes
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.complete.mockResolvedValue(undefined);
  mocks.release.mockResolvedValue(undefined);
  mocks.domain.getDomainService.mockResolvedValue(domain);
  mocks.domain.updateDomainService.mockResolvedValue(domain);
  mocks.domain.connectCustomDomainService.mockResolvedValue(setup);
  mocks.domain.refreshCustomDomainService.mockResolvedValue(setup);
  mocks.domain.removeCustomDomainService.mockResolvedValue({ ...setup, status: 'removed', dnsRecords: [] });
  useKey('mcp', SCOPES);
});

describe('public API organization domain', () => {
  it.each([
    ['GET', '/organization/domain', undefined, 'get_domain', 0],
    ['PATCH', '/organization/domain', { siteName: 'newschool' }, 'update_domain', 1],
    ['PUT', '/organization/domain/custom', { hostname: 'courses.example.com' }, 'connect_custom_domain', 1],
    ['POST', '/organization/domain/custom/refresh', undefined, 'refresh_custom_domain', 1],
    ['DELETE', '/organization/domain/custom', undefined, 'remove_custom_domain', 1]
  ])('%s %s meters %s', async (method, path, body, toolName, credits) => {
    const response = await request(method, path, body);

    expect(response.status).toBe(200);
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', toolName, credits);
  });

  it('passes the key creator and body to the services', async () => {
    await request('PATCH', '/organization/domain', { favicon: 'https://cdn.example.com/icon.png' });
    await request('PUT', '/organization/domain/custom', { hostname: 'courses.example.com' });

    expect(mocks.domain.updateDomainService).toHaveBeenCalledWith('org-id', 'actor-id', {
      favicon: 'https://cdn.example.com/icon.png'
    });
    expect(mocks.domain.connectCustomDomainService).toHaveBeenCalledWith('org-id', 'actor-id', {
      hostname: 'courses.example.com'
    });
  });

  it('returns the domain settings without caching them', async () => {
    const response = await request('GET', '/organization/domain');

    expect(await response.json()).toEqual({ success: true, data: domain });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('lets organization:read read but not write', async () => {
    useKey('mcp', ['organization:read', 'organization:write']);

    expect((await request('GET', '/organization/domain')).status).toBe(200);

    for (const [method, path, body] of [
      ['PATCH', '/organization/domain', { siteName: 'newschool' }],
      ['PUT', '/organization/domain/custom', { hostname: 'courses.example.com' }],
      ['POST', '/organization/domain/custom/refresh'],
      ['DELETE', '/organization/domain/custom']
    ] as const) {
      expect((await request(method, path, body)).status).toBe(403);
    }
    expect(mocks.domain.updateDomainService).not.toHaveBeenCalled();
    expect(mocks.domain.connectCustomDomainService).not.toHaveBeenCalled();
    expect(mocks.domain.refreshCustomDomainService).not.toHaveBeenCalled();
    expect(mocks.domain.removeCustomDomainService).not.toHaveBeenCalled();
  });

  it('opens every route to a public_api:* key', async () => {
    useKey('api', ['public_api:*']);

    expect((await request('DELETE', '/organization/domain/custom')).status).toBe(200);
  });

  it.each([
    ['an empty body', {}],
    ['a short subdomain', { siteName: 'abc' }],
    ['a subdomain with capitals', { siteName: 'MySchool' }],
    ['a blocked subdomain', { siteName: 'staging' }],
    ['a subdomain ending in a hyphen', { siteName: 'myschool-' }],
    ['a javascript: favicon', { favicon: 'javascript:alert(1)' }]
  ])('returns 400 for %s', async (_label, body) => {
    const response = await request('PATCH', '/organization/domain', body);

    expect(response.status).toBe(400);
    expect(mocks.domain.updateDomainService).not.toHaveBeenCalled();
  });

  it('returns 400 when the hostname is missing', async () => {
    expect((await request('PUT', '/organization/domain/custom', {})).status).toBe(400);
  });

  it.each([
    ['UPGRADE_REQUIRED', new AppError('Custom domains require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403), 403],
    ['CONFLICT', new AppError('Remove a.example.com first', ErrorCodes.CONFLICT, 409), 409],
    ['CUSTOM_DOMAIN_TAKEN', new AppError('Taken', ErrorCodes.CUSTOM_DOMAIN_TAKEN, 409), 409],
    ['CUSTOM_DOMAIN_UNAVAILABLE', new AppError('Not set up', ErrorCodes.CUSTOM_DOMAIN_UNAVAILABLE, 409), 409]
  ])('surfaces %s from connect', async (code, error, status) => {
    mocks.domain.connectCustomDomainService.mockRejectedValue(error);

    const response = await request('PUT', '/organization/domain/custom', { hostname: 'courses.example.com' });

    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ success: false, code });
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('returns 404 when no custom domain is connected', async () => {
    mocks.domain.refreshCustomDomainService.mockRejectedValue(
      new AppError('No custom domain is connected', ErrorCodes.CUSTOM_DOMAIN_NOT_FOUND, 404)
    );

    const response = await request('POST', '/organization/domain/custom/refresh');

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: ErrorCodes.CUSTOM_DOMAIN_NOT_FOUND });
  });

  it('returns 403 when the key creator is not an org admin', async () => {
    mocks.domain.getDomainService.mockRejectedValue(
      new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    expect((await request('GET', '/organization/domain')).status).toBe(403);
  });

  it('documents every route under the Organization Domain tag', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
    };

    const root = spec.paths['/public-api/v1/organization/domain'];
    const custom = spec.paths['/public-api/v1/organization/domain/custom'];
    const refresh = spec.paths['/public-api/v1/organization/domain/custom/refresh'];
    const tags = ['Organization Domain'];

    expect(root.get).toMatchObject({ summary: 'Get domain settings', tags });
    expect(root.patch).toMatchObject({ summary: 'Update subdomain or favicon', tags });
    expect(custom.put).toMatchObject({ summary: 'Connect a custom domain', tags });
    expect(custom.delete).toMatchObject({ summary: 'Remove the custom domain', tags });
    expect(refresh.post).toMatchObject({ summary: 'Refresh custom domain status', tags });
  });
});
