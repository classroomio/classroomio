import { getCalendars } from 'expo-localization';

/** The device's IANA time zone, falling back to the JS runtime's when the OS reports none. */
export function deviceTimeZone(): string {
  return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}
