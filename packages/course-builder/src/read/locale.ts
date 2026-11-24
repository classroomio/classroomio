const LOCALE_CODE = /^[a-z]{2}(?:[-_][a-z0-9]{2,4})?$/i;
const LOCALE_DECISION_PAGES = 10;

export function baseLanguage(locale: string): string {
  return locale.toLowerCase().split(/[-_]/)[0];
}

/**
 * Common words that belong to one language only among these, so a count of them names a text's language. Words shared
 * by two of them (`de`, `en`, `la`, `die`) are left out.
 */
const FUNCTION_WORDS: Record<string, ReadonlySet<string>> = {
  en: new Set(['the', 'and', 'of', 'to', 'is', 'that', 'for', 'you', 'with', 'this', 'are', 'your', 'can', 'from']),
  fr: new Set([
    'les',
    'des',
    'et',
    'est',
    'pour',
    'dans',
    'une',
    'du',
    'vous',
    'sur',
    'avec',
    'pas',
    'au',
    'sont',
    'votre'
  ]),
  de: new Set([
    'der',
    'und',
    'ist',
    'nicht',
    'mit',
    'sie',
    'den',
    'ein',
    'eine',
    'zu',
    'auf',
    'für',
    'von',
    'sich',
    'das'
  ]),
  es: new Set(['el', 'los', 'las', 'del', 'y', 'para', 'una', 'con', 'por', 'su', 'puede', 'como', 'más', 'esta']),
  nl: new Set(['het', 'een', 'van', 'dat', 'op', 'voor', 'met', 'niet', 'zijn', 'je', 'wordt', 'kunt', 'deze', 'naar']),
  it: new Set(['il', 'di', 'che', 'è', 'per', 'non', 'della', 'sono', 'gli', 'nel', 'questo', 'puoi', 'anche']),
  pt: new Set(['os', 'da', 'do', 'das', 'dos', 'não', 'em', 'uma', 'você', 'pode', 'também', 'são'])
};
/** Words a text needs before its language is named, and how far the first language must lead the second. */
const MIN_FUNCTION_WORDS = 20;
const LEAD_RATIO = 2;

/** The language a text is written in, by its function words; null when it is short or mixed. */
export function textLanguage(text: string): string | null {
  const counts = Object.fromEntries(Object.keys(FUNCTION_WORDS).map((language) => [language, 0]));
  for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
    for (const [language, words] of Object.entries(FUNCTION_WORDS)) if (words.has(word)) counts[language] += 1;
  }

  const [first, second] = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  if (first[1] < MIN_FUNCTION_WORDS || first[1] < second[1] * LEAD_RATIO) return null;

  return first[0];
}

function visibleText(html: string): string {
  return html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ');
}

/**
 * A page's language from `<html lang>`, else from a locale segment at the start of its path, else from its text when
 * the page declares nothing (hosted wikis and help centres often serve every language without saying which).
 */
export function pageLocale(html: string, url: string): string | null {
  const lang = html.match(/<html[^>]+lang=["']([a-z]{2}(?:[-_][a-z0-9]{2,4})?)["']/i)?.[1];
  if (lang) return lang.toLowerCase();

  const firstSegment = new URL(url).pathname.split('/').filter(Boolean)[0];
  if (firstSegment && LOCALE_CODE.test(firstSegment)) return firstSegment.toLowerCase();

  return textLanguage(visibleText(html));
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
