import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getInstallationGrants: vi.fn(),
  getOrganizationById: vi.fn(),
  getUserOrgRole: vi.fn(),
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  updateCourse: vi.fn(),
  recordPluginAuditEvent: vi.fn()
}));

vi.mock('@cio/db/queries', () => ({
  getInstallationById: dbMocks.getInstallationById,
  getInstallationGrants: dbMocks.getInstallationGrants,
  getOrganizationById: dbMocks.getOrganizationById,
  getUserOrgRole: dbMocks.getUserOrgRole,
  getCourseById: dbMocks.getCourseById,
  getCourseWithOrgData: dbMocks.getCourseWithOrgData,
  updateCourse: dbMocks.updateCourse,
  recordPluginAuditEvent: dbMocks.recordPluginAuditEvent
}));

import { getPluginOrganizationProfile } from '@api/services/plugin/organization';
import {
  applyCertificateTemplate,
  getAppliedCertificateTemplateForPlugin,
  listAvailableCertificateTemplatesForPlugin
} from '@api/services/plugin/templates';

describe('Public Plugin Domain Services', () => {
  const installationId = 'inst-123';
  const orgId = 'org-456';
  const userId = 'user-789';
  const courseId = 'course-101';

  const mockInstallation = {
    id: installationId,
    pluginId: 'com.example.certificate-provider',
    pluginVersionId: 'ver-1',
    ownerType: 'organization',
    organizationId: orgId,
    status: 'active',
    orgApprovalStatus: 'approved'
  };

  const mockOrg = {
    id: orgId,
    name: 'ClassroomIO Academy',
    avatarUrl: 'https://cdn.example.com/logo.png',
    settings: {
      language: {
        locale: 'en'
      }
    }
  };

  const mockCourse = {
    id: courseId,
    organizationId: orgId,
    title: 'Intro to Design',
    certificate: {
      isDownloadable: false
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue(mockInstallation);
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'organization.profile:read' },
      { scope: 'certificate.template:read' },
      { scope: 'certificate.template:write' }
    ]);
    dbMocks.getOrganizationById.mockResolvedValue(mockOrg);
    dbMocks.getUserOrgRole.mockResolvedValue(1); // 1 = admin
    dbMocks.getCourseById.mockResolvedValue([mockCourse]);
    dbMocks.getCourseWithOrgData.mockResolvedValue({ orgId });
    dbMocks.updateCourse.mockResolvedValue({ id: courseId });
    dbMocks.recordPluginAuditEvent.mockResolvedValue({ id: 'audit-1' });
  });

  describe('getPluginOrganizationProfile', () => {
    it('returns only narrow profile fields (id, name, avatarUrl, locale) when permitted', async () => {
      const profile = await getPluginOrganizationProfile(installationId, orgId);

      expect(profile).toEqual({
        id: orgId,
        name: 'ClassroomIO Academy',
        avatarUrl: 'https://cdn.example.com/logo.png',
        locale: 'en'
      });
      // Ensure settings blob is not leaked
      expect((profile as any).settings).toBeUndefined();
    });

    it('throws 403 when organization.profile:read scope is missing', async () => {
      dbMocks.getInstallationGrants.mockResolvedValueOnce([]);

      await expect(getPluginOrganizationProfile(installationId, orgId)).rejects.toThrow(
        'Permission organization.profile:read is required'
      );
    });

    it('throws 403 when installation belongs to another organization', async () => {
      dbMocks.getInstallationById.mockResolvedValueOnce({
        ...mockInstallation,
        organizationId: 'other-org'
      });

      await expect(getPluginOrganizationProfile(installationId, orgId)).rejects.toThrow(
        'Plugin installation not found'
      );
    });
  });

  describe('applyCertificateTemplate', () => {
    it('validates, normalizes design, snapshots into course.certificate, and records audit', async () => {
      const result = await applyCertificateTemplate({
        installationId,
        courseId,
        orgId,
        userId,
        externalTemplateId: 'tmpl-noir-1',
        externalTemplateVersion: 3,
        name: 'Dark Elegance',
        design: {
          templateId: 'noir',
          accentColor: '#10b981',
          signatories: [{ name: 'Dr. Jane Smith', role: 'Head of School' }]
        }
      });

      expect(result.success).toBe(true);
      expect(result.templateVersion).toBe(3);
      expect(result.appliedAt).toBeDefined();

      expect(dbMocks.updateCourse).toHaveBeenCalledWith(
        courseId,
        expect.objectContaining({
          certificate: expect.objectContaining({
            isDownloadable: true,
            design: expect.objectContaining({
              templateId: 'noir',
              accentColor: '#10b981'
            }),
            sourceTemplate: expect.objectContaining({
              pluginId: 'com.example.certificate-provider',
              externalTemplateId: 'tmpl-noir-1',
              version: 3,
              name: 'Dark Elegance'
            })
          })
        })
      );

      expect(dbMocks.recordPluginAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'certificate_template.applied',
          resource: courseId,
          outcome: 'success'
        })
      );
    });

    it('rejects non-admin/non-tutor users', async () => {
      dbMocks.getUserOrgRole.mockResolvedValueOnce(3); // 3 = student

      await expect(
        applyCertificateTemplate({
          installationId,
          courseId,
          orgId,
          userId,
          externalTemplateId: 'tmpl-1',
          externalTemplateVersion: 1,
          name: 'Test',
          design: {}
        })
      ).rejects.toThrow('Plugin actor does not have the required organization role');
    });

    it('rejects courses not belonging to the verified organization', async () => {
      dbMocks.getCourseWithOrgData.mockResolvedValueOnce({
        orgId: 'foreign-org'
      });

      await expect(
        applyCertificateTemplate({
          installationId,
          courseId,
          orgId,
          userId,
          externalTemplateId: 'tmpl-1',
          externalTemplateVersion: 1,
          name: 'Test',
          design: {}
        })
      ).rejects.toThrow('Course not found in this organization');
    });

    it('rejects when certificate.template:write permission is missing', async () => {
      dbMocks.getInstallationGrants.mockResolvedValueOnce([]);

      await expect(
        applyCertificateTemplate({
          installationId,
          courseId,
          orgId,
          userId,
          externalTemplateId: 'tmpl-1',
          externalTemplateVersion: 1,
          name: 'Test',
          design: {}
        })
      ).rejects.toThrow('Permission certificate.template:write is required');
    });
  });

  describe('listAvailableCertificateTemplatesForPlugin', () => {
    it('returns built-in starter templates', async () => {
      const templates = await listAvailableCertificateTemplatesForPlugin(installationId, orgId);

      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        version: 1,
        design: expect.any(Object)
      });
    });

    it('requires certificate.template:read scope', async () => {
      dbMocks.getInstallationGrants.mockResolvedValueOnce([]);

      await expect(listAvailableCertificateTemplatesForPlugin(installationId, orgId)).rejects.toThrow(
        'Permission certificate.template:read is required'
      );
    });
  });

  describe('getAppliedCertificateTemplateForPlugin', () => {
    it('returns applied design and source template when configured', async () => {
      dbMocks.getCourseWithOrgData.mockResolvedValueOnce({ orgId });
      dbMocks.getCourseById.mockResolvedValueOnce([
        {
          id: courseId,
          certificate: {
            isDownloadable: true,
            design: { templateId: 'noir', accentColor: '#d4af37' },
            sourceTemplate: {
              pluginId: 'com.example.certificate-provider',
              externalTemplateId: 'tmpl-1',
              version: 1,
              name: 'Executive Noir',
              appliedAt: '2026-01-01T00:00:00.000Z'
            }
          }
        }
      ]);

      const result = await getAppliedCertificateTemplateForPlugin(installationId, orgId, courseId);

      expect(result).toMatchObject({
        courseId,
        isDownloadable: true,
        design: expect.objectContaining({ templateId: 'noir' }),
        sourceTemplate: expect.objectContaining({ name: 'Executive Noir' })
      });
    });

    it('returns null design when no certificate is set on course', async () => {
      dbMocks.getCourseWithOrgData.mockResolvedValueOnce({ orgId });
      dbMocks.getCourseById.mockResolvedValueOnce([{ id: courseId, certificate: null }]);

      const result = await getAppliedCertificateTemplateForPlugin(installationId, orgId, courseId);

      expect(result).toEqual({
        courseId,
        isDownloadable: false,
        design: null,
        sourceTemplate: null
      });
    });

    it('rejects course not found in organization', async () => {
      dbMocks.getCourseWithOrgData.mockResolvedValueOnce({ orgId: 'other-org' });

      await expect(getAppliedCertificateTemplateForPlugin(installationId, orgId, courseId)).rejects.toThrow(
        'Course not found in this organization'
      );
    });
  });
});
