import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';

import { automationKeyOrOAuthMiddleware } from './automation-key-or-oauth';

const mocks = vi.hoisted(() => ({
  authenticateKey: vi.fn(),
  authenticateOAuth: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticateKey,
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));
vi.mock('@api/services/oauth/oauth', () => ({
  authenticateOAuthAccessTokenService: mocks.authenticateOAuth
}));

const grantKey = { id: 'key-1', organizationId: 'org-1', createdByProfileId: 'user-1', scopes: ['team:read'] };

function buildApp() {
  return new Hono()
    .use(automationKeyOrOAuthMiddleware)
    .get('/probe', (c) =>
      c.json({ orgId: c.get('orgId'), actorId: c.get('actorId'), scopes: c.get('automationKey')?.scopes })
    );
}

describe('automationKeyOrOAuthMiddleware', () => {
  beforeEach(() => {
    mocks.authenticateKey.mockReset();
    mocks.authenticateOAuth.mockReset();
  });

  it('authenticates cio_ credentials as automation keys', async () => {
    mocks.authenticateKey.mockResolvedValue(grantKey);

    const response = await buildApp().request('/probe', { headers: { Authorization: 'Bearer cio_mcp_abc' } });

    expect(response.status).toBe(200);
    expect(mocks.authenticateKey).toHaveBeenCalledWith('cio_mcp_abc');
    expect(mocks.authenticateOAuth).not.toHaveBeenCalled();
  });

  it('authenticates other bearer tokens as OAuth access tokens', async () => {
    mocks.authenticateOAuth.mockResolvedValue(grantKey);

    const response = await buildApp().request('/probe', { headers: { Authorization: 'Bearer eyJhbGciOi' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orgId: 'org-1', actorId: 'user-1', scopes: ['team:read'] });
    expect(mocks.authenticateKey).not.toHaveBeenCalled();
  });

  it('answers 401 when the OAuth token is rejected', async () => {
    mocks.authenticateOAuth.mockRejectedValue(new Error('revoked'));

    const response = await buildApp().request('/probe', { headers: { Authorization: 'Bearer eyJhbGciOi' } });

    expect(response.status).toBe(401);
  });

  it('answers 401 without an Authorization header', async () => {
    const response = await buildApp().request('/probe');

    expect(response.status).toBe(401);
  });
});
