import { sql } from 'drizzle-orm';

import { ContentType } from '@cio/utils/constants';
import * as schema from '@db/schema';
import { count, db, inArray, sql as drizzleSql, type DbOrTxClient } from '@db/drizzle';
import { getCompletedExerciseIdsForProfile, getCompletedLessonIdsForProfile } from './progression';

export type CourseContentItemRow = {
  id: string;
  type: ContentType;
  title: string | null;
  order: number | null;
  createdAt: string | null;
  sectionId: string | null;
  isUnlocked: boolean | null;
  isComplete: boolean | null;
  completionPolicy: string | null;
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

export type CourseContentItemOptions = {
  includeNoteContent?: boolean;
};

/**
 * Fetches a course's structure — sections, lessons, exercises, counts and flags — with no
 * per-student data: `isComplete` is always `false` for lesson/exercise rows. This is the same
 * for every student and changes only when an author edits the course, so it's the half of
 * `getCourseContentItems` that's safe to cache; see `apps/api/src/utils/redis/course-content-cache.ts`.
 *
 * The exercise union is split into two legs instead of one `exercise.course_id = $1 OR
 * lesson.course_id = $1`: an `OR` across a left-joined table blocks index usage on both sides, so
 * each leg here runs its own indexed lookup. The two `WHERE` clauses are mutually exclusive by
 * construction (the second only matches exercises the first didn't), so `UNION ALL` is safe and
 * there's nothing to de-duplicate. The second leg only matches exercises still linked solely
 * through the deprecated `exercise.lesson_id` column; new exercises always carry their own
 * `course_id`, and a one-off backfill (see the migration) moves `lesson.course_id` onto any
 * existing exercise still missing it.
 *
 * @param options `includeNoteContent` fills `hasNoteContent` by scanning every lesson's note HTML, which is expensive; it is `null` otherwise
 */
export async function getCourseContentStructure(
  courseId: string,
  dbClient: DbOrTxClient = db,
  { includeNoteContent = false }: CourseContentItemOptions = {}
): Promise<CourseContentItemRow[]> {
  try {
    const noteContentSql = includeNoteContent
      ? drizzleSql`EXISTS (
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
        )`
      : drizzleSql`NULL::boolean`;

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
        NULL::text AS "completionPolicy",
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
        false AS "isComplete",
        completion_policy AS "completionPolicy",
        lesson_at AS "lessonAt",
        call_url AS "callUrl",
        session_duration_minutes AS "sessionDurationMinutes",
        recording_url AS "recordingUrl",
        ${noteContentSql} AS "hasNoteContent",
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
        COALESCE(exercise.section_id, (SELECT lesson.section_id FROM lesson WHERE lesson.id = exercise.lesson_id))
          AS "sectionId",
        exercise.is_unlocked AS "isUnlocked",
        false AS "isComplete",
        exercise.completion_policy AS "completionPolicy",
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
      WHERE exercise.course_id = ${courseId}

      UNION ALL

      SELECT
        exercise.id,
        ${ContentType.Exercise}::text AS type,
        exercise.title,
        exercise."order",
        exercise.created_at AS "createdAt",
        COALESCE(exercise.section_id, lesson.section_id) AS "sectionId",
        exercise.is_unlocked AS "isUnlocked",
        false AS "isComplete",
        exercise.completion_policy AS "completionPolicy",
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
      JOIN lesson ON lesson.id = exercise.lesson_id
      WHERE (exercise.course_id IS NULL OR exercise.course_id <> ${courseId})
        AND lesson.course_id = ${courseId}
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
    console.error('getCourseContentStructure error:', error);
    throw new Error(
      `Failed to get course content structure for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches course content items (sections, lessons, exercises) for a course, with the given
 * student's completion state merged in. Structure is shared by every student; only completion
 * is looked up per profile, via two small indexed queries instead of a per-row correlated
 * subquery embedded in the structure query.
 * @param courseId Course ID
 * @param profileId Optional profile ID for completion state
 * @param options `includeNoteContent` fills `hasNoteContent` by scanning every lesson's note HTML, which is expensive; it is `null` otherwise
 */
export async function getCourseContentItems(
  courseId: string,
  profileId?: string,
  dbClient: DbOrTxClient = db,
  options: CourseContentItemOptions = {}
): Promise<CourseContentItemRow[]> {
  const structure = await getCourseContentStructure(courseId, dbClient, options);

  if (!profileId) {
    return structure;
  }

  const [completedLessonIds, completedExerciseIds] = await Promise.all([
    getCompletedLessonIdsForProfile(courseId, profileId, dbClient),
    getCompletedExerciseIdsForProfile(courseId, profileId, dbClient)
  ]);

  return structure.map((item) => {
    if (item.type === ContentType.Lesson) {
      return { ...item, isComplete: completedLessonIds.has(item.id) };
    }

    if (item.type === ContentType.Exercise) {
      return { ...item, isComplete: completedExerciseIds.has(item.id) };
    }

    return item;
  });
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
