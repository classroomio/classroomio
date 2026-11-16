const DAY_MS = 24 * 60 * 60 * 1000;

/** The `YYYY-MM-DD` value a date input expects. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The default report period: the last 30 days up to today. */
export function getDefaultReportPeriod(now = new Date()): { start: string; end: string } {
  return { start: toDateInputValue(new Date(now.getTime() - 30 * DAY_MS)), end: toDateInputValue(now) };
}

/** Whole-day bounds in UTC for a pair of `YYYY-MM-DD` values, as the ISO timestamps the API expects. */
export function toPeriodBounds(start: string, end: string): { periodStart: string; periodEnd: string } {
  return { periodStart: `${start}T00:00:00.000Z`, periodEnd: `${end}T23:59:59.999Z` };
}

export type ReportLinkStatus = 'active' | 'expired' | 'revoked';

export function getReportLinkStatus(report: { expiresAt: string; revokedAt: string | null }, now = new Date()) {
  if (report.revokedAt) return 'revoked' satisfies ReportLinkStatus;
  if (new Date(report.expiresAt).getTime() <= now.getTime()) return 'expired' satisfies ReportLinkStatus;

  return 'active' satisfies ReportLinkStatus;
}
