import { useMemo } from 'react';

import { useLocale } from '@/feature/i18n/helpers/use-locale';
import type { Locale } from '@/feature/i18n/types/i18n';

function createFormatters(locale: Locale) {
  const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const shortDateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  const numberFormat = new Intl.NumberFormat(locale);
  const percentFormat = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });

  return {
    locale,
    date: (value: Date) => dateFormat.format(value),
    shortDate: (value: Date) => shortDateFormat.format(value),
    time: (value: Date) => timeFormat.format(value),
    number: (value: number) => numberFormat.format(value),
    /** `value` is a 0–100 percentage. */
    percent: (value: number) => percentFormat.format(value / 100)
  };
}

export type Formatters = ReturnType<typeof createFormatters>;

/** Date, time and number formatting in the current app language. */
export function useFormatters(): Formatters {
  const locale = useLocale();

  return useMemo(() => createFormatters(locale), [locale]);
}
