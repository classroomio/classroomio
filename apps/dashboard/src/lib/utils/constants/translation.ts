import type { TLocale } from '@cio/db/types';

export const LANGUAGE: Record<TLocale, string> = {
  da: 'Danish',
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  pl: 'Polish',
  pt: 'Portuguese',
  ru: 'Russian',
  vi: 'Vietnamese'
};

export const LANGUAGES = Object.keys(LANGUAGE).map((lang) => ({
  id: lang,
  text: LANGUAGE[lang]
}));
