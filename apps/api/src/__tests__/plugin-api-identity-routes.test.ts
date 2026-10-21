import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  getPluginIdentityProfile: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/identity', () => ({
  getPluginIdentityProfile: mocks.getPluginIdentityProfile
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('GET /v1/identity/profile', () => {
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
    organizationRole: 'student' as const,
    contributionTarget: 'plugin.page' as const,
    resource: null,
    clientAudience: 'https://certificate-studio.services.classroomio.com',
    scopes: ['identity.profile:read']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(claims);
    mocks.getPluginIdentityProfile.mockResolvedValue({
      id: claims.sub,
      displayName: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.png',
      locale: 'en',
      role: 'student',
      email: 'jane@example.com',
      rawSettings: { secretFlag: true }
    });
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  it('returns strictly whitelisted public fields and strips email and private settings', async () => {
    const response = await pluginApiRouter.request('/v1/identity/profile', {
      headers: { authorization: 'Bearer valid-token' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        id: claims.sub,
        displayName: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.png',
        locale: 'en',
        role: 'student'
      },
      requestId: expect.any(String)
    });
    expect(JSON.stringify(body)).not.toContain('jane@example.com');
    expect(JSON.stringify(body)).not.toContain('rawSettings');
    expect(JSON.stringify(body)).not.toContain('secretFlag');

    expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.identity.profile.read',
        outcome: 'success'
      })
    );
  });

  it('returns 401 when authorization header is missing', async () => {
    const response = await pluginApiRouter.request('/v1/identity/profile');
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      success: false,
      error: { code: 'authentication_failed', retryable: false },
      requestId: expect.any(String)
    });
  });

  it('returns 403 when identity.profile:read scope is missing from token', async () => {
    mocks.verifyPluginApiAccessToken.mockResolvedValue({ ...claims, scopes: [] });

    const response = await pluginApiRouter.request('/v1/identity/profile', {
      headers: { authorization: 'Bearer valid-token' }
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('permission_denied');
    expect(mocks.getPluginIdentityProfile).not.toHaveBeenCalled();
  });

  it('records audit log on failure when service throws an authorization error', async () => {
    mocks.getPluginIdentityProfile.mockRejectedValue(
      new AppError('Permission identity.profile:read is required', 'PLUGIN_PERMISSION_DENIED', 403)
    );

    const response = await pluginApiRouter.request('/v1/identity/profile', {
      headers: { authorization: 'Bearer valid-token' }
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('permission_denied');
    expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.identity.profile.read',
        outcome: 'denied'
      })
    );
  });

  it('returns 403 when caller is not an active organization member', async () => {
    mocks.getPluginIdentityProfile.mockRejectedValue(
      new AppError('Plugin actor is not an active organization member', 'FORBIDDEN', 403)
    );

    const response = await pluginApiRouter.request('/v1/identity/profile', {
      headers: { authorization: 'Bearer valid-token' }
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('permission_denied');
  });

  it('rejects oversized request bodies via request size middleware', async () => {
    const largeBody = 'a'.repeat(300 * 1024);

    const response = await pluginApiRouter.request('/v1/identity/profile', {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
        'content-length': String(largeBody.length)
      }
    });

    expect(response.status).toBe(413);
  });
});
