import { sql } from 'drizzle-orm';

import { ContentType } from '@cio/utils/constants';
import * as schema from '@db/schema';
import { count, db, inArray, sql as drizzleSql, type DbOrTxClient } from '@db/drizzle';
import { isExerciseCompletedSql } from './progression';

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
  sessionDurationMinutes: number | null;
  recordingUrl: string | null;
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
export async function getCourseContentItems(
  courseId: string,
  profileId?: string,
  dbClient: DbOrTxClient = db
): Promise<CourseContentItemRow[]> {
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

    const exerciseCompletionSql = profileId ? isExerciseCompletedSql('exercise', { profileId }) : drizzleSql`false`;

    const result = await dbClient.execute(drizzleSql`
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
        NULL::int AS "sessionDurationMinutes",
        NULL::text AS "recordingUrl",
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
        session_duration_minutes AS "sessionDurationMinutes",
        recording_url AS "recordingUrl",
        EXISTS (
          SELECT 1
          FROM block_placement bp
          JOIN block b ON b.id = bp.block_id AND b.type = 'note'
          JOIN block_locale bl ON bl.block_id = b.id
          WHERE bp.lesson_id = lesson.id
            AND length(
              trim(
                regexp_replace(
                  regexp_replace(COALESCE(bl.content, ''), '<[^>]*>', '', 'g'),
                  '&nbsp;|&#160;',
                  ' ',
                  'g'
                )
              )
            ) > 0
        ) AS "hasNoteContent",
        EXISTS (
          SELECT 1
          FROM block_placement bp
          JOIN block b ON b.id = bp.block_id AND b.type = 'slides'
          WHERE bp.lesson_id = lesson.id
        ) AS "hasSlideContent",
        (
          SELECT count(*)::int
          FROM block_placement bp
          JOIN block b ON b.id = bp.block_id AND b.type = 'video'
          WHERE bp.lesson_id = lesson.id
        ) AS "videosCount",
        (
          SELECT count(*)::int
          FROM block_placement bp
          JOIN block b ON b.id = bp.block_id AND b.type = 'document'
          WHERE bp.lesson_id = lesson.id
        ) AS "documentsCount",
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
        NULL::int AS "sessionDurationMinutes",
        NULL::text AS "recordingUrl",
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
    console.error('getCourseContentItems error:', error);
    throw new Error(
      `Failed to get course content items for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Counts the student work (exercise submissions and lesson completions) attached to the given lessons and exercises. */
export async function countContentStudentWork(
  lessonIds: string[],
  exerciseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<{ submissions: number; lessonCompletions: number }> {
  try {
    const [submissionRow] =
      exerciseIds.length > 0
        ? await dbClient
            .select({ total: count() })
            .from(schema.submission)
            .where(inArray(schema.submission.exerciseId, exerciseIds))
        : [{ total: 0 }];
    const [completionRow] =
      lessonIds.length > 0
        ? await dbClient
            .select({ total: count() })
            .from(schema.lessonCompletion)
            .where(inArray(schema.lessonCompletion.lessonId, lessonIds))
        : [{ total: 0 }];

    return { submissions: submissionRow?.total ?? 0, lessonCompletions: completionRow?.total ?? 0 };
  } catch (error) {
    console.error('countContentStudentWork error:', error);
    throw new Error(`Failed to count student work: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
