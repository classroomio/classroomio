import { STREAK_HISTORY_DAYS, STREAK_MILESTONE_DAYS } from '../constants/learner-goals';

/** A calendar day in the learner's time zone, as `YYYY-MM-DD`. */
export type DayKey = string;

export type StreakSummary = {
  current: number;
  best: number;
  activeToday: boolean;
  lastActiveDay: DayKey | null;
};

export type StreakDay = { date: DayKey; active: boolean; isWeekend: boolean };

export type StreakMilestone = { days: number; achieved: boolean; daysRemaining: number };

const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string) {
  const cached = dayFormatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  });
  dayFormatterCache.set(timeZone, formatter);

  return formatter;
}

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;

  try {
    dayFormatter(timeZone);

    return true;
  } catch {
    return false;
  }
}

/** The time zone to count days in: the learner's when it is a valid IANA zone, else UTC. */
export function resolveTimeZone(timeZone: string | null | undefined): string {
  return isValidTimeZone(timeZone) ? timeZone : 'UTC';
}

function localParts(at: Date, timeZone: string) {
  const parts = dayFormatter(resolveTimeZone(timeZone)).formatToParts(at);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';

  return { day: `${value('year')}-${value('month')}-${value('day')}`, hour: Number(value('hour')) };
}

function toDate(at: Date | string): Date {
  if (at instanceof Date) return at;

  const isoLike = at.includes('T') ? at : at.replace(' ', 'T');
  const hasZone = /([zZ]|[+-]\d{2}(:?\d{2})?)$/.test(isoLike);

  return new Date(hasZone ? isoLike.replace(/([+-]\d{2})$/, '$1:00') : `${isoLike}Z`);
}

/** A Postgres timestamp as ISO 8601 UTC; a value without a zone is read as UTC. Null when missing or unreadable. */
export function toIsoTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = toDate(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function localDayKey(at: Date | string, timeZone: string): DayKey {
  return localParts(toDate(at), timeZone).day;
}

export function localHour(at: Date, timeZone: string): number {
  return localParts(at, timeZone).hour;
}

function dayToUtc(day: DayKey): number {
  return Date.parse(`${day}T00:00:00Z`);
}

export function addDays(day: DayKey, delta: number): DayKey {
  return new Date(dayToUtc(day) + delta * DAY_MS).toISOString().slice(0, 10);
}

export function isWeekendDay(day: DayKey): boolean {
  const weekday = new Date(dayToUtc(day)).getUTCDay();

  return weekday === 0 || weekday === 6;
}

/** Monday of the ISO week containing `day`. */
export function startOfIsoWeek(day: DayKey): DayKey {
  const weekday = new Date(dayToUtc(day)).getUTCDay();
  const sinceMonday = (weekday + 6) % 7;

  return addDays(day, -sinceMonday);
}

/**
 * Consecutive days with learning activity, counted in the learner's local days. Saturday and Sunday never break a
 * streak (activity on them still counts), and today never breaks it because the day is not over yet.
 */
export function computeActivityStreak(activeDays: Iterable<DayKey>, today: DayKey): StreakSummary {
  const active = new Set([...activeDays].filter((day) => day <= today));
  if (active.size === 0) return { current: 0, best: 0, activeToday: false, lastActiveDay: null };

  const sorted = [...active].sort();
  const earliest = sorted[0];
  const lastActiveDay = sorted[sorted.length - 1];

  let current = 0;
  for (let day = today; day >= earliest; day = addDays(day, -1)) {
    if (active.has(day)) {
      current += 1;
      continue;
    }

    if (day === today || isWeekendDay(day)) continue;

    break;
  }

  let best = 0;
  let run = 0;
  for (let day = earliest; day <= today; day = addDays(day, 1)) {
    if (active.has(day)) {
      run += 1;
      best = Math.max(best, run);
      continue;
    }

    if (day === today || isWeekendDay(day)) continue;

    run = 0;
  }

  return { current, best, activeToday: active.has(today), lastActiveDay };
}

/** The last `count` local days ending today, oldest first. */
export function recentStreakDays(
  activeDays: Iterable<DayKey>,
  today: DayKey,
  count: number = STREAK_HISTORY_DAYS
): StreakDay[] {
  const active = new Set(activeDays);

  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index - (count - 1));

    return { date, active: active.has(date), isWeekend: isWeekendDay(date) };
  });
}

export function streakMilestones(streak: Pick<StreakSummary, 'current' | 'best'>): StreakMilestone[] {
  return STREAK_MILESTONE_DAYS.map((days) => {
    const achieved = streak.best >= days;

    return { days, achieved, daysRemaining: achieved ? 0 : Math.max(0, days - streak.current) };
  });
}
