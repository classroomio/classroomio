import type { SUPPORTED_LOCALES } from '@/feature/i18n/constants/locales';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocalePreference = Locale | 'system';

/** CLDR plural forms; `other` is always required, the rest only where the language uses them. */
export type PluralMessage = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export type Message = string | PluralMessage;

export type Messages = Record<string, Message>;

/** The same keys as the English source, each translated with the same shape (plain string or plural forms). */
export type TranslatedMessages<Source extends Messages> = {
  [Key in keyof Source]: Source[Key] extends string ? string : PluralMessage;
};

export type Catalog<Source extends Messages> = { en: Source } & {
  [L in Exclude<Locale, 'en'>]: TranslatedMessages<Source>;
};

export type MessageValues = Record<string, string | number>;
