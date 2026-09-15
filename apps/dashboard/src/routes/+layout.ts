import { config, ensureTranslations, getPersistedLocale } from '$lib/utils/functions/translations';

const SUPPORTED_LANGUAGES = config?.loaders?.map((loader) => loader.locale) || [];

export const load = async ({ data }) => {
  const serverLang = data?.serverLang?.split?.('-')?.[0] || 'en';
  const persistedLocale = data?.localeCookie || getPersistedLocale();

  const userLocale = persistedLocale || data?.locals?.profile?.locale || getInitialLocale(serverLang);

  const initLocale = getInitialLocale(userLocale);
  const translationsStart = performance.now();
  await ensureTranslations(initLocale); // keep this just before the `return`
  const translationsMs = Math.round((performance.now() - translationsStart) * 100) / 100;
  console.log(`[+layout.ts] ensureTranslations: ${translationsMs}ms | locale=${initLocale}`);

  return data ?? {};
};

function getInitialLocale(lang: string): string {
  const locale = lang.split('-')[0];

  if (SUPPORTED_LANGUAGES.includes(locale)) return locale;

  return 'en';
}
