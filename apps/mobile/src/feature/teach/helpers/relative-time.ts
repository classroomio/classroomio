import type { Locale } from '@/feature/i18n/types/i18n';
import type { Translator } from '@/feature/i18n/helpers/translate';
import type { en } from '@/feature/teach/translations/en';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type ElapsedUnit = 'days' | 'hours' | 'minutes';

export type Elapsed = { unit: ElapsedUnit; count: number };

type TeachKey = keyof typeof en & string;

export const WAITING_KEYS = {
  days: 'waitingDays',
  hours: 'waitingHours',
  minutes: 'waitingMinutes'
} as const satisfies Record<ElapsedUnit, TeachKey>;

export const AGO_KEYS = {
  days: 'agoDays',
  hours: 'agoHours',
  minutes: 'agoMinutes'
} as const satisfies Record<ElapsedUnit, TeachKey>;

export const OLDEST_WAITED_KEYS = {
  days: 'oldestWaitedDays',
  hours: 'oldestWaitedHours',
  minutes: 'oldestWaitedMinutes'
} as const satisfies Record<ElapsedUnit, TeachKey>;

/** Elapsed time in the largest whole unit: 4 days, 6 hours or 12 minutes. */
export function elapsedSince(iso: string | null | undefined, now = Date.now()): Elapsed | null {
  if (!iso) return null;

  const elapsed = Math.max(0, now - new Date(iso).getTime());
  if (elapsed >= DAY) return { unit: 'days', count: Math.floor(elapsed / DAY) };
  if (elapsed >= HOUR) return { unit: 'hours', count: Math.floor(elapsed / HOUR) };

  return { unit: 'minutes', count: Math.max(1, Math.floor(elapsed / MINUTE)) };
}

/** Elapsed time since `iso` worded by one of the unit key sets, such as "Waiting 4 days" or "4 days ago". */
export function elapsedCopy(
  t: Translator<typeof en>,
  keys: Record<ElapsedUnit, TeachKey>,
  iso: string | null | undefined
) {
  const elapsed = elapsedSince(iso);

  return elapsed ? t(keys[elapsed.unit], { count: elapsed.count }) : null;
}

/** Whole days elapsed, for ranking how long something has waited. */
export function daysSince(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return 0;

  return Math.floor(Math.max(0, now - new Date(iso).getTime()) / DAY);
}

export function formatDateTime(iso: string | null | undefined, locale: Locale) {
  if (!iso) return '';

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(iso));
}
