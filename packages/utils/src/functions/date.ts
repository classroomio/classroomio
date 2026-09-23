/**
 * Returns the start of the current month in UTC (first day of the month at 00:00:00.000Z).
 */
export function startOfCurrentMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Returns the start of the previous month in UTC (first day of the previous month at 00:00:00.000Z).
 */
export function startOfPreviousMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
}

/**
 * Returns the start of the next month in UTC (first day of the next month at 00:00:00.000Z).
 */
export function startOfNextMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

/**
 * Returns the timestamp from 90 days ago in UTC.
 */
export function startOfLast90DaysUtc(now: Date = new Date()): Date {
  return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
}
