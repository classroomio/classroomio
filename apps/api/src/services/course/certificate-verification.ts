import type { TPublicApiCertificateVerificationStatus } from '@cio/utils/validation/public-api';

type CertificateValidity = {
  expiresAt: string | null;
  revokedAt: string | null;
};

/**
 * Revoked wins over expired; a certificate with no expiry never expires.
 */
export function getCertificateStatus(
  certificate: CertificateValidity,
  now: Date = new Date()
): TPublicApiCertificateVerificationStatus {
  if (certificate.revokedAt) return 'revoked';

  if (certificate.expiresAt && new Date(certificate.expiresAt).getTime() <= now.getTime()) return 'expired';

  return 'valid';
}
