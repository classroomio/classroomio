import { DEFAULT_LOCALE, LOCALE_NAMES } from '@/feature/i18n/constants/locales';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import type { Lesson } from '@/feature/lesson/types/lesson';

function hasText(html: string | null | undefined): html is string {
  return Boolean(
    html &&
      html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;|&#160;/g, ' ')
        .trim()
  );
}

/** The learner's lesson language, which is the app language. */
export function useLessonLocale(): string {
  return useLocale();
}

/** The lesson body in `locale`, falling back to English, then any translation, then the legacy note. */
export function lessonBody(lesson: Pick<Lesson, 'lessonLanguages' | 'note'>, locale: string) {
  const languages = lesson.lessonLanguages ?? [];
  const byLocale = (target: string) => languages.find((entry) => entry.locale === target && hasText(entry.content));
  const match = byLocale(locale) ?? byLocale(DEFAULT_LOCALE) ?? languages.find((entry) => hasText(entry.content));

  if (match?.content) return { html: match.content, locale: match.locale as string };
  if (hasText(lesson.note)) return { html: lesson.note, locale: null };

  return null;
}

/** The language named in itself, as language pickers show it. */
export function languageName(locale: string | null) {
  if (!locale) return null;

  return LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES] ?? locale;
}
