import type { Catalog, Locale, Message, MessageValues, Messages } from '@/feature/i18n/types/i18n';

type PluralCategory = Intl.LDMLPluralRule;

function slavicCategory(locale: 'ru' | 'pl', count: number): PluralCategory {
  if (!Number.isInteger(count)) return 'other';

  const integer = Math.abs(count);
  const lastDigit = integer % 10;
  const lastTwo = integer % 100;
  if (locale === 'pl' && integer === 1) return 'one';
  if (locale === 'ru' && lastDigit === 1 && lastTwo !== 11) return 'one';
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'few';

  return 'many';
}

function isMillionMultiple(count: number) {
  return Number.isInteger(count) && count !== 0 && count % 1_000_000 === 0;
}

/** CLDR cardinal plural category for engines without `Intl.PluralRules`, such as Hermes. */
function cldrPluralCategory(locale: Locale, count: number): PluralCategory {
  const integer = Math.trunc(Math.abs(count));
  const whole = Number.isInteger(count);

  switch (locale) {
    case 'vi':
      return 'other';
    case 'ru':
    case 'pl':
      return slavicCategory(locale, count);
    case 'fr':
    case 'pt':
      if (integer === 0 || integer === 1) return 'one';

      return isMillionMultiple(count) ? 'many' : 'other';
    case 'hi':
      return integer === 0 || count === 1 ? 'one' : 'other';
    case 'es':
    case 'it':
      if (count === 1) return 'one';

      return isMillionMultiple(count) ? 'many' : 'other';
    case 'da':
      return count === 1 || (!whole && integer <= 1) ? 'one' : 'other';
    case 'tr':
      return count === 1 ? 'one' : 'other';
    default:
      return whole && integer === 1 ? 'one' : 'other';
  }
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function pluralCategory(locale: Locale, count: number): PluralCategory {
  if (typeof Intl.PluralRules !== 'function') return cldrPluralCategory(locale, count);

  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }

  return rules.select(count);
}

function interpolate(template: string, values: MessageValues | undefined) {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

function selectForm(message: Message, locale: Locale, values: MessageValues | undefined) {
  if (typeof message === 'string') return message;

  const count = Number(values?.count ?? 0);
  const form = count === 0 && message.zero ? 'zero' : pluralCategory(locale, count);

  return message[form] ?? message.other;
}

/** Defines a feature's message catalog, keeping its keys typed against the English source. */
export function defineCatalog<Source extends Messages>(catalog: Catalog<Source>) {
  return catalog;
}

/**
 * Returns `t(key, values)` for one locale. Missing translations fall back to English, `{name}` placeholders are
 * filled from `values`, and plural messages pick their form from `values.count`.
 */
export function createTranslator<Source extends Messages>(catalog: Catalog<Source>, locale: Locale) {
  const messages: Record<string, Message | undefined> = catalog[locale];
  const fallback: Record<string, Message> = catalog.en;

  return (key: keyof Source & string, values?: MessageValues) => {
    const message = messages[key] ?? fallback[key] ?? key;
    const usedLocale = messages[key] ? locale : 'en';

    return interpolate(selectForm(message, usedLocale, values), values);
  };
}

export type Translator<Source extends Messages> = ReturnType<typeof createTranslator<Source>>;
