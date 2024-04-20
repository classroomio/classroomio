import { LOCALE } from '../types';

export const LANGUAGE = {
  [LOCALE.EN]: 'English',
  [LOCALE.HI]: 'Hindi',
  [LOCALE.FR]: 'French',
  [LOCALE.PT]: 'Portuguese',
  [LOCALE.DE]: 'German',
  [LOCALE.VI]: 'Vietnamese',
  [LOCALE.RU]: 'Russian',
  [LOCALE.ES]: 'Spanish'
};

export const LANGUAGES = Object.keys(LANGUAGE).map((lang) => ({
  id: lang,
  text: LANGUAGE[lang]
}));
