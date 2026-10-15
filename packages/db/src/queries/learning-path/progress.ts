import { and, count, eq, isNull } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import * as schema from '../../schema';
import { isExerciseCompletedSql } from '../course/progression';

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
 * A course is complete if all lessons are completed AND all exercises are completed.
 * If a course has 0 lessons or 0 exercises, that portion is considered met.
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

    const totalLessons = Number(lessonsTotalRow?.count ?? 0);
    const completedLessons = Number(lessonsCompletedRow?.count ?? 0);
    const totalExercises = Number(exercisesTotalRow?.count ?? 0);
    const completedExercises = Number(exercisesCompletedRow?.count ?? 0);

    const lessonsComplete = totalLessons === 0 || completedLessons >= totalLessons;
    const exercisesComplete = totalExercises === 0 || completedExercises >= totalExercises;

    return {
      totalLessons,
      completedLessons,
      totalExercises,
      completedExercises,
      isComplete: lessonsComplete && exercisesComplete
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
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
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
