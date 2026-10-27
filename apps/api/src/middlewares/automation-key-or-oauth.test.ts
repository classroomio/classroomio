import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { markInternalRequest } from '@api/utils/internal-request';

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

  it('requires a token issued for the public API on external requests', async () => {
    mocks.authenticateOAuth.mockResolvedValue(grantKey);

    await buildApp().request('/probe', { headers: { Authorization: 'Bearer eyJhbGciOi' } });

    expect(mocks.authenticateOAuth).toHaveBeenCalledWith('eyJhbGciOi', 'api');
  });

  it('accepts either resource only for requests dispatched by this process', async () => {
    mocks.authenticateOAuth.mockResolvedValue(grantKey);
    const headers = new Headers({ Authorization: 'Bearer eyJhbGciOi' });
    markInternalRequest(headers);

    await buildApp().request('/probe', { headers });

    expect(mocks.authenticateOAuth).toHaveBeenCalledWith('eyJhbGciOi', 'any');
  });

  it('does not trust a forged internal request header', async () => {
    mocks.authenticateOAuth.mockResolvedValue(grantKey);

    await buildApp().request('/probe', {
      headers: { Authorization: 'Bearer eyJhbGciOi', 'x-cio-internal-request': 'guess' }
    });

    expect(mocks.authenticateOAuth).toHaveBeenCalledWith('eyJhbGciOi', 'api');
  });

  it('answers 401 when the OAuth token is rejected', async () => {
    mocks.authenticateOAuth.mockRejectedValue(new Error('revoked'));

    const response = await buildApp().request('/probe', { headers: { Authorization: 'Bearer eyJhbGciOi' } });

    expect(response.status).toBe(401);
  });

  it('keeps a plan restriction as 403 instead of reporting it as an authentication failure', async () => {
    mocks.authenticateOAuth.mockRejectedValue(
      new AppError('Public API keys require an Early Adopter or Enterprise plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    const response = await buildApp().request('/probe', { headers: { Authorization: 'Bearer eyJhbGciOi' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe(ErrorCodes.UPGRADE_REQUIRED);
  });

  it('answers 401 without an Authorization header', async () => {
    const response = await buildApp().request('/probe');

    expect(response.status).toBe(401);
  });
});
