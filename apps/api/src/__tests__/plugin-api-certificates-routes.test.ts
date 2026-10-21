import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  verifyPluginApiAccessToken: vi.fn(),
  listAvailableCertificateTemplatesForPlugin: vi.fn(),
  listIssuedCertificatesForPlugin: vi.fn(),
  getIssuedCertificateForPlugin: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@api/services/plugin/access-token', () => ({
  verifyPluginApiAccessToken: mocks.verifyPluginApiAccessToken
}));
vi.mock('@api/services/plugin/templates', () => ({
  listAvailableCertificateTemplatesForPlugin: mocks.listAvailableCertificateTemplatesForPlugin
}));
vi.mock('@api/services/plugin/issued-certificates', () => ({
  listIssuedCertificatesForPlugin: mocks.listIssuedCertificatesForPlugin,
  getIssuedCertificateForPlugin: mocks.getIssuedCertificateForPlugin
}));
vi.mock('@cio/db/queries', () => ({ recordPluginAuditEvent: mocks.recordPluginAuditEvent }));

import { pluginApiRouter } from '@api/routes/plugin-api';

describe('plugin API certificates routes', () => {
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
    scopes: ['certificate.template:read', 'certificate.issued:read']
  };

  const sampleTemplate = {
    id: 'classique',
    name: 'Honors Diploma',
    style: 'Victorian',
    description: 'Traditional academic elegance',
    accentColor: '#d4af37',
    subtitle: 'Certificate of Achievement',
    version: 1,
    design: { templateId: 'classique' }
  };

  const sampleIssuedCertificate = {
    id: 'e194bd50-7590-41e3-b381-917dc347176e',
    courseId: 'b194bd50-7590-41e3-b381-917dc347176b',
    profileId: claims.sub,
    cycleNumber: 1,
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2027-01-01T00:00:00.000Z',
    status: 'ACTIVE',
    verificationUrl: 'https://verify.classroomio.com/cert/e194bd50'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPluginApiAccessToken.mockResolvedValue(claims);
    mocks.listAvailableCertificateTemplatesForPlugin.mockResolvedValue([sampleTemplate]);
    mocks.listIssuedCertificatesForPlugin.mockResolvedValue({ items: [sampleIssuedCertificate], nextCursor: null });
    mocks.getIssuedCertificateForPlugin.mockResolvedValue(sampleIssuedCertificate);
    mocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  describe('GET /v1/certificates/templates', () => {
    it('returns list of available certificate templates', async () => {
      const response = await pluginApiRouter.request('/v1/certificates/templates', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: [sampleTemplate],
        requestId: expect.any(String)
      });
      expect(mocks.listAvailableCertificateTemplatesForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.certificate.template.list',
          outcome: 'success',
          resource: claims.organizationId
        })
      );
    });

    it('requires certificate.template:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: []
      });

      const response = await pluginApiRouter.request('/v1/certificates/templates', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listAvailableCertificateTemplatesForPlugin).not.toHaveBeenCalled();
    });

    it('handles service errors gracefully and audits denial', async () => {
      mocks.listAvailableCertificateTemplatesForPlugin.mockRejectedValue(
        new AppError('Failed to read templates', 'INTERNAL_ERROR', 500)
      );

      const response = await pluginApiRouter.request('/v1/certificates/templates', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('internal_error');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.certificate.template.list',
          outcome: 'denied',
          resource: claims.organizationId
        })
      );
    });
  });

  describe('GET /v1/certificates/issued', () => {
    it('returns list of issued certificates when authorized', async () => {
      const response = await pluginApiRouter.request('/v1/certificates/issued?limit=10', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          items: [sampleIssuedCertificate],
          nextCursor: null
        },
        requestId: expect.any(String)
      });
      expect(mocks.listIssuedCertificatesForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        expect.objectContaining({ limit: 10 })
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.certificate.issued.list',
          outcome: 'success'
        })
      );
    });

    it('requires certificate.issued:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['certificate.template:read']
      });

      const response = await pluginApiRouter.request('/v1/certificates/issued', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.listIssuedCertificatesForPlugin).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/certificates/issued/:certificateId', () => {
    it('returns single issued certificate by ID', async () => {
      const response = await pluginApiRouter.request(`/v1/certificates/issued/${sampleIssuedCertificate.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: sampleIssuedCertificate,
        requestId: expect.any(String)
      });
      expect(mocks.getIssuedCertificateForPlugin).toHaveBeenCalledWith(
        claims.installationId,
        claims.organizationId,
        claims.sub,
        sampleIssuedCertificate.id
      );
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.certificate.issued.get',
          outcome: 'success',
          resource: sampleIssuedCertificate.id
        })
      );
    });

    it('requires certificate.issued:read permission', async () => {
      mocks.verifyPluginApiAccessToken.mockResolvedValue({
        ...claims,
        scopes: ['certificate.template:read']
      });

      const response = await pluginApiRouter.request(`/v1/certificates/issued/${sampleIssuedCertificate.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('permission_denied');
      expect(mocks.getIssuedCertificateForPlugin).not.toHaveBeenCalled();
    });

    it('returns 404 when issued certificate is not found', async () => {
      mocks.getIssuedCertificateForPlugin.mockRejectedValue(
        new AppError('Certificate not found', 'CERTIFICATE_NOT_FOUND', 404)
      );

      const response = await pluginApiRouter.request(`/v1/certificates/issued/${sampleIssuedCertificate.id}`, {
        headers: { authorization: 'Bearer valid-token' }
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('resource_not_found');
      expect(mocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'plugin.api.certificate.issued.get',
          outcome: 'denied',
          resource: sampleIssuedCertificate.id
        })
      );
    });
  });
});
