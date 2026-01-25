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
        NULL::boolean AS "isComplete"
      FROM lesson_section
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
        ${lessonCompletionSql} AS "isComplete"
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
        ${exerciseCompletionSql} AS "isComplete"
      FROM exercise
      LEFT JOIN lesson ON lesson.id = exercise.lesson_id
      WHERE exercise.course_id = ${courseId} OR lesson.course_id = ${courseId}
    `);

    const rows = result.map((row) => row as CourseContentItemRow);

    return rows.map((row) => ({
      ...row,
      type: row.type as ContentType,
      order: row.order === null ? null : Number(row.order)
    }));
  } catch (error) {
    throw new Error(
      `Failed to get course content items for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
