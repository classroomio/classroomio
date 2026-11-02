import { LOCALE_NAMES, SUPPORTED_LOCALES } from '@/feature/i18n/constants/locales';
import type { Locale } from '@/feature/i18n/types/i18n';

/** Supported languages, each named in itself, in alphabetical order of those names. */
export const LANGUAGE_OPTIONS: { locale: Locale; name: string }[] = SUPPORTED_LOCALES.map((locale) => ({
  locale,
  name: LOCALE_NAMES[locale]
})).sort((left, right) => left.name.localeCompare(right.name));
