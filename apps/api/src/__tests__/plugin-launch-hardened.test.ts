import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'crypto';

const dbMocks = vi.hoisted(() => ({
  consumeLaunchCode: vi.fn(),
  createLaunchCode: vi.fn(),
  getActiveBackendClientByHash: vi.fn(),
  getActiveBackendClientByClientId: vi.fn(),
  getActiveCredentialByHash: vi.fn(),
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getPluginCourseById: vi.fn(),
  getPluginLessonAccessContext: vi.fn(),
  getPluginVersionById: vi.fn(),
  getUserOrgRole: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  consumeLaunchCode: dbMocks.consumeLaunchCode,
  createLaunchCode: dbMocks.createLaunchCode,
  getActiveBackendClientByHash: dbMocks.getActiveBackendClientByHash,
  getActiveBackendClientByClientId: dbMocks.getActiveBackendClientByClientId,
  getActiveCredentialByHash: dbMocks.getActiveCredentialByHash,
  getInstallationById: dbMocks.getInstallationById,
  getInstallationGrants: dbMocks.getInstallationGrants,
  getPluginCourseById: dbMocks.getPluginCourseById,
  getPluginLessonAccessContext: dbMocks.getPluginLessonAccessContext,
  getPluginVersionById: dbMocks.getPluginVersionById,
  getUserOrgRole: dbMocks.getUserOrgRole,
  recordPluginAuditEvent: dbMocks.recordPluginAuditEvent
}));

vi.mock('@api/services/v1/shared', () => ({
  assertCourseMemberOrOrgAdmin: vi.fn()
}));

import { createLaunchCodeForSession, exchangeLaunchCodeForClaims } from '@api/services/plugin/launch';

describe('Hardened Plugin Launch Authentication', () => {
  const pluginId = 'com.classroomio.certificate-studio';
  const versionId = 'ver-100';
  const installationId = 'inst-100';
  const organizationId = 'org-100';
  const userId = 'usr-100';
  const backendBaseUrl = 'https://certificate-studio.services.classroomio.com';

  const mockManifest = {
    id: pluginId,
    name: 'Certificate Studio',
    version: '1.0.0',
    runtime: {
      ui: {
        entrypoints: {
          studio: { renderMode: 'custom', resource: 'dist/studio.html' },
          templatePicker: { renderMode: 'custom', resource: 'dist/picker.html' }
        }
      },
      backend: {
        type: 'remote',
        baseUrl: backendBaseUrl,
        webhookPath: '/v1/webhooks/classroomio'
      }
    },
    permissions: {
      required: ['organization.profile:read', 'certificate.template:read', 'certificate.template:write']
    },
    contributes: {
      pages: [{ id: 'certificate-studio', entrypoint: 'studio', title: 'Certificate Studio' }],
      slots: [{ id: 'picker', target: 'certificate.templates', renderMode: 'custom', entrypoint: 'templatePicker' }]
    }
  };

  const mockInstallation = {
    id: installationId,
    pluginId,
    pluginVersionId: versionId,
    ownerType: 'organization',
    organizationId,
    userId: null,
    status: 'active',
    orgApprovalStatus: 'approved',
    settings: {}
  };

  const mockVersion = {
    id: versionId,
    pluginId,
    version: '1.0.0',
    manifest: mockManifest
  };

  const mockGrants = [
    { id: 'g1', installationId, scope: 'organization.profile:read' },
    { id: 'g2', installationId, scope: 'certificate.template:read' },
    { id: 'g3', installationId, scope: 'certificate.template:write' }
  ];

  const mockBackendClient = {
    id: 'client-1',
    pluginId,
    clientId: 'pbc_cert_studio_abc',
    secretPrefix: 'cio_bsec_test',
    secretHash: createHash('sha256').update('valid-backend-secret').digest('hex'),
    status: 'active',
    revokedAt: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue(mockInstallation);
    dbMocks.getPluginVersionById.mockResolvedValue(mockVersion);
    dbMocks.getUserOrgRole.mockResolvedValue(1); // 1 = admin
    dbMocks.getInstallationGrants.mockResolvedValue(mockGrants);
    dbMocks.getPluginCourseById.mockResolvedValue({ id: 'e69a0319-9404-4b53-a3d5-1f953047a06d' });
    dbMocks.getActiveBackendClientByHash.mockImplementation((hash) => {
      if (hash === mockBackendClient.secretHash) return Promise.resolve(mockBackendClient);
      return Promise.resolve(null);
    });
    dbMocks.createLaunchCode.mockResolvedValue({ id: 'lc-row-1' });
  });

  describe('createLaunchCodeForSession', () => {
    it('creates a single-use 60-second launch code bound to target and audience', async () => {
      const result = await createLaunchCodeForSession({
        installationId,
        userId,
        organizationId,
        contributionTarget: 'certificate.templates',
        resource: { type: 'course', id: 'e69a0319-9404-4b53-a3d5-1f953047a06d' },
        audience: backendBaseUrl,
        handshakeNonce: 'nonce-123'
      });

      expect(result.code).toMatch(/^lc_sec_/);
      expect(result.expiresInSeconds).toBe(60);

      expect(dbMocks.createLaunchCode).toHaveBeenCalledWith(
        expect.objectContaining({
          installationId,
          userId,
          organizationId,
          contributionTarget: 'certificate.templates',
          resourceType: 'course',
          resourceId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
          audience: backendBaseUrl,
          handshakeNonce: 'nonce-123'
        })
      );
    });

    it('rejects disabled or pending installations', async () => {
      dbMocks.getInstallationById.mockResolvedValueOnce({
        ...mockInstallation,
        status: 'disabled'
      });

      await expect(createLaunchCodeForSession({ installationId, userId, organizationId })).rejects.toThrow(
        'Plugin installation is not active'
      );

      dbMocks.getInstallationById.mockResolvedValueOnce({
        ...mockInstallation,
        orgApprovalStatus: 'pending'
      });

      await expect(createLaunchCodeForSession({ installationId, userId, organizationId })).rejects.toThrow(
        'Plugin installation is not approved'
      );
    });

    it('rejects user who is not an active member of organization', async () => {
      dbMocks.getUserOrgRole.mockResolvedValueOnce(null);

      await expect(createLaunchCodeForSession({ installationId, userId, organizationId })).rejects.toThrow(
        'User is not an active member of the organization'
      );
    });

    it('rejects undeclared contribution target', async () => {
      await expect(
        createLaunchCodeForSession({
          installationId,
          userId,
          organizationId,
          contributionTarget: 'undeclared.slot'
        })
      ).rejects.toThrow('Requested contribution target is not declared by installed version');
    });

    it('rejects audience mismatch against remote backend origin', async () => {
      await expect(
        createLaunchCodeForSession({
          installationId,
          userId,
          organizationId,
          audience: 'https://malicious-attacker.com'
        })
      ).rejects.toThrow('Requested audience does not match manifest backend origin');
    });

    it('rejects a host resource outside the actor and organization boundary', async () => {
      dbMocks.getPluginCourseById.mockResolvedValueOnce(null);

      await expect(
        createLaunchCodeForSession({
          installationId,
          userId,
          organizationId,
          contributionTarget: 'certificate.templates',
          resource: { type: 'course', id: 'e69a0319-9404-4b53-a3d5-1f953047a06d' },
          audience: backendBaseUrl
        })
      ).rejects.toThrow('Launch resource is not accessible to this actor');
    });

    it('rejects when required permissions are not active', async () => {
      dbMocks.getInstallationGrants.mockResolvedValueOnce([
        { id: 'g1', installationId, scope: 'organization.profile:read' }
      ]);

      await expect(createLaunchCodeForSession({ installationId, userId, organizationId })).rejects.toThrow(
        'Required permissions not granted'
      );
    });
  });

  describe('exchangeLaunchCodeForClaims', () => {
    it('authenticates backend client, single-use consumes code, and returns verified claims', async () => {
      dbMocks.consumeLaunchCode.mockResolvedValueOnce({
        id: 'lc-row-1',
        installationId,
        codeHash: 'hash-code',
        userId,
        organizationId,
        contributionTarget: 'certificate.templates',
        resourceType: 'course',
        resourceId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
        audience: backendBaseUrl,
        handshakeNonce: 'nonce-123',
        expiresAt: new Date(Date.now() + 50000).toISOString(),
        usedAt: null
      });

      const claims = await exchangeLaunchCodeForClaims({
        code: 'valid-launch-code',
        clientSecret: 'valid-backend-secret',
        clientId: 'pbc_cert_studio_abc'
      });

      expect(claims).toEqual({
        pluginId,
        versionId,
        installationId,
        organizationId,
        userId,
        organizationRole: 'admin',
        contributionTarget: 'certificate.templates',
        resource: { type: 'course', id: 'e69a0319-9404-4b53-a3d5-1f953047a06d' },
        audience: backendBaseUrl,
        grantedScopes: ['organization.profile:read', 'certificate.template:read', 'certificate.template:write'],
        expiresAt: expect.any(String),
        accessToken: expect.stringMatching(/^eyJ/),
        tokenType: 'Bearer'
      });

      expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.launch_code_exchanged',
          outcome: 'success'
        })
      );
    });

    it('rejects invalid or wrong backend client secret', async () => {
      await expect(
        exchangeLaunchCodeForClaims({
          code: 'valid-launch-code',
          clientSecret: 'wrong-secret',
          clientId: mockBackendClient.clientId
        })
      ).rejects.toThrow('Invalid client credentials');

      expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.launch_code_exchange_failed',
          outcome: 'denied',
          metadata: { reason: 'invalid_credentials' }
        })
      );
    });

    it('rejects replayed, expired, or invalid launch code', async () => {
      dbMocks.consumeLaunchCode.mockResolvedValueOnce(null);

      await expect(
        exchangeLaunchCodeForClaims({
          code: 'used-or-expired-code',
          clientSecret: 'valid-backend-secret',
          clientId: mockBackendClient.clientId
        })
      ).rejects.toThrow('Launch code is invalid, expired, or already used');
    });

    it('rejects launch code from a different plugin than authenticated backend client', async () => {
      dbMocks.consumeLaunchCode.mockResolvedValueOnce({
        id: 'lc-row-other',
        installationId: 'inst-other',
        userId,
        organizationId,
        contributionTarget: 'plugin.page',
        audience: backendBaseUrl
      });
      dbMocks.getInstallationById.mockResolvedValueOnce({
        ...mockInstallation,
        id: 'inst-other',
        pluginId: 'com.other.plugin'
      });

      await expect(
        exchangeLaunchCodeForClaims({
          code: 'valid-code-wrong-plugin',
          clientSecret: 'valid-backend-secret',
          clientId: mockBackendClient.clientId
        })
      ).rejects.toThrow('Launch code does not match client plugin');
    });

    it('derives organization role correctly as tutor or student', async () => {
      dbMocks.consumeLaunchCode.mockResolvedValueOnce({
        id: 'lc-row-tutor',
        installationId,
        userId,
        organizationId,
        contributionTarget: 'plugin.page',
        audience: backendBaseUrl
      });
      dbMocks.getUserOrgRole.mockResolvedValueOnce(2); // 2 = tutor

      const claims = await exchangeLaunchCodeForClaims({
        code: 'valid-launch-code',
        clientSecret: 'valid-backend-secret',
        clientId: mockBackendClient.clientId
      });

      expect(claims.organizationRole).toBe('tutor');
    });
  });
});
