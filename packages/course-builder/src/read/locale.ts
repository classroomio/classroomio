const LOCALE_CODE = /^[a-z]{2}(?:[-_][a-z0-9]{2,4})?$/i;
const LOCALE_DECISION_PAGES = 10;

export function baseLanguage(locale: string): string {
  return locale.toLowerCase().split(/[-_]/)[0];
}

/** A page's language from `<html lang>`, else from a locale segment at the start of its path. */
export function pageLocale(html: string, url: string): string | null {
  const lang = html.match(/<html[^>]+lang=["']([a-z]{2}(?:[-_][a-z0-9]{2,4})?)["']/i)?.[1];
  if (lang) return lang.toLowerCase();

  const firstSegment = new URL(url).pathname.split('/').filter(Boolean)[0];

  return firstSegment && LOCALE_CODE.test(firstSegment) ? firstSegment.toLowerCase() : null;
}

/** The `hreflang` alternate of a page in the wanted language, when the page lists one. */
export function alternateFor(html: string, pageUrl: string, wanted: string): string | null {
  for (const match of html.matchAll(/<link[^>]+rel=["']alternate["'][^>]*>/gi)) {
    const tag = match[0];
    const hreflang = tag.match(/hreflang=["']([^"']+)["']/i)?.[1];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!hreflang || !href || hreflang === 'x-default') continue;
    if (baseLanguage(hreflang) !== baseLanguage(wanted)) continue;

    try {
      return new URL(href, pageUrl).href;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * The language to read a source in: the organisation's when the source has it, else the most common one among the
 * first pages. Undecided (null) until enough pages are seen.
 */
export function chooseLocale(seen: Array<string | null>, preferred: string): string | null {
  const known = seen.filter((locale): locale is string => !!locale);
  if (seen.length < LOCALE_DECISION_PAGES) return null;
  if (!known.length) return null;

  const counts = new Map<string, number>();
  for (const locale of known) counts.set(baseLanguage(locale), (counts.get(baseLanguage(locale)) ?? 0) + 1);
  if (counts.has(baseLanguage(preferred))) return baseLanguage(preferred);

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

const LANGUAGE_NAMES = new Intl.DisplayNames(['en'], { type: 'language' });

function isLanguageCode(segment: string): boolean {
  if (!LOCALE_CODE.test(segment)) return false;

  try {
    const code = baseLanguage(segment);

    return LANGUAGE_NAMES.of(code) !== code;
  } catch {
    return false;
  }
}

/** The language named by a URL's path segment at `position`, when that segment is a real language code. */
export function urlLanguageAt(url: string, position: number): string | null {
  const segment = new URL(url).pathname.split('/').filter(Boolean)[position];

  return segment && isLanguageCode(segment) ? baseLanguage(segment) : null;
}

/** Where a URL names its language: the first of its first three path segments that is a real language code. */
export function urlLanguagePosition(url: string): number | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean).slice(0, 3);
  const position = segments.findIndex((segment) => isLanguageCode(segment));

  return position === -1 ? null : position;
}

export function sameLanguage(locale: string | null, chosen: string | null): boolean {
  return !locale || !chosen || baseLanguage(locale) === chosen;
}
