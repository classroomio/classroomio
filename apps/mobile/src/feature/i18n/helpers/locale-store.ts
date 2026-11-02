import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import { DEFAULT_LOCALE, LOCALE_PREFERENCE_STORAGE_KEY, SUPPORTED_LOCALES } from '@/feature/i18n/constants/locales';
import type { Locale, LocalePreference } from '@/feature/i18n/types/i18n';

export function toSupportedLocale(value: string | null | undefined): Locale | null {
  const language = value?.toLowerCase().split(/[-_]/)[0];

  return SUPPORTED_LOCALES.find((locale) => locale === language) ?? null;
}

function parse(value: string | null): LocalePreference {
  return toSupportedLocale(value) ?? 'system';
}

let preference = parse(SecureStore.getItem(LOCALE_PREFERENCE_STORAGE_KEY));
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getLocalePreference() {
  return preference;
}

export function setLocalePreference(next: LocalePreference) {
  preference = next;
  SecureStore.setItem(LOCALE_PREFERENCE_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useLocalePreference() {
  return useSyncExternalStore(subscribe, getLocalePreference);
}

/** The first device language the app supports, else English. */
export function deviceLocale(): Locale {
  for (const entry of getLocales()) {
    const supported = toSupportedLocale(entry.languageCode);
    if (supported) return supported;
  }

  return DEFAULT_LOCALE;
}
