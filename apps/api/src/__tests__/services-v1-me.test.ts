import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: vi.fn()
}));

import { getProfileById } from '@cio/db/queries/auth';
import { getOrganizationById } from '@cio/db/queries/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { getMeService } from '@api/services/v1/me/me';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const KEY_ID = '33333333-3333-4333-8333-333333333333';
const CONSENT_ID = '44444444-4444-4444-8444-444444444444';

const organizationRow = {
  id: ORG_ID,
  name: 'Acme Academy',
  siteName: 'acme',
  avatarUrl: 'https://example.com/logo.png'
};

const profileRow = {
  id: ACTOR_ID,
  fullname: 'Jane Admin',
  email: 'jane@example.com'
};

const apiKeyPrincipal: TAutomationPrincipal = {
  automationKey: {
    id: KEY_ID,
    organizationId: ORG_ID,
    createdByProfileId: ACTOR_ID,
    oauthConsentId: null,
    type: 'api',
    label: 'Default Key',
    secretPrefix: 'cio_live_',
    secretHash: 'hash',
    scopes: ['course:read', 'course:write'],
    lastUsedAt: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revokedAt: null
  },
  oauthClientId: null
};

const oauthPrincipal: TAutomationPrincipal = {
  automationKey: {
    id: KEY_ID,
    organizationId: ORG_ID,
    createdByProfileId: ACTOR_ID,
    oauthConsentId: CONSENT_ID,
    type: 'zapier',
    label: 'Zapier Integration',
    secretPrefix: 'cio_oa_',
    secretHash: 'hash',
    scopes: ['zapier:read', 'zapier:write'],
    lastUsedAt: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revokedAt: null
  },
  oauthClientId: 'zapier-client-123'
};

describe('getMeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationById).mockResolvedValue(organizationRow as never);
    vi.mocked(getProfileById).mockResolvedValue(profileRow as never);
  });

  it('throws 401 when actorId is null', async () => {
    await expect(getMeService(ORG_ID, null, apiKeyPrincipal)).rejects.toMatchObject({
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED
    });
  });

  it('throws 404 when organization is not found', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue(null as never);

    await expect(getMeService(ORG_ID, ACTOR_ID, apiKeyPrincipal)).rejects.toMatchObject({
      statusCode: 404,
      code: ErrorCodes.ORGANIZATION_NOT_FOUND
    });
  });

  it('returns identity payload for an API key principal', async () => {
    const result = await getMeService(ORG_ID, ACTOR_ID, apiKeyPrincipal);

    expect(result).toEqual({
      organization: {
        id: ORG_ID,
        name: 'Acme Academy',
        siteName: 'acme',
        avatarUrl: 'https://example.com/logo.png'
      },
      connection: {
        kind: 'api_key',
        id: KEY_ID,
        clientId: null,
        scopes: ['course:read', 'course:write']
      },
      actor: {
        profileId: ACTOR_ID,
        fullname: 'Jane Admin',
        email: 'jane@example.com'
      }
    });
  });

  it('returns identity payload for an OAuth principal', async () => {
    const result = await getMeService(ORG_ID, ACTOR_ID, oauthPrincipal);

    expect(result).toEqual({
      organization: {
        id: ORG_ID,
        name: 'Acme Academy',
        siteName: 'acme',
        avatarUrl: 'https://example.com/logo.png'
      },
      connection: {
        kind: 'oauth',
        id: CONSENT_ID,
        clientId: 'zapier-client-123',
        scopes: ['zapier:read', 'zapier:write']
      },
      actor: {
        profileId: ACTOR_ID,
        fullname: 'Jane Admin',
        email: 'jane@example.com'
      }
    });
  });

  it('handles actor when profile fields are missing', async () => {
    vi.mocked(getProfileById).mockResolvedValue(null as never);

    const result = await getMeService(ORG_ID, ACTOR_ID, apiKeyPrincipal);

    expect(result.actor).toEqual({
      profileId: ACTOR_ID,
      fullname: null,
      email: null
    });
  });
});
