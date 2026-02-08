import { sql } from 'drizzle-orm';

import { ContentType } from '@cio/utils/constants';
import { db, sql as drizzleSql } from '@db/drizzle';

export type CourseContentItemRow = {
  id: string;
  type: ContentType;
  title: string | null;
  order: number | null;
  createdAt: string | null;
  sectionId: string | null;
  isUnlocked: boolean | null;
  isComplete: boolean | null;
  lessonAt: string | null;
  callUrl: string | null;
  hasNoteContent: boolean | null;
  hasSlideContent: boolean | null;
  videosCount: number | null;
  documentsCount: number | null;
  questionCount: number | null;
  dueBy: string | null;
};

/**
 * Fetches raw course content items (sections, lessons, exercises) for a course.
 * @param courseId Course ID
 * @param profileId Optional profile ID for completion state
 */
export async function getCourseContentItems(courseId: string, profileId?: string): Promise<CourseContentItemRow[]> {
  try {
    const lessonCompletionSql = profileId
      ? drizzleSql`COALESCE(
          (
            SELECT bool_or(is_complete)
            FROM lesson_completion
            WHERE lesson_id = lesson.id AND profile_id = ${profileId}
          ),
          false
        )`
      : drizzleSql`false`;

    const exerciseCompletionSql = profileId
      ? drizzleSql`COALESCE(
          (
            SELECT true
            FROM submission
            INNER JOIN groupmember ON groupmember.id = submission.submitted_by
            WHERE submission.exercise_id = exercise.id AND groupmember.profile_id = ${profileId}
            LIMIT 1
          ),
          false
        )`
      : drizzleSql`false`;

    const result = await db.execute(drizzleSql`
      SELECT
        id,
        ${ContentType.Section}::text AS type,
        title,
        "order",
        created_at AS "createdAt",
        NULL::uuid AS "sectionId",
        NULL::boolean AS "isUnlocked",
        NULL::boolean AS "isComplete",
        NULL::timestamptz AS "lessonAt",
        NULL::text AS "callUrl",
        NULL::boolean AS "hasNoteContent",
        NULL::boolean AS "hasSlideContent",
        NULL::int AS "videosCount",
        NULL::int AS "documentsCount",
        NULL::int AS "questionCount",
        NULL::timestamp AS "dueBy"
      FROM course_section
      WHERE course_id = ${courseId}

      UNION ALL

      SELECT
        id,
        ${ContentType.Lesson}::text AS type,
        title,
        "order",
        created_at AS "createdAt",
        section_id AS "sectionId",
        is_unlocked AS "isUnlocked",
        ${lessonCompletionSql} AS "isComplete",
        lesson_at AS "lessonAt",
        call_url AS "callUrl",
        (
          (
            length(trim(COALESCE(note, ''))) > 0
          )
          OR EXISTS (
            SELECT 1
            FROM lesson_language
            WHERE lesson_language.lesson_id = lesson.id
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
          )
        ) AS "hasNoteContent",
        (
          length(trim(COALESCE(slide_url, ''))) > 0
        ) AS "hasSlideContent",
        COALESCE(jsonb_array_length(videos), 0) AS "videosCount",
        COALESCE(jsonb_array_length(documents), 0) AS "documentsCount",
        NULL::int AS "questionCount",
        NULL::timestamp AS "dueBy"
      FROM lesson
      WHERE course_id = ${courseId}

      UNION ALL

      SELECT
        exercise.id,
        ${ContentType.Exercise}::text AS type,
        exercise.title,
        exercise."order",
        exercise.created_at AS "createdAt",
        COALESCE(exercise.section_id, lesson.section_id) AS "sectionId",
        exercise.is_unlocked AS "isUnlocked",
        ${exerciseCompletionSql} AS "isComplete",
        NULL::timestamptz AS "lessonAt",
        NULL::text AS "callUrl",
        NULL::boolean AS "hasNoteContent",
        NULL::boolean AS "hasSlideContent",
        NULL::int AS "videosCount",
        NULL::int AS "documentsCount",
        (
          SELECT COUNT(*)
          FROM question
          WHERE question.exercise_id = exercise.id
        )::int AS "questionCount",
        exercise.due_by AS "dueBy"
      FROM exercise
      LEFT JOIN lesson ON lesson.id = exercise.lesson_id
      WHERE exercise.course_id = ${courseId} OR lesson.course_id = ${courseId}
    `);

    const rows = result.map((row) => row as CourseContentItemRow);

    return rows.map((row) => ({
      ...row,
      type: row.type as ContentType,
      order: row.order === null ? null : Number(row.order),
      hasNoteContent: row.hasNoteContent === null ? null : Boolean(row.hasNoteContent),
      hasSlideContent: row.hasSlideContent === null ? null : Boolean(row.hasSlideContent),
      videosCount: row.videosCount === null ? null : Number(row.videosCount),
      documentsCount: row.documentsCount === null ? null : Number(row.documentsCount),
      questionCount: row.questionCount === null ? null : Number(row.questionCount)
    }));
  } catch (error) {
    throw new Error(
      `Failed to get course content items for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
