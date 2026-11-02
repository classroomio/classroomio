import { EMAIL_LOCALES } from '@cio/utils/email';

export const SUPPORTED_LOCALES = EMAIL_LOCALES;

export const DEFAULT_LOCALE = 'en';

export const LOCALE_PREFERENCE_STORAGE_KEY = 'classroomio.locale';

/** Each language named in itself, as language pickers conventionally show them. */
export const LOCALE_NAMES = {
  en: 'English',
  hi: 'हिन्दी',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  vi: 'Tiếng Việt',
  ru: 'Русский',
  es: 'Español',
  pl: 'Polski',
  da: 'Dansk',
  tr: 'Türkçe',
  it: 'Italiano'
} as const;
