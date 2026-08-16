import { describe, expect, it } from 'vitest';

import {
  isPublishedComplianceMissingDeadline,
  resolveCourseCertificateDeadline
} from '../src/functions/compliance-deadline';

describe('isPublishedComplianceMissingDeadline', () => {
  it('is false for unpublished compliance courses', () => {
    expect(
      isPublishedComplianceMissingDeadline({
        type: 'COMPLIANCE',
        isPublished: false,
        deadline: null
      })
    ).toBe(false);
  });

  it('is false for published non-compliance courses without a deadline', () => {
    expect(
      isPublishedComplianceMissingDeadline({
        type: 'SELF_PACED',
        isPublished: true,
        deadline: null
      })
    ).toBe(false);
  });

  it('is true for published compliance courses without a deadline', () => {
    expect(
      isPublishedComplianceMissingDeadline({
        type: 'COMPLIANCE',
        isPublished: true,
        deadline: null
      })
    ).toBe(true);
  });

  it('treats blank deadlines as missing', () => {
    expect(
      isPublishedComplianceMissingDeadline({
        type: 'COMPLIANCE',
        isPublished: true,
        deadline: '   '
      })
    ).toBe(true);
  });

  it('is false when a published compliance course has a deadline', () => {
    expect(
      isPublishedComplianceMissingDeadline({
        type: 'COMPLIANCE',
        isPublished: true,
        deadline: '2026-12-31T23:59:00.000Z'
      })
    ).toBe(false);
  });
});

describe('resolveCourseCertificateDeadline', () => {
  it('keeps the stored deadline when certificate is not in the patch', () => {
    expect(resolveCourseCertificateDeadline('2026-12-31T23:59:00.000Z', undefined)).toBe('2026-12-31T23:59:00.000Z');
  });

  it('clears the deadline when the certificate patch omits it', () => {
    expect(resolveCourseCertificateDeadline('2026-12-31T23:59:00.000Z', {})).toBeNull();
  });

  it('uses the patched deadline when provided', () => {
    expect(resolveCourseCertificateDeadline('2026-01-01T00:00:00.000Z', { deadline: '2026-12-31T23:59:00.000Z' })).toBe(
      '2026-12-31T23:59:00.000Z'
    );
  });
});
