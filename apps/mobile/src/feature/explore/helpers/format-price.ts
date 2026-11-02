import type { Locale } from '@/feature/i18n/types/i18n';

/** `amount` in `currency` for `locale`, or the bare number with the currency code when the code is not ISO 4217. */
export function formatPrice(amount: number, currency: string | null, locale: Locale) {
  if (!currency) return new Intl.NumberFormat(locale).format(amount);

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${new Intl.NumberFormat(locale).format(amount)}`;
  }
}
