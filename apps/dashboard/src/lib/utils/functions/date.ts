import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

/** The browser's IANA timezone (e.g. "America/New_York"), with a UTC fallback. */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Convert a `datetime-local` wall-clock string (e.g. "2026-06-20T14:00") that the
 * user intends in `timeZone` into an absolute UTC instant (ISO string). DST-safe.
 * Never use `new Date(wallClock).toISOString()` — that assumes the browser zone.
 */
export function zonedWallClockToInstant(wallClock: string, timeZone: string): string {
  if (!wallClock) return '';

  return dayjs.tz(wallClock, timeZone).toISOString();
}

/**
 * Inverse of {@link zonedWallClockToInstant}: render an absolute instant as a
 * `datetime-local` wall-clock string in `timeZone` (so editing shows the same
 * local time the user set).
 */
export function instantToZonedWallClock(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return '';

  return dayjs(iso).tz(timeZone).format('YYYY-MM-DDTHH:mm');
}

export const calDateDiff = (date: string | number | Date): string => {
  return dayjs(date).fromNow(true) + ` ago`;
};

export const getGreeting = () => {
  const date = new Date();
  const hours = date.getHours();
  return hours < 12
    ? 'dashboard.morning_heading'
    : hours < 18
      ? 'dashboard.afternoon_heading'
      : 'dashboard.evening_heading';
};
