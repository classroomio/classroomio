import { LOCALE } from '../types';

export const LANGUAGE = {
  [LOCALE.DE]: 'German',
  [LOCALE.EN]: 'English',
  [LOCALE.ES]: 'Spanish',
  [LOCALE.FR]: 'French',
  [LOCALE.HI]: 'Hindi',
  [LOCALE.PL]: 'Polish',
  [LOCALE.PT]: 'Portuguese',
  [LOCALE.RU]: 'Russian',
  [LOCALE.VI]: 'Vietnamese',
  [LOCALE.DA]: 'Danish'
};

export const LANGUAGES = Object.keys(LANGUAGE).map((lang) => ({
  id: lang,
  text: LANGUAGE[lang]
}));
