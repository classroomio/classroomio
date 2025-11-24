import { config, loadTranslations } from '$lib/utils/functions/translations';

const SUPPORTED_LANGUAGES = config?.loaders?.map((loader) => loader.locale) || [];

export const load = async ({ url, data }) => {
  const { pathname } = url;

  const serverLang = data.serverLang.split('-')[0];

  const userLocale = data.locals?.profile?.locale || getInitialLocale(serverLang);

  const initLocale = getInitialLocale(userLocale);
  await loadTranslations(initLocale, pathname); // keep this just before the `return`

  return data;
};

function getInitialLocale(lang: string): string {
  const locale = lang.split('-')[0];

  if (SUPPORTED_LANGUAGES.includes(locale)) return locale;

  return 'en';
}
