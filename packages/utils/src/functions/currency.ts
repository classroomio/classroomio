/** Locale-aware currency formatter for course and path prices (NGN and USD). */
export const CURRENCY_FRACTION_MIN_DIGITS = 2;

export function getCurrencyFormatter(currency: string | undefined = 'USD') {
  const normalizedCurrency = currency === 'NGN' ? 'NGN' : 'USD';
  const locale = normalizedCurrency === 'NGN' ? 'en-NG' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: CURRENCY_FRACTION_MIN_DIGITS
  });
}
