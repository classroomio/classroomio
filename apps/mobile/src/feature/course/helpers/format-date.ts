import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import type { Locale } from '@/feature/i18n/types/i18n';

const DAY_MS = 24 * 60 * 60 * 1000;

const sessionFormats = new Map<Locale, Intl.DateTimeFormat>();
const dayFormats = new Map<Locale, Intl.DateTimeFormat>();

function sessionFormatFor(locale: Locale) {
  let format = sessionFormats.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
    sessionFormats.set(locale, format);
  }

  return format;
}

function dayFormatFor(locale: Locale) {
  let format = dayFormats.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    dayFormats.set(locale, format);
  }

  return format;
}

function toDate(value: string) {
  const time = parseTimestamp(value);

  return Number.isFinite(time) ? new Date(time) : null;
}

export function formatSessionTime(value: string, locale: Locale) {
  const date = toDate(value);

  return date ? sessionFormatFor(locale).format(date) : '';
}

export function formatDay(value: string, locale: Locale) {
  const date = toDate(value);

  return date ? dayFormatFor(locale).format(date) : '';
}

/** Whole calendar days from today to `value`; negative when it has passed. */
export function daysUntil(value: string, now = new Date()) {
  const date = toDate(value);
  if (!date) return 0;

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return Math.round((end - start) / DAY_MS);
}
