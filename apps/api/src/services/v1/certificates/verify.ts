import type { TPublicApiVerifyCertificateParam } from '@cio/utils/validation/public-api';

import { getCertificateVerificationDetails } from '@cio/db/queries/course/certificate-verification';
import { getCertificateStatus } from '@api/services/course/certificate-verification';
import { AppError, ErrorCodes } from '@api/utils/errors';

/**
 * Returns only what is printed on the certificate, with its current status. Throws 404 for an unknown id.
 */
export async function verifyPublicApiCertificateService(params: TPublicApiVerifyCertificateParam) {
  const certificate = await getCertificateVerificationDetails(params.verificationId);
  if (!certificate) {
    throw new AppError('Certificate not found', ErrorCodes.NOT_FOUND, 404);
  }

  const status = getCertificateStatus(certificate);

  return {
    verificationId: certificate.id,
    status,
    studentName: certificate.studentName || null,
    courseTitle: certificate.courseTitle,
    organizationName: certificate.organizationName,
    issuedAt: certificate.issuedAt,
    expiresAt: certificate.expiresAt,
    revokedAt: certificate.revokedAt
  };
}
