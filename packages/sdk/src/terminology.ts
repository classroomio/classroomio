import type { TerminologyConfig } from './types';

export const DEFAULT_LOCALE_WORD_TABLE: Record<string, Record<string, string>> = {
  en: { course: 'Course', student: 'Student' },
  de: { course: 'Kurs', student: 'Student' },
  fr: { course: 'Cours', student: 'Étudiant' },
  pt: { course: 'Curso', student: 'Aluno' },
  es: { course: 'Curso', student: 'Estudiante' },
  hi: { course: 'कोर्स', student: 'छात्र' },
  ru: { course: 'Курс', student: 'Студент' },
  pl: { course: 'Kurs', student: 'Student' },
  vi: { course: 'Khóa học', student: 'Học viên' },
  da: { course: 'Kursus', student: 'Studerende' }
};

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Applies terminology overrides to a string using locale-aware word boundary matching.
 * The override value is substituted verbatim for the locale word.
 */
export function applyTerminology(
  text: string,
  terminology: TerminologyConfig = {},
  locale: string = 'en',
  localeWordTable: Record<string, Record<string, string>> = DEFAULT_LOCALE_WORD_TABLE
): string {
  if (!text || !terminology || Object.keys(terminology).length === 0) {
    return text;
  }

  const wordsForLocale = localeWordTable[locale];
  if (!wordsForLocale) {
    return text;
  }

  let result = text;
  for (const [key, override] of Object.entries(terminology)) {
    if (!override) {
      continue;
    }

    const targetWord = wordsForLocale[key];
    if (!targetWord) {
      continue;
    }

    // Unicode-aware word boundary: not preceded or followed by a letter/number
    const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(targetWord)}(?![\\p{L}\\p{N}])`, 'gui');
    result = result.replace(regex, override);
  }

  return result;
}
