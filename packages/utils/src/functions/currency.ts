const CURRENCY_LOCALES = {
  NGN: 'en-NG',
  USD: 'en-US',
  BRL: 'pt-BR'
} as const;

type SupportedCurrency = keyof typeof CURRENCY_LOCALES;

/** Locale-aware currency formatter for course prices (NGN, USD and BRL). */
export function getCurrencyFormatter(currency: string | undefined = 'USD') {
  const normalizedCurrency: SupportedCurrency =
    currency && currency in CURRENCY_LOCALES ? (currency as SupportedCurrency) : 'USD';

  return new Intl.NumberFormat(CURRENCY_LOCALES[normalizedCurrency], {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2
  });
}
