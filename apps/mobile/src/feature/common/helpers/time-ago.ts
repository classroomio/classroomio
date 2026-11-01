import { commonCatalog } from '@/feature/common/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const formatCache = new Map<string, Intl.DateTimeFormat>();

function dateTimeFormat(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let format = formatCache.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    formatCache.set(key, format);
  }

  return format;
}

/** Parses ISO and Postgres-style timestamps ("2026-10-31 18:19:38.126846+00"), which Hermes does not read natively. */
export function parseTimestamp(value: string) {
  const normalized = value
    .trim()
    .replace(' ', 'T')
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/(T[\d:.]+[+-]\d{2})$/, '$1:00');

  return new Date(normalized).getTime();
}

/** Compact age of a timestamp in `locale`: "now", "5m", "3h", "2d", "3w", then a calendar date. */
export function timeAgo(iso: string | null | undefined, now = Date.now(), locale: Locale = getCurrentLocale()) {
  if (!iso) return '';

  const time = parseTimestamp(iso);
  if (!Number.isFinite(time)) return '';

  const t = createTranslator(commonCatalog, locale);
  const elapsed = Math.max(0, now - time);
  if (elapsed < MINUTE) return t('timeNow');
  if (elapsed < HOUR) return t('timeMinutes', { count: Math.floor(elapsed / MINUTE) });
  if (elapsed < DAY) return t('timeHours', { count: Math.floor(elapsed / HOUR) });
  if (elapsed < WEEK) return t('timeDays', { count: Math.floor(elapsed / DAY) });
  if (elapsed < 5 * WEEK) return t('timeWeeks', { count: Math.floor(elapsed / WEEK) });

  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear();

  return dateTimeFormat(
    locale,
    sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }
  ).format(new Date(time));
}

/** Spoken form of a timestamp for accessibility labels, such as "8 Nov 2026, 14:05". */
export function spokenDateTime(iso: string | null | undefined, locale: Locale = getCurrentLocale()) {
  if (!iso) return '';

  return dateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(parseTimestamp(iso)));
}
