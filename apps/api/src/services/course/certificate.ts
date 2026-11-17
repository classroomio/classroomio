import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseById, getOrganizationById, getProfileById, getCourseOrganizationId } from '@cio/db/queries';
import { getLatestCertificateByCourseProfile } from '@cio/db/queries/certificate/certificate';
import { resolveCertificateDesign, type CertificateRenderInput } from '@api/utils/certificate';
import type { TCertificateDownloadRequest } from '@cio/utils/validation/course';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { formatVerifyCode } from '@cio/utils/certificate/verify-code';
import { resolveCertificateStatus } from '@cio/utils/certificate/certificate-status';

/**
 * Loads the design + render data for a given course/student pair so the API
 * can hand it to `generateCertificatePdf` / `generateCertificatePng`.
 *
 * The client only sends `studentName` (+ optional studentId/issuedAt). Everything
 * else comes from the database: title, description, org name + logo, design.
 *
 * @param recipientProfileId server-resolved profile whose issued certificate supplies the verify code; never take it
 * from the request body, or a learner could print another learner's code.
 */
export async function assembleCertificateRender(
  courseId: string,
  body: TCertificateDownloadRequest,
  recipientProfileId?: string | null
): Promise<CertificateRenderInput> {
  const [courseRow] = await getCourseById(courseId);
  if (!courseRow) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const organizationId = await getCourseOrganizationId(courseId);
  const organization = organizationId ? await getOrganizationById(organizationId) : null;

  const design = resolveCertificateDesign(courseRow.certificate);

  const issuedAtIso = body.issuedAt ?? new Date().toISOString();
  const issuedAtDate = new Date(issuedAtIso);

  let verifyCode: string | null = null;
  let verifyUrl: string | null = null;
  let status: 'valid' | 'expired' | 'revoked' = 'valid';
  let latestIssue: Awaited<ReturnType<typeof getLatestCertificateByCourseProfile>> | null = null;
  let canonicalRecipientName: string | null = null;

  const baseUrl = getDashboardBaseUrl({
    siteName: organization?.siteName ?? null,
    customDomain: organization?.customDomain ?? null,
    isCustomDomainVerified: organization?.isCustomDomainVerified ?? null
  });

  if (body.previewMode) {
    verifyCode = '7KQM-4XH2';
    verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify?code=${encodeURIComponent(verifyCode)}`;
  } else if (recipientProfileId) {
    try {
      const issue = await getLatestCertificateByCourseProfile(courseId, recipientProfileId);
      latestIssue = issue ?? null;
      if (issue?.verifyCode) {
        verifyCode = formatVerifyCode(issue.verifyCode);
        verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify?code=${encodeURIComponent(verifyCode)}`;
      }
      if (issue) {
        status = resolveCertificateStatus({ revokedAt: issue.revokedAt, expiresAt: issue.expiresAt });
      }
      const profile = await getProfileById(recipientProfileId);
      canonicalRecipientName = profile?.fullname ?? null;
    } catch (error) {
      console.error('assembleCertificateRender getLatestCertificateByCourseProfile failed', {
        courseId,
        recipientProfileId,
        error
      });
      throw new AppError('Failed to load certificate verification', ErrorCodes.INTERNAL_ERROR, 500);
    }
  }

  const recipientName = body.previewMode ? body.studentName : (canonicalRecipientName ?? body.studentName);
  const effectiveIssuedAt = latestIssue?.issuedAt ?? issuedAtIso;
  const effectiveIssuedAtDate = new Date(effectiveIssuedAt);
  const date = Number.isNaN(effectiveIssuedAtDate.getTime())
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
    : effectiveIssuedAtDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const effectiveStudentId = body.previewMode ? body.studentId : (recipientProfileId ?? body.studentId);
  const certificateId = effectiveStudentId
    ? formatCertificateId(design.idFormat, effectiveStudentId, effectiveIssuedAtDate)
    : formatCertificateId(design.idFormat, fallbackSequence(effectiveIssuedAtDate), effectiveIssuedAtDate);

  return {
    design,
    data: {
      recipientName,
      courseName: courseRow.title,
      courseDescription: courseRow.description ?? '',
      orgName: organization?.name ?? '',
      orgLogoUrl: organization?.avatarUrl ?? undefined,
      date,
      certificateId,
      verifyCode,
      verifyUrl,
      status
    }
  };
}

export function formatCertificateId(format: string | undefined, seq: string, issuedAt: Date): string {
  const year = issuedAt.getFullYear();
  const month = String(issuedAt.getMonth() + 1).padStart(2, '0');
  const tail = seq.replace(/-/g, '').slice(-4).toUpperCase() || '0001';

  return (format ?? 'N° {seq}').replace('{seq}', tail).replace('{year}', String(year)).replace('{month}', month);
}

function fallbackSequence(issuedAt: Date): string {
  return String(issuedAt.getTime()).slice(-6);
}

export async function assembleOwnerPreviewRender(
  courseId: string,
  userId: string,
  body: TCertificateDownloadRequest
): Promise<CertificateRenderInput> {
  const studentName = body.studentName.trim().length
    ? body.studentName
    : (await getProfileById(userId))?.fullname || 'Preview Recipient';

  return assembleCertificateRender(courseId, { ...body, studentName });
}
