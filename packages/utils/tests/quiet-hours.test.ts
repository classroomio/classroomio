import { describe, expect, it } from 'vitest';

import {
  isWithinQuietHours,
  millisecondsUntilQuietHoursEnd,
  minuteOfDayInTimezone
} from '../src/functions/quiet-hours';

const overnight = { startMinute: 21 * 60, endMinute: 7 * 60, timezone: 'Europe/London' };
const daytime = { startMinute: 9 * 60, endMinute: 17 * 60, timezone: 'UTC' };

describe('minuteOfDayInTimezone', () => {
  it('reads the local wall clock of the zone', () => {
    expect(minuteOfDayInTimezone(new Date('2026-01-15T22:30:00Z'), 'Europe/London')).toBe(22 * 60 + 30);
    expect(minuteOfDayInTimezone(new Date('2026-07-15T22:30:00Z'), 'Europe/London')).toBe(23 * 60 + 30);
    expect(minuteOfDayInTimezone(new Date('2026-01-15T22:30:00Z'), 'Asia/Tokyo')).toBe(7 * 60 + 30);
  });

  it('falls back to UTC for an unknown zone', () => {
    expect(minuteOfDayInTimezone(new Date('2026-01-15T10:05:00Z'), 'Not/AZone')).toBe(10 * 60 + 5);
  });
});

describe('isWithinQuietHours', () => {
  it('handles a window that wraps past midnight', () => {
    expect(isWithinQuietHours(overnight, new Date('2026-01-15T22:00:00Z'))).toBe(true);
    expect(isWithinQuietHours(overnight, new Date('2026-01-16T06:59:00Z'))).toBe(true);
    expect(isWithinQuietHours(overnight, new Date('2026-01-16T07:00:00Z'))).toBe(false);
    expect(isWithinQuietHours(overnight, new Date('2026-01-15T12:00:00Z'))).toBe(false);
  });

  it('handles a same-day window', () => {
    expect(isWithinQuietHours(daytime, new Date('2026-01-15T09:00:00Z'))).toBe(true);
    expect(isWithinQuietHours(daytime, new Date('2026-01-15T17:00:00Z'))).toBe(false);
  });

  it('treats a missing or empty window as outside quiet hours', () => {
    expect(isWithinQuietHours(null, new Date())).toBe(false);
    expect(isWithinQuietHours({ startMinute: 600, endMinute: 600, timezone: 'UTC' }, new Date())).toBe(false);
  });
});

describe('millisecondsUntilQuietHoursEnd', () => {
  it('counts down to the end of the window', () => {
    expect(millisecondsUntilQuietHoursEnd(overnight, new Date('2026-01-15T23:00:00Z'))).toBe(8 * 60 * 60_000);
    expect(millisecondsUntilQuietHoursEnd(overnight, new Date('2026-01-16T06:30:30Z'))).toBe(29 * 60_000 + 30_000);
  });

  it('is zero outside the window', () => {
    expect(millisecondsUntilQuietHoursEnd(overnight, new Date('2026-01-15T12:00:00Z'))).toBe(0);
  });
});
