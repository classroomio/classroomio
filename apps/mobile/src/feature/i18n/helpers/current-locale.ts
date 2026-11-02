import { deviceLocale, getLocalePreference } from '@/feature/i18n/helpers/locale-store';
import type { Locale } from '@/feature/i18n/types/i18n';

function initialLocale(): Locale {
  const preference = getLocalePreference();

  return preference === 'system' ? deviceLocale() : preference;
}

let current = initialLocale();

/** The app language for code outside React, such as error messages and formatters called from callbacks. */
export function getCurrentLocale(): Locale {
  return current;
}

export function setCurrentLocale(locale: Locale) {
  current = locale;
}
