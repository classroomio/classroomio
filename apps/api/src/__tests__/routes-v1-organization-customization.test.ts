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

vi.mock('@api/services/v1/organization/customization', () => ({
  getPublicApiOrganizationCustomizationService: vi.fn(),
  updatePublicApiOrganizationCustomizationService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import {
  getPublicApiOrganizationCustomizationService,
  updatePublicApiOrganizationCustomizationService
} from '@api/services/v1/organization/customization';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { v1Router } from '@api/routes/v1';

const CUSTOMIZATION = {
  dashboard: { community: true, exercise: false, bannerImage: null, bannerText: 'Welcome' },
  course: { newsfeed: true, grading: true },
  apps: { comments: true },
  auth: { backgroundImage: 'https://cdn.example.com/bg.png' }
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

  return app.request('/public-api/v1/organization/customization', {
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
  vi.mocked(getPublicApiOrganizationCustomizationService).mockResolvedValue(CUSTOMIZATION);
  vi.mocked(updatePublicApiOrganizationCustomizationService).mockResolvedValue(CUSTOMIZATION);
});

describe('GET /public-api/v1/organization/customization', () => {
  it('returns the customization as the key creator, uncached', async () => {
    const response = await requestAs('api', ['public_api:*'], 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: CUSTOMIZATION });
    expect(getPublicApiOrganizationCustomizationService).toHaveBeenCalledWith('org-1', 'actor-1');
  });
});

describe('PATCH /public-api/v1/organization/customization', () => {
  it.each([
    ['a dashboard toggle', { dashboard: { community: false } }],
    ['the banner', { dashboard: { bannerImage: 'https://cdn.example.com/b.png', bannerText: 'Hi' } }],
    ['a removed banner image', { dashboard: { bannerImage: null } }],
    ['an empty banner text', { dashboard: { bannerText: '' } }],
    ['the course tabs', { course: { newsfeed: false, grading: false } }],
    ['lesson comments', { apps: { comments: false } }],
    ['the login background', { auth: { backgroundImage: 'http://cdn.example.com/bg.png' } }],
    ['a removed login background', { auth: { backgroundImage: null } }]
  ])('updates %s', async (_label, payload) => {
    const response = await requestAs('api', ['public_api:*'], 'PATCH', payload);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: CUSTOMIZATION });
    expect(updatePublicApiOrganizationCustomizationService).toHaveBeenCalledWith('org-1', 'actor-1', payload);
  });

  it('drops fields this route does not own', async () => {
    const response = await requestAs('api', ['public_api:*'], 'PATCH', {
      apps: { comments: false, poll: true },
      settings: { language: { locale: 'fr' } },
      theme: 'rose'
    });

    expect(response.status).toBe(200);
    expect(updatePublicApiOrganizationCustomizationService).toHaveBeenCalledWith('org-1', 'actor-1', {
      apps: { comments: false }
    });
  });

  it.each([
    ['an empty body', {}],
    ['empty sections', { dashboard: {}, auth: {} }],
    ['only fields this route does not own', { theme: 'rose', apps: { poll: true } }],
    ['a toggle that is not a boolean', { dashboard: { community: 'yes' } }],
    ['a banner image that is not a URL', { dashboard: { bannerImage: 'banner.png' } }],
    ['a javascript: login background', { auth: { backgroundImage: 'javascript:alert(1)' } }],
    ['a null banner text', { dashboard: { bannerText: null } }],
    ['a banner text over 500 characters', { dashboard: { bannerText: 'a'.repeat(501) } }],
    ['a section that is not an object', { course: true }]
  ])('returns 400 for %s', async (_label, payload) => {
    const response = await requestAs('api', ['public_api:*'], 'PATCH', payload);

    expect(response.status).toBe(400);
    expect(updatePublicApiOrganizationCustomizationService).not.toHaveBeenCalled();
  });

  it('passes on UPGRADE_REQUIRED from the service', async () => {
    vi.mocked(updatePublicApiOrganizationCustomizationService).mockRejectedValue(
      new AppError('A login background image requires a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    const response = await requestAs('api', ['public_api:*'], 'PATCH', {
      auth: { backgroundImage: 'https://cdn.example.com/bg.png' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false, code: 'UPGRADE_REQUIRED' });
  });
});

describe('MCP keys on the customization route', () => {
  it('meters get_organization_customization at 0 credits with organization:read', async () => {
    const response = await requestAs('mcp', ['organization:read'], 'GET');

    expect(response.status).toBe(200);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'get_organization_customization', 0);
  });

  it('meters update_organization_customization at 1 credit with organization:write', async () => {
    const response = await requestAs('mcp', ['organization:read', 'organization:write'], 'PATCH', {
      apps: { comments: false }
    });

    expect(response.status).toBe(200);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'update_organization_customization', 1);
  });

  it('refuses a PATCH from a key with only organization:read before the handler runs', async () => {
    const response = await requestAs('mcp', ['organization:read'], 'PATCH', { apps: { comments: false } });

    expect(response.status).toBe(403);
    expect(updatePublicApiOrganizationCustomizationService).not.toHaveBeenCalled();
  });

  it.each(['GET', 'PATCH'] as const)('refuses a %s from a key with only course scopes', async (method) => {
    const response = await requestAs('mcp', ['course:read', 'course:write'], method, { apps: { comments: false } });

    expect(response.status).toBe(403);
    expect(getPublicApiOrganizationCustomizationService).not.toHaveBeenCalled();
    expect(updatePublicApiOrganizationCustomizationService).not.toHaveBeenCalled();
  });
});
