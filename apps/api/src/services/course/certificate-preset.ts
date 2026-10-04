import { getCourseById, getOrgIdByCourseId, updateCourse } from '@cio/db/queries/course';
import { getOrgCertificatePreset } from '@cio/db/queries/plugins/org-certificate-preset';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertOrgCapabilityEnabled } from '@api/services/plugin/org-capability';
import type { StoredCertificateRecord, StoredCertificateDesign } from '@cio/certificates';
import type { TCourse } from '@db/types';

/**
 * Applies an organization certificate preset to a course.
 * Verifies:
 * 1. Certificate Studio capability is active.
 * 2. Course belongs to the given orgId.
 * 3. Preset belongs to the course's organization and is active.
 * 4. Copies complete design snapshot onto course.certificate with sourcePresetId.
 */
export async function applyCertificatePresetToCourseService(
  orgId: string,
  courseId: string,
  presetId: string
): Promise<TCourse> {
  if (!orgId || !courseId || !presetId) {
    throw new AppError('orgId, courseId, and presetId are required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await assertOrgCapabilityEnabled(orgId, 'certificate_studio');

  const [course] = await getCourseById(courseId);
  if (!course) {
    throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
  }

  const courseOrgId = await getOrgIdByCourseId(courseId);
  if (courseOrgId !== orgId) {
    throw new AppError('Course does not belong to this organization', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }

  const preset = await getOrgCertificatePreset(orgId, presetId);
  if (!preset || !preset.isActive) {
    throw new AppError('Certificate preset not found or inactive', ErrorCodes.NOT_FOUND, 404);
  }

  const currentCertificate = (course.certificate as StoredCertificateRecord) ?? {};
  const presetDesign = structuredClone(preset.design as StoredCertificateDesign);
  const rendererTemplateId = presetDesign.rendererTemplateId ?? presetDesign.templateId ?? 'classique';

  const snapshotDesign: StoredCertificateDesign = {
    ...presetDesign,
    sourcePresetId: preset.id,
    rendererTemplateId
  };

  const updatedCertificate: StoredCertificateRecord = {
    ...currentCertificate,
    design: snapshotDesign
  };

  const certificateUpdate = updatedCertificate as TCourse['certificate'];
  const updatedCourse = await updateCourse(courseId, {
    certificate: certificateUpdate
  });

  return updatedCourse;
}
