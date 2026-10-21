import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorizePluginRequest: vi.fn(),
  getProfileById: vi.fn()
}));

vi.mock('@api/services/plugin/authorization', () => ({
  authorizePluginRequest: mocks.authorizePluginRequest
}));
vi.mock('@cio/db/queries', () => ({
  getProfileById: mocks.getProfileById
}));

import { getPluginIdentityProfile } from '@api/services/plugin/identity';

describe('getPluginIdentityProfile service', () => {
  const installationId = '90d329c9-df43-416c-a8b6-1a739d2be966';
  const orgId = 'f993bf31-e76f-4f5b-831c-c05f2f571bd0';
  const actorId = '2194bd50-7590-41e3-b381-917dc347176f';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 400 when actorId is not provided', async () => {
    await expect(getPluginIdentityProfile(installationId, orgId)).rejects.toMatchObject({
      statusCode: 400,
      code: 'BAD_REQUEST'
    });
    expect(mocks.authorizePluginRequest).not.toHaveBeenCalled();
  });

  it('authorizes with identity.profile:read and returns sanitized profile', async () => {
    mocks.authorizePluginRequest.mockResolvedValue({
      organizationRole: 'admin'
    });
    mocks.getProfileById.mockResolvedValue({
      id: actorId,
      fullname: 'Alice Admin',
      username: 'alice',
      email: 'alice@example.com',
      avatarUrl: 'https://cdn.example.com/alice.jpg',
      locale: 'fr',
      isEmailVerified: true
    });

    const result = await getPluginIdentityProfile(installationId, orgId, actorId);

    expect(mocks.authorizePluginRequest).toHaveBeenCalledWith({
      installationId,
      organizationId: orgId,
      actorId,
      requiredScope: 'identity.profile:read'
    });

    expect(result).toEqual({
      id: actorId,
      displayName: 'Alice Admin',
      avatarUrl: 'https://cdn.example.com/alice.jpg',
      locale: 'fr',
      role: 'admin'
    });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('isEmailVerified');
  });

  it('falls back to username when fullname is empty', async () => {
    mocks.authorizePluginRequest.mockResolvedValue({
      organizationRole: 'tutor'
    });
    mocks.getProfileById.mockResolvedValue({
      id: actorId,
      fullname: '   ',
      username: 'tutor_bob',
      email: 'bob@example.com',
      avatarUrl: null,
      locale: null
    });

    const result = await getPluginIdentityProfile(installationId, orgId, actorId);

    expect(result.displayName).toBe('tutor_bob');
    expect(result.locale).toBe('en');
    expect(result.role).toBe('tutor');
  });

  it('throws 404 when profile is not found in database', async () => {
    mocks.authorizePluginRequest.mockResolvedValue({
      organizationRole: 'student'
    });
    mocks.getProfileById.mockResolvedValue(null);

    await expect(getPluginIdentityProfile(installationId, orgId, actorId)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND'
    });
  });
});
