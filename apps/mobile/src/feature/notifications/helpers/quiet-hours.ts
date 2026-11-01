import type { Locale } from '@/feature/i18n/types/i18n';

const MINUTES_PER_DAY = 24 * 60;

export const QUIET_HOURS_STEP_MINUTES = 30;

export const DEFAULT_QUIET_HOURS = { startMinute: 21 * 60, endMinute: 7 * 60 };

export const QUIET_HOURS_OPTIONS = Array.from(
  { length: MINUTES_PER_DAY / QUIET_HOURS_STEP_MINUTES },
  (_, index) => index * QUIET_HOURS_STEP_MINUTES
);

/** A minute of the day as a clock time in `locale`, such as "21:00" or "9:00 PM". */
export function formatMinuteOfDay(minute: number, locale: Locale) {
  const date = new Date(2000, 0, 1, Math.floor(minute / 60), minute % 60);

  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
