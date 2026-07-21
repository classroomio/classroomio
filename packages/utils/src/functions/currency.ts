/** Locale-aware currency formatter for course prices (NGN and USD). */
export function getCurrencyFormatter(currency: string | undefined = 'USD') {
  const normalizedCurrency = currency === 'NGN' ? 'NGN' : 'USD';
  const locale = normalizedCurrency === 'NGN' ? 'en-NG' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2
  });
}
