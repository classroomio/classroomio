import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  getPluginOrganizationProfile: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/organization', () => ({
  getPluginOrganizationProfile: mocks.getPluginOrganizationProfile
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('GET /v1/organization/profile', () => {
  const claims = {
    iss: 'classroomio' as const,
    aud: 'classroomio:plugin-api:v1' as const,
    sub: '2194bd50-7590-41e3-b381-917dc347176f',
    jti: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50',
    iat: 1,
    exp: 4_000_000_000,
    pluginId: 'com.classroomio.certificate-studio',
    versionId: '747b1324-b281-43d3-b468-032727fe5819',
    installationId: '90d329c9-df43-416c-a8b6-1a739d2be966',
    organizationId: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
    organizationRole: 'admin' as const,
    contributionTarget: 'plugin.page' as const,
    resource: null,
    clientAudience: 'https://certificate-studio.services.classroomio.com',
    scopes: ['organization.profile:read']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(claims);
    mocks.getPluginOrganizationProfile.mockResolvedValue({
      id: claims.organizationId,
      name: 'Acme Academy',
      avatarUrl: null,
      locale: 'en',
      privateSettings: { billingPlan: 'enterprise' }
    });
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  it('returns only the public field allowlist with a request ID', async () => {
    const response = await pluginApiRouter.request('/v1/organization/profile', {
      headers: { authorization: 'Bearer valid-token' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        id: claims.organizationId,
        name: 'Acme Academy',
        avatarUrl: null,
        locale: 'en'
      },
      requestId: expect.any(String)
    });
    expect(JSON.stringify(body)).not.toContain('billingPlan');
  });

  it('uses the standard error envelope when authentication is missing', async () => {
    const response = await pluginApiRouter.request('/v1/organization/profile');
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      success: false,
      error: { code: 'authentication_failed', retryable: false },
      requestId: expect.any(String)
    });
  });

  it('requires the scope in the token as well as the current installation grant', async () => {
    mocks.verifyPluginApiAccessToken.mockResolvedValue({ ...claims, scopes: [] });

    const response = await pluginApiRouter.request('/v1/organization/profile', {
      headers: { authorization: 'Bearer valid-token' }
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('permission_denied');
    expect(mocks.getPluginOrganizationProfile).not.toHaveBeenCalled();
  });
});
