import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { DEFAULT_LOCALE } from '@/feature/i18n/constants/locales';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

const UNIT_KEYS = ['bytesKB', 'bytesMB', 'bytesGB', 'bytesTB'] as const;

export function formatBytes(bytes: number, locale: Locale = DEFAULT_LOCALE) {
  const t = createTranslator(downloadsCatalog, locale);
  const number = (value: number, fractionDigits: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: fractionDigits }).format(value);

  if (bytes < 1024) return bytes <= 0 ? t('bytesMB', { value: number(0, 0) }) : t('bytesKB', { value: number(1, 0) });

  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < UNIT_KEYS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return t(UNIT_KEYS[unit]!, { value: number(value, value >= 100 || unit === 0 ? 0 : 1) });
}
