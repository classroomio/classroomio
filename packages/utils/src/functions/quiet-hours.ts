const MINUTES_PER_DAY = 24 * 60;
const MINUTE_MS = 60_000;

export type QuietHours = {
  startMinute: number;
  endMinute: number;
  timezone: string;
};

/** Minutes past local midnight in `timezone`; falls back to UTC for an unknown zone. */
export function minuteOfDayInTimezone(date: Date, timezone: string): number {
  let parts: Intl.DateTimeFormatPart[];

  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date);
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);

  return hour * 60 + minute;
}

/** True when `now` falls inside the window. The window may wrap past midnight; equal start and end means no window. */
export function isWithinQuietHours(quietHours: QuietHours | null | undefined, now: Date): boolean {
  if (!quietHours || quietHours.startMinute === quietHours.endMinute) return false;

  const minute = minuteOfDayInTimezone(now, quietHours.timezone);
  const { startMinute, endMinute } = quietHours;

  if (startMinute < endMinute) return minute >= startMinute && minute < endMinute;

  return minute >= startMinute || minute < endMinute;
}

/** Milliseconds from `now` until the window ends, or 0 when `now` is outside it. */
export function millisecondsUntilQuietHoursEnd(quietHours: QuietHours | null | undefined, now: Date): number {
  if (!quietHours || !isWithinQuietHours(quietHours, now)) return 0;

  const minute = minuteOfDayInTimezone(now, quietHours.timezone);
  const minutesLeft = (quietHours.endMinute - minute + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const secondsIntoMinute = now.getUTCSeconds() * 1000 + now.getUTCMilliseconds();

  return Math.max(0, minutesLeft * MINUTE_MS - secondsIntoMinute);
}
