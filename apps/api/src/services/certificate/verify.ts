import { getCertificateByVerifyCode } from '@cio/db/queries/certificate/certificate';
import { getCourseById, getOrganizationById, getProfileById } from '@cio/db/queries';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { normalizeVerifyCode, formatVerifyCode } from '@cio/utils/certificate/verify-code';
import { resolveCertificateStatus } from '@cio/utils/certificate/certificate-status';
import { resolveCertificateDesign } from '@cio/certificates';

export interface VerifyPublicView {
  status: 'valid' | 'expired' | 'revoked';
  recipientName: string;
  courseTitle: string;
  orgName: string;
  orgLogoUrl?: string;
  accentColor: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  certificateCode: string;
}

export async function getVerifyCertificatePublicView(rawCode: string): Promise<VerifyPublicView | null> {
  const normalized = normalizeVerifyCode(rawCode);
  if (!normalized) return null;

  const issue = await getCertificateByVerifyCode(normalized);
  if (!issue) return null;

  const [courseRow] = await getCourseById(issue.courseId);
  if (!courseRow) return null;

  const organizationId = await getCourseOrganizationId(issue.courseId);
  const organization = organizationId ? await getOrganizationById(organizationId) : null;
  const profile = await getProfileById(issue.profileId);

  if (!profile) return null;

  const status = resolveCertificateStatus({ revokedAt: issue.revokedAt, expiresAt: issue.expiresAt });

  const design = resolveCertificateDesign(courseRow.certificate);
  const accentColor = design.accentColor;

  return {
    status,
    recipientName: profile.fullname ?? 'Recipient',
    courseTitle: courseRow.title,
    orgName: organization?.name ?? 'Organization',
    orgLogoUrl: organization?.avatarUrl ?? undefined,
    accentColor,
    issuedAt: issue.issuedAt,
    expiresAt: issue.expiresAt ?? null,
    revokedAt: issue.revokedAt ?? null,
    certificateCode: formatVerifyCode(issue.verifyCode ?? normalized)
  };
}
