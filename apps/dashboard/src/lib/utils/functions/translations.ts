import type { TLocale } from '@cio/db/types';
import i18n from '@sveltekit-i18n/base';
import parser from '@sveltekit-i18n/parser-icu';
import { writable } from 'svelte/store';

export const config = {
  parser: parser(),
  loaders: [
    {
      locale: 'en',
      key: '',
      loader: async () => (await import('../translations/en.json')).default
    },
    {
      locale: 'hi',
      key: '',
      loader: async () => (await import('../translations/hi.json')).default
    },
    {
      locale: 'fr',
      key: '',
      loader: async () => (await import('../translations/fr.json')).default
    },
    {
      locale: 'pl',
      key: '',
      loader: async () => (await import('../translations/pl.json')).default
    },
    {
      locale: 'pt',
      key: '',
      loader: async () => (await import('../translations/pt.json')).default
    },
    {
      locale: 'de',
      key: '',
      loader: async () => (await import('../translations/de.json')).default
    },
    {
      locale: 'vi',
      key: '',
      loader: async () => (await import('../translations/vi.json')).default
    },
    {
      locale: 'ru',
      key: '',
      loader: async () => (await import('../translations/ru.json')).default
    },
    {
      locale: 'es',
      key: '',
      loader: async () => (await import('../translations/es.json')).default
    },
    {
      locale: 'da',
      key: '',
      loader: async () => (await import('../translations/da.json')).default
    }
  ]
};

export const { t, loading, locales, locale, initialized, translations, loadTranslations } = new i18n(config);

export const selectedLocale = writable<string>('en');
export const LOCALE_STORAGE_KEY = 'classroomio_locale';
export const LOCALE_COOKIE_KEY = 'classroomio_locale';

/*
  `@sveltekit-i18n/base` keeps its loading state in a process-global singleton: a
  single `currentRoute` writable that every request overwrites, and a shared
  `promises` Set that any request can `.clear()`. `loadTranslations` resolves by
  filtering that Set for its own `{ locale, route }` entry, so two concurrent SSR
  renders can leave one of them awaiting a promise the other already purged --
  the request then never settles and the browser gets no HTML at all.

  Dedupe by locale so concurrent renders await one shared promise instead of
  racing. Note the loaders below declare no `routes`, so every loader already
  runs for every route: there is nothing to load per-pathname, and passing one
  only widens the race to every first-time URL.
*/
const localeLoads = new Map<string, Promise<unknown>>();

/** Load a locale once per process, reusing the in-flight promise for callers that race. */
function primeLocale(targetLocale: string): Promise<unknown> {
  const inFlight = localeLoads.get(targetLocale);
  if (inFlight) return inFlight;

  const load = Promise.resolve(loadTranslations(targetLocale)).catch((error) => {
    // Drop the cached rejection so the next render can retry.
    localeLoads.delete(targetLocale);
    throw error;
  });

  localeLoads.set(targetLocale, load);

  return load;
}

/**
 * Load a locale's translations once per process, then activate it for this
 * render. Use this instead of calling `loadTranslations` directly.
 */
export async function ensureTranslations(targetLocale: string): Promise<void> {
  await primeLocale(targetLocale);

  // `locale.set` re-enters the library's loader trigger; `forceSet` just marks
  // the active locale for the strings we already hold.
  locale.forceSet(targetLocale);
}

export function handleLocaleChange(newLocale: TLocale) {
  if (!newLocale) {
    return;
  }

  locale.set(newLocale);

  selectedLocale.set(newLocale);

  persistLocale(newLocale);
}

export function getPersistedLocale(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale) {
      return savedLocale;
    }
  } catch (error) {
    console.warn('Failed to read saved locale from localStorage', error);
  }

  const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_KEY}=([^;]*)`));
  return cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : null;
}

function persistLocale(newLocale: TLocale) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  } catch (error) {
    console.warn('Failed to save locale to localStorage', error);
  }

  document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(newLocale)}; path=/; max-age=31536000; SameSite=Lax`;
}
