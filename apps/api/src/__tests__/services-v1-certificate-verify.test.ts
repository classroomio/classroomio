import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course/certificate-verification', () => ({
  getCertificateVerificationDetails: vi.fn()
}));

import { getCertificateVerificationDetails } from '@cio/db/queries/course/certificate-verification';
import { getCertificateStatus } from '@api/services/course/certificate-verification';
import { verifyPublicApiCertificateService } from '@api/services/v1/certificates/verify';
import { ErrorCodes } from '@api/utils/errors';

const VERIFICATION_ID = '33333333-3333-4333-8333-333333333333';

const stored = {
  id: VERIFICATION_ID,
  issuedAt: '2026-01-02 03:04:05+00',
  expiresAt: null,
  revokedAt: null,
  studentName: 'Ada Obi',
  courseTitle: 'Fire Safety',
  organizationName: 'Acme Academy'
};

describe('verifyPublicApiCertificateService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCertificateVerificationDetails).mockResolvedValue(stored);
  });

  it('returns only the fields printed on the certificate, plus its status', async () => {
    const result = await verifyPublicApiCertificateService({ verificationId: VERIFICATION_ID });

    expect(getCertificateVerificationDetails).toHaveBeenCalledWith(VERIFICATION_ID);
    expect(result).toEqual({
      verificationId: VERIFICATION_ID,
      status: 'valid',
      studentName: 'Ada Obi',
      courseTitle: 'Fire Safety',
      organizationName: 'Acme Academy',
      issuedAt: '2026-01-02 03:04:05+00',
      expiresAt: null,
      revokedAt: null
    });
  });

  it('returns null for an empty student name instead of an empty string', async () => {
    vi.mocked(getCertificateVerificationDetails).mockResolvedValue({ ...stored, studentName: '' });

    await expect(verifyPublicApiCertificateService({ verificationId: VERIFICATION_ID })).resolves.toMatchObject({
      studentName: null
    });
  });

  it('reports a revoked certificate as revoked with when it happened', async () => {
    vi.mocked(getCertificateVerificationDetails).mockResolvedValue({
      ...stored,
      revokedAt: '2026-02-01 00:00:00+00'
    });

    await expect(verifyPublicApiCertificateService({ verificationId: VERIFICATION_ID })).resolves.toMatchObject({
      status: 'revoked',
      revokedAt: '2026-02-01 00:00:00+00'
    });
  });

  it('throws 404 NOT_FOUND for an unknown id', async () => {
    vi.mocked(getCertificateVerificationDetails).mockResolvedValue(null);

    await expect(verifyPublicApiCertificateService({ verificationId: VERIFICATION_ID })).rejects.toMatchObject({
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND
    });
  });
});

describe('getCertificateStatus', () => {
  const now = new Date('2026-06-01T00:00:00Z');

  it('is valid when nothing is set, so certificates without an expiry never expire', () => {
    expect(getCertificateStatus({ expiresAt: null, revokedAt: null }, now)).toBe('valid');
  });

  it('is valid until the expiry and expired from it on', () => {
    expect(getCertificateStatus({ expiresAt: '2026-06-01T00:00:01Z', revokedAt: null }, now)).toBe('valid');
    expect(getCertificateStatus({ expiresAt: '2026-06-01T00:00:00Z', revokedAt: null }, now)).toBe('expired');
  });

  it('reads Postgres timestamp text', () => {
    expect(getCertificateStatus({ expiresAt: '2026-05-31 23:00:00+00', revokedAt: null }, now)).toBe('expired');
  });

  it('is revoked even when it has also expired', () => {
    expect(getCertificateStatus({ expiresAt: '2026-01-01T00:00:00Z', revokedAt: '2026-02-01T00:00:00Z' }, now)).toBe(
      'revoked'
    );
  });
});
