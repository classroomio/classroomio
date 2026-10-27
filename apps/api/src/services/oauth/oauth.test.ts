import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';

import {
  authenticateOAuthAccessTokenService,
  listOAuthConnectedAppsService,
  revokeOAuthConnectedAppService,
  selectOAuthOrganizationService
} from './oauth';

const mocks = vi.hoisted(() => ({
  verifyOAuthAccessToken: vi.fn(),
  isActiveOrganizationAdmin: vi.fn(),
  findActiveOAuthConsentId: vi.fn(),
  getOrCreateOAuthGrantKey: vi.fn(),
  saveOAuthOrganizationSelection: vi.fn(),
  listOAuthConnectedApps: vi.fn(),
  revokeOAuthConsent: vi.fn(),
  revokeUserGrants: vi.fn()
}));

vi.mock('@cio/db/auth', () => ({ verifyOAuthAccessToken: mocks.verifyOAuthAccessToken }));
vi.mock('@cio/db/queries/auth', () => ({
  findActiveOAuthConsentId: mocks.findActiveOAuthConsentId,
  getOrCreateOAuthGrantKey: mocks.getOrCreateOAuthGrantKey,
  isActiveOrganizationAdmin: mocks.isActiveOrganizationAdmin,
  saveOAuthOrganizationSelection: mocks.saveOAuthOrganizationSelection,
  listOAuthConnectedApps: mocks.listOAuthConnectedApps,
  listOAuthEligibleOrganizations: vi.fn(),
  revokeOAuthConsent: mocks.revokeOAuthConsent,
  revokeUserOAuthGrantsInOrganization: mocks.revokeUserGrants
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const CONSENT_ID = 'c7a1f0d2-1b3e-4c5d-8e9f-0a1b2c3d4e5f';

const claims = {
  userId: USER_ID,
  clientId: 'client-1',
  organizationId: ORG_ID,
  scopes: ['course:read'],
  kind: 'mcp' as const
};

describe('authenticateOAuthAccessTokenService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.verifyOAuthAccessToken.mockResolvedValue(claims);
    mocks.isActiveOrganizationAdmin.mockResolvedValue(true);
    mocks.findActiveOAuthConsentId.mockResolvedValue(CONSENT_ID);
    mocks.getOrCreateOAuthGrantKey.mockResolvedValue({
      id: 'key-1',
      organizationId: ORG_ID,
      createdByProfileId: USER_ID,
      type: 'mcp',
      scopes: []
    });
  });

  it('returns the grant key carrying only the token scopes', async () => {
    const key = await authenticateOAuthAccessTokenService('token');

    expect(key.scopes).toEqual(['course:read']);
    expect(key.organizationId).toBe(ORG_ID);
    expect(mocks.getOrCreateOAuthGrantKey).toHaveBeenCalledWith(
      expect.objectContaining({ consentId: CONSENT_ID, userId: USER_ID, type: 'mcp' })
    );
  });

  it('rejects a token that fails verification', async () => {
    mocks.verifyOAuthAccessToken.mockRejectedValue(new Error('expired'));

    await expect(authenticateOAuthAccessTokenService('token')).rejects.toMatchObject({
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED
    });
    expect(mocks.getOrCreateOAuthGrantKey).not.toHaveBeenCalled();
  });

  it('rejects once the user is no longer an active admin of the organization', async () => {
    mocks.isActiveOrganizationAdmin.mockResolvedValue(false);

    await expect(authenticateOAuthAccessTokenService('token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('deletes the user grants in that organization when admin access is gone', async () => {
    mocks.isActiveOrganizationAdmin.mockResolvedValue(false);

    await authenticateOAuthAccessTokenService('token').catch(() => null);

    expect(mocks.revokeUserGrants).toHaveBeenCalledWith(USER_ID, ORG_ID);
  });

  it('keeps the grants of an admin whose grant was already revoked untouched', async () => {
    mocks.findActiveOAuthConsentId.mockResolvedValue(null);

    await authenticateOAuthAccessTokenService('token').catch(() => null);

    expect(mocks.revokeUserGrants).not.toHaveBeenCalled();
  });

  it('rejects once the grant has been revoked', async () => {
    mocks.findActiveOAuthConsentId.mockResolvedValue(null);

    await expect(authenticateOAuthAccessTokenService('token')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('selectOAuthOrganizationService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('stores the selection for an admin', async () => {
    mocks.isActiveOrganizationAdmin.mockResolvedValue(true);

    await selectOAuthOrganizationService('session-1', USER_ID, ORG_ID);

    expect(mocks.saveOAuthOrganizationSelection).toHaveBeenCalledWith('session-1', ORG_ID);
  });

  it('refuses an organization the user does not administer', async () => {
    mocks.isActiveOrganizationAdmin.mockResolvedValue(false);

    await expect(selectOAuthOrganizationService('session-1', USER_ID, ORG_ID)).rejects.toMatchObject({
      statusCode: 403,
      code: ErrorCodes.OAUTH_ORGANIZATION_NOT_ALLOWED
    });
    expect(mocks.saveOAuthOrganizationSelection).not.toHaveBeenCalled();
  });
});

describe('connected apps', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('formats last used time as ISO and keeps never-used grants null', async () => {
    mocks.listOAuthConnectedApps.mockResolvedValue([
      { consentId: 'a', lastUsedAt: '2026-10-27 12:42:13.437+00' },
      { consentId: 'b', lastUsedAt: null }
    ]);

    const apps = await listOAuthConnectedAppsService(ORG_ID);

    expect(apps[0]?.lastUsedAt).toBe('2026-10-27T12:42:13.437Z');
    expect(apps[1]?.lastUsedAt).toBeNull();
  });

  it('reports a missing grant as not found', async () => {
    mocks.revokeOAuthConsent.mockResolvedValue(false);

    await expect(revokeOAuthConnectedAppService(ORG_ID, CONSENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: ErrorCodes.OAUTH_CONNECTED_APP_NOT_FOUND
    });
  });
});
