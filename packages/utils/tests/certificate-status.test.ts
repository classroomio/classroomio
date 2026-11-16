import { describe, expect, it } from 'vitest';

import { resolveCertificateStatus } from '../src/certificate/certificate-status';

describe('resolveCertificateStatus', () => {
  const now = new Date('2026-11-11T12:00:00.000Z');

  it('returns valid when no revoked or expiry', () => {
    expect(resolveCertificateStatus({}, now)).toBe('valid');
    expect(resolveCertificateStatus({ expiresAt: null }, now)).toBe('valid');
  });

  it('returns valid when expiresAt is in the future', () => {
    expect(resolveCertificateStatus({ expiresAt: '2027-01-01T00:00:00.000Z' }, now)).toBe('valid');
    expect(resolveCertificateStatus({ expiresAt: new Date('2027-01-01') }, now)).toBe('valid');
  });

  it('returns expired when expiresAt is in the past', () => {
    expect(resolveCertificateStatus({ expiresAt: '2026-01-01T00:00:00.000Z' }, now)).toBe('expired');
    expect(resolveCertificateStatus({ expiresAt: new Date('2025-12-31T23:59:59.999Z') }, now)).toBe('expired');
  });

  it('returns expired when expiresAt equals now', () => {
    expect(resolveCertificateStatus({ expiresAt: now.toISOString() }, now)).toBe('expired');
  });

  it('revoked wins over expired and valid', () => {
    expect(
      resolveCertificateStatus({ revokedAt: '2026-10-01T00:00:00.000Z', expiresAt: '2025-01-01T00:00:00.000Z' }, now)
    ).toBe('revoked');
    expect(resolveCertificateStatus({ revokedAt: new Date('2026-10-01'), expiresAt: null }, now)).toBe('revoked');
  });

  it('handles invalid expiresAt as valid', () => {
    expect(resolveCertificateStatus({ expiresAt: 'not-a-date' }, now)).toBe('valid');
  });
});
