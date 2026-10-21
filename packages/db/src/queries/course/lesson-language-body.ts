export type LessonLanguageBodyRow = {
  content: string | null;
  locale: string | null;
};

function hasNonEmptyContent(row: LessonLanguageBodyRow): boolean {
  return typeof row.content === 'string' && row.content.length > 0;
}

/**
 * Returns the English lesson body when it has content, otherwise the first
 * non-empty locale, otherwise the legacy `lesson.note`.
 */
export function pickLessonLanguageBody(
  languageRows: LessonLanguageBodyRow[],
  fallbackNote: string | null | undefined
): string {
  const englishRow = languageRows.find((row) => row.locale === 'en' && hasNonEmptyContent(row));
  const fallbackRow = languageRows.find(hasNonEmptyContent);

  return englishRow?.content ?? fallbackRow?.content ?? fallbackNote ?? '';
}
