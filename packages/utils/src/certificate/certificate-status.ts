export type CertificateStatus = 'valid' | 'expired' | 'revoked';

export interface CertificateStatusInput {
  revokedAt?: string | Date | null;
  expiresAt?: string | Date | null;
}

export function resolveCertificateStatus(input: CertificateStatusInput, now: Date = new Date()): CertificateStatus {
  if (input.revokedAt) return 'revoked';

  if (input.expiresAt) {
    const expiresAt = input.expiresAt instanceof Date ? input.expiresAt : new Date(input.expiresAt);

    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime()) {
      return 'expired';
    }
  }

  return 'valid';
}
