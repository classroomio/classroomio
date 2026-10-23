import { sql, type SQL } from 'drizzle-orm';

/** Mirrors the `note` column rule in `lesson.has_note_content`: trimmed, no tag stripping. */
export function isNonEmptyNote(note: string | null | undefined): boolean {
  return (note ?? '').trim().length > 0;
}

/** "This lesson has a locale whose rendered text is non-empty", checked against the lesson_language rows committed for `lessonId`. */
function lessonLanguageHasContentSql(lessonId: string): SQL<boolean> {
  return sql<boolean>`EXISTS (
    SELECT 1 FROM lesson_language
    WHERE lesson_language.lesson_id = ${lessonId}
      AND length(
        trim(
          regexp_replace(
            regexp_replace(COALESCE(lesson_language.content, ''), '<[^>]*>', '', 'g'),
            '&nbsp;|&#160;',
            ' ',
            'g'
          )
        )
      ) > 0
  )`;
}

/** `has_note_content` for a lesson update where the new `note` value is known in JS and lesson_language rows are untouched. */
export function hasNoteContentSql(lessonId: string, note: string | null | undefined): SQL<boolean> {
  return sql<boolean>`${isNonEmptyNote(note)} OR ${lessonLanguageHasContentSql(lessonId)}`;
}

/** Full recompute for a write that changed a lesson_language row; reads the lesson's current `note` from its own row. */
export function recomputeHasNoteContentSql(lessonId: string): SQL<boolean> {
  return sql<boolean>`EXISTS (
    SELECT 1 FROM lesson WHERE lesson.id = ${lessonId} AND length(trim(COALESCE(lesson.note, ''))) > 0
  ) OR ${lessonLanguageHasContentSql(lessonId)}`;
}
