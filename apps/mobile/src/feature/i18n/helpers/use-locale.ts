import { useAccountQuery } from '@/feature/account/api/account';
import { deviceLocale, toSupportedLocale, useLocalePreference } from '@/feature/i18n/helpers/locale-store';
import type { Locale } from '@/feature/i18n/types/i18n';

/** The app language: the in-app choice, else the profile's language, else the device language, else English. */
export function useLocale(): Locale {
  const preference = useLocalePreference();
  const account = useAccountQuery();
  if (preference !== 'system') return preference;

  return toSupportedLocale(account.data?.profile?.locale) ?? deviceLocale();
}
