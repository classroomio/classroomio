import {
  getCertificateByCourseProfile,
  verifyCodeExists,
  createCertificateIssue,
  updateCertificateVerifyCode
} from '@cio/db/queries/certificate/certificate';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { orgHasCertificatesEnabled } from '@api/services/course/certificate-plan';
import { generateVerifyCode } from '@cio/utils/certificate/verify-code';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { db } from '@cio/db/drizzle';

export interface EnsureCertificateIssueParams {
  courseId: string;
  profileId: string;
  cycleNumber?: number;
  issuedAt: string;
  expiresAt?: string | null;
  courseCompletionRecordId?: string | null;
  dbClient?: DbOrTxClient;
}

export async function ensureCertificateIssue(params: EnsureCertificateIssueParams) {
  const {
    courseId,
    profileId,
    cycleNumber = 1,
    issuedAt,
    expiresAt = null,
    courseCompletionRecordId = null,
    dbClient = db
  } = params;

  const organizationId = await getCourseOrganizationId(courseId, dbClient);
  if (!organizationId) return null;

  const certificatesEnabled = await orgHasCertificatesEnabled(organizationId);
  if (!certificatesEnabled) return null;

  const existing = await getCertificateByCourseProfile(courseId, profileId, cycleNumber, dbClient);
  if (existing) {
    if (existing.verifyCode) return existing;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const verifyCode = generateVerifyCode();
      if (await verifyCodeExists(verifyCode, dbClient)) continue;
      try {
        const updated = await updateCertificateVerifyCode(existing.id, verifyCode, dbClient);
        if (updated?.verifyCode) return updated;

        const refetched = await getCertificateByCourseProfile(courseId, profileId, cycleNumber, dbClient);
        if (refetched?.verifyCode) return refetched;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const causeMessage = error instanceof Error && error.cause ? String((error.cause as Error).message) : '';
        const combined = `${message} ${causeMessage}`;
        if (combined.includes('duplicate key') || combined.includes('unique')) continue;
        throw error;
      }
    }

    throw new Error('Failed to generate unique verify code for existing certificate after maximum attempts');
  }

  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const verifyCode = generateVerifyCode();

    const alreadyExists = await verifyCodeExists(verifyCode, dbClient);
    if (alreadyExists) continue;

    try {
      const created = await createCertificateIssue(
        {
          courseId,
          profileId,
          courseCompletionRecordId,
          cycleNumber,
          issuedAt,
          expiresAt,
          status: 'valid',
          verifyCode,
          metadata: {}
        },
        dbClient
      );

      if (created) return created;

      const raced = await getCertificateByCourseProfile(courseId, profileId, cycleNumber, dbClient);
      if (raced) return raced;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const causeMessage = error instanceof Error && error.cause ? String((error.cause as Error).message) : '';
      const combined = `${message} ${causeMessage}`;
      const isUniqueViolation = combined.includes('duplicate key') || combined.includes('unique');

      if (isUniqueViolation) {
        const raced = await getCertificateByCourseProfile(courseId, profileId, cycleNumber, dbClient);
        if (raced) return raced;

        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed to generate unique verify code after maximum attempts');
}

export function computeStandardCertificateExpiresAt(
  issuedAtIso: string,
  courseCertificate: { expiresAfterMonths?: number | null; validityMonths?: number | null } | null | undefined
): string | null {
  const months = courseCertificate?.expiresAfterMonths ?? courseCertificate?.validityMonths ?? null;

  if (!months || months <= 0) return null;

  const issuedAt = new Date(issuedAtIso);
  if (Number.isNaN(issuedAt.getTime())) return null;

  const expiresAt = new Date(issuedAt);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  return expiresAt.toISOString();
}
