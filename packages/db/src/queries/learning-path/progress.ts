import { and, count, eq, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import * as schema from '../../schema';
import { complianceCycleIsCompleteSql, courseIsCompleteSql } from '../course/learner-progress';
import { isExerciseCompletedSql } from '../course/progression';
import { pathCourseIsActiveSql } from './learning-path-course';

export interface TCourseCompletionStats {
  totalLessons: number;
  completedLessons: number;
  totalExercises: number;
  completedExercises: number;
  isComplete: boolean;
}

/**
 * Checks whether a student has completed a course for learning path purposes.
 * Single source of truth for exercise completion is `isExerciseCompletedSql`.
 * Totals are read live from `lesson_completion` and `submission` for progress
 * display, but `isComplete` is what completion evaluation recorded
 * (`courseIsCompleteSql` over the member's `completed_at` and their current
 * compliance cycle), so the cache, the journey and the enrolled feed agree.
 * A course with no lessons and no exercises counts as done: the
 * certification rule requires content, so it could never record completion
 * and would otherwise brick every path holding one.
 */
export async function getCourseCompletionStatsForProfile(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCompletionStats> {
  try {
    const [lessonsTotalRow] = await dbClient
      .select({ count: count(schema.lesson.id) })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    const [lessonsCompletedRow] = await dbClient
      .select({ count: count(schema.lessonCompletion.id) })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          eq(schema.lessonCompletion.profileId, profileId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    const [exercisesTotalRow] = await dbClient
      .select({ count: count(schema.exercise.id) })
      .from(schema.exercise)
      .where(eq(schema.exercise.courseId, courseId));

    const [exercisesCompletedRow] = await dbClient
      .select({ count: count(schema.exercise.id) })
      .from(schema.exercise)
      .where(and(eq(schema.exercise.courseId, courseId), isExerciseCompletedSql('exercise', { profileId })));

    const [recordedRow] = await dbClient.execute<{ is_complete: boolean }>(sql`
      SELECT ${courseIsCompleteSql({
        courseType: sql`(SELECT type::text FROM ${schema.course} WHERE id = ${courseId})`,
        memberCompletedAt: sql`(SELECT gm.completed_at FROM ${schema.groupmember} gm
          JOIN ${schema.course} c ON c.group_id = gm.group_id
          WHERE c.id = ${courseId} AND gm.profile_id = ${profileId})`,
        complianceCycleComplete: sql`(SELECT ${complianceCycleIsCompleteSql(sql`ccr`)}
          FROM ${schema.courseCompletionRecord} ccr
          WHERE ccr.course_id = ${courseId} AND ccr.profile_id = ${profileId}
          ORDER BY ccr.cycle_number DESC LIMIT 1)`
      })} AS is_complete
    `);

    const totalLessons = Number(lessonsTotalRow?.count ?? 0);
    const completedLessons = Number(lessonsCompletedRow?.count ?? 0);
    const totalExercises = Number(exercisesTotalRow?.count ?? 0);
    const completedExercises = Number(exercisesCompletedRow?.count ?? 0);

    const recordedComplete = recordedRow?.is_complete ?? false;

    return {
      totalLessons,
      completedLessons,
      totalExercises,
      completedExercises,
      isComplete: recordedComplete || totalLessons + totalExercises === 0
    };
  } catch (error) {
    console.error('getCourseCompletionStatsForProfile error:', error);
    throw new Error(
      `Failed to get course completion stats for course "${courseId}" and profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type TPathCourseFunnelStat = {
  learningPathCourseId: string;
  courseId: string;
  title: string;
  order: number;
  completedCount: number;
};

/**
 * Computes course completion funnel stats across active members in a path
 * using the `learning_path_member_course` progress rollup cache table.
 * Removed members keep their cache rows, so join the member table and count
 * only active member rows. Runs as a single aggregated query rather than
 * N*M individual queries.
 */
export async function getPathCourseFunnelStats(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<TPathCourseFunnelStat[]> {
  try {
    const rows = await dbClient
      .select({
        learningPathCourseId: schema.learningPathCourse.id,
        courseId: schema.learningPathCourse.courseId,
        title: schema.course.title,
        order: schema.learningPathCourse.order,
        completedCount: count(schema.learningPathMember.id)
      })
      .from(schema.learningPathCourse)
      .innerJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .leftJoin(
        schema.learningPathMemberCourse,
        and(
          eq(schema.learningPathMemberCourse.learningPathCourseId, schema.learningPathCourse.id),
          eq(schema.learningPathMemberCourse.status, 'COMPLETED')
        )
      )
      .leftJoin(
        schema.learningPathMember,
        and(
          eq(schema.learningPathMember.id, schema.learningPathMemberCourse.learningPathMemberId),
          isNull(schema.learningPathMember.removedAt)
        )
      )
      .where(and(eq(schema.learningPathCourse.learningPathId, learningPathId), pathCourseIsActiveSql()))
      .groupBy(
        schema.learningPathCourse.id,
        schema.learningPathCourse.courseId,
        schema.course.title,
        schema.learningPathCourse.order
      )
      .orderBy(schema.learningPathCourse.order);

    return rows.map((r) => ({
      learningPathCourseId: r.learningPathCourseId,
      courseId: r.courseId,
      title: r.title,
      order: r.order,
      completedCount: Number(r.completedCount ?? 0)
    }));
  } catch (error) {
    console.error('getPathCourseFunnelStats error:', error);
    throw new Error(
      `Failed to get course funnel stats for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
