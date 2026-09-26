import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TLearningPathCertificateDownloadRequest } from '@cio/utils/validation/learning-path';
import { getLearningPathCertificate, getMemberByPathAndProfile } from '@cio/db/queries/learning-path';
import { getOrganizationById } from '@cio/db/queries';
import {
  buildCertificateRenderInput,
  resolveCertificateDesign,
  resolveCertificateRecipientName,
  type CertificateRenderInput
} from '@api/utils/certificate';

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';

export type TIssuedLearningPathCertificate = {
  certificateId: string;
  issuedAt: string;
};

async function resolvePathCertificateContext(pathId: string, userId: string) {
  const path = await resolveLearningPath(pathId);

  const organization = await getOrganizationById(path.organizationId);

  const design = resolveCertificateDesign(path.certificate);

  const studentName = await resolveCertificateRecipientName(userId);

  const orgName = organization?.name ?? '';
  const orgLogoUrl = organization?.avatarUrl ?? undefined;

  return { path, design, studentName, orgName, orgLogoUrl };
}

/**
 * Throws unless the caller can preview the path certificate design.
 */
export async function assertLearningPathCertificatePreviewAllowed(
  pathId: string,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<void> {
  const path = await resolveLearningPath(pathId);

  await assertCanManageLearningPath(path, userId, orgRoles);
}

/**
 * Throws unless the caller completed the path and a certificate was issued.
 * Returns the issued record so the render uses the stored id/date instead of client input.
 */
export async function assertLearningPathCertificateDownloadAllowed(
  pathId: string,
  userId: string
): Promise<TIssuedLearningPathCertificate> {
  const path = await resolveLearningPath(pathId);
  const member = await getMemberByPathAndProfile(path.id, userId);

  if (!member || member.removedAt || member.status !== 'COMPLETED' || !path.certificate?.isDownloadable) {
    throw new AppError('Certificate not available', ErrorCodes.UNAUTHORIZED, 403);
  }

  const issued = await getLearningPathCertificate(member.id);

  if (!issued) {
    throw new AppError('Certificate not found', ErrorCodes.LEARNING_PATH_CERTIFICATE_NOT_FOUND, 404);
  }

  const certificateId = issued.certificateId;
  const issuedAt = issued.issuedAt;

  return { certificateId, issuedAt };
}

/**
 * Preview render for path team members. A caller-supplied sample name is
 * allowed here only (permission-gated); student download ignores it.
 */
export async function assembleLearningPathOwnerPreviewRender(
  pathId: string,
  userId: string,
  body: TLearningPathCertificateDownloadRequest
): Promise<CertificateRenderInput> {
  const context = await resolvePathCertificateContext(pathId, userId);
  const previewName = body.studentName?.trim() || context.studentName;

  return buildCertificateRenderInput(context.design, {
    recipientName: previewName,
    courseName: context.path.name,
    courseDescription: context.path.description ?? '',
    orgName: context.orgName,
    orgLogoUrl: context.orgLogoUrl,
    studentId: body.studentId,
    issuedAt: body.issuedAt
  });
}

/**
 * Student download render. The certificate id/date always come from the
 * issued record — never from the request body.
 */
export async function assembleLearningPathCertificateRender(
  pathId: string,
  userId: string,
  body: TLearningPathCertificateDownloadRequest,
  issued: TIssuedLearningPathCertificate
): Promise<CertificateRenderInput> {
  // Student download must resolve recipient name from profile, ignoring client input
  const context = await resolvePathCertificateContext(pathId, userId);

  return buildCertificateRenderInput(context.design, {
    recipientName: context.studentName,
    courseName: context.path.name,
    courseDescription: context.path.description ?? '',
    orgName: context.orgName,
    orgLogoUrl: context.orgLogoUrl,
    certificateId: issued.certificateId,
    issuedAt: issued.issuedAt
  });
}
