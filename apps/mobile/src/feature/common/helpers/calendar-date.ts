import { commonCatalog } from '@/feature/common/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const calendarDateFormats = new Map<Locale, Intl.DateTimeFormat>();

/** Formats an ISO timestamp as a short calendar date in `locale` (the app language by default), such as "8 Nov 2026". */
export function formatCalendarDate(iso: string, locale: Locale = getCurrentLocale()) {
  let format = calendarDateFormats.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    calendarDateFormats.set(locale, format);
  }

  return format.format(new Date(iso));
}

/** Whole calendar days from today to the date: 0 for today, negative once it has passed. */
export function calendarDaysUntil(iso: string, now = new Date()) {
  const target = new Date(iso);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const day = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

  return Math.round((day - today) / MILLISECONDS_PER_DAY);
}

/** "1 day", "3 days" in `locale` (the app language by default), for the absolute value of `days`. */
export function formatDayCount(days: number, locale: Locale = getCurrentLocale()) {
  return createTranslator(commonCatalog, locale)('dayCount', { count: Math.abs(days) });
}
