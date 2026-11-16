import { describe, expect, it } from 'vitest';

import { getDefaultReportPeriod, getReportLinkStatus, toPeriodBounds } from './report-utils';

describe('report utils', () => {
  it('defaults the period to the last 30 days', () => {
    expect(getDefaultReportPeriod(new Date('2026-11-16T10:00:00Z'))).toEqual({
      start: '2026-10-17',
      end: '2026-11-16'
    });
  });

  it('turns dates into whole-day UTC bounds', () => {
    expect(toPeriodBounds('2026-10-17', '2026-11-16')).toEqual({
      periodStart: '2026-10-17T00:00:00.000Z',
      periodEnd: '2026-11-16T23:59:59.999Z'
    });
  });

  it('reports revoked before expired before active', () => {
    const now = new Date('2026-11-16T00:00:00Z');

    expect(getReportLinkStatus({ expiresAt: '2026-12-01T00:00:00Z', revokedAt: null }, now)).toBe('active');
    expect(getReportLinkStatus({ expiresAt: '2026-11-01T00:00:00Z', revokedAt: null }, now)).toBe('expired');
    expect(getReportLinkStatus({ expiresAt: '2026-12-01T00:00:00Z', revokedAt: '2026-11-10T00:00:00Z' }, now)).toBe(
      'revoked'
    );
  });
});
