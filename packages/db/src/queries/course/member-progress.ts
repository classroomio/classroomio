import * as schema from '@db/schema';

import { and, eq, inArray, or } from 'drizzle-orm';

import { db } from '@db/drizzle';
import { submissionMeetsCompletionPolicySql } from './progression';

export type StudentCourseMembership = {
  groupMemberId: string;
  certificateEarnedAt: string | null;
};

export type CourseTrackableContentCounts = {
  lessonIds: string[];
  exerciseIds: string[];
  lessonsCount: number;
  exercisesCount: number;
};

/**
 * Returns completed lesson IDs grouped by profile for a course.
 */
export async function getBatchLessonCompletionsForCourse(
  courseId: string,
  profileIds: string[]
): Promise<Map<string, Set<string>>> {
  const completionMap = new Map<string, Set<string>>(profileIds.map((profileId) => [profileId, new Set<string>()]));

  if (profileIds.length === 0) {
    return completionMap;
  }

  try {
    const rows = await db
      .select({
        profileId: schema.lessonCompletion.profileId,
        lessonId: schema.lessonCompletion.lessonId
      })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          eq(schema.lessonCompletion.isComplete, true),
          inArray(schema.lessonCompletion.profileId, profileIds)
        )
      );

    for (const row of rows) {
      if (!row.profileId || !row.lessonId) continue;

      const lessonSet = completionMap.get(row.profileId);
      if (lessonSet) {
        lessonSet.add(row.lessonId);
      }
    }

    return completionMap;
  } catch (error) {
    console.error('getBatchLessonCompletionsForCourse error:', error);
    throw new Error(
      `Failed to get batch lesson completions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns group membership metadata for students in a course.
 */
export async function getBatchStudentCourseMembership(
  courseId: string,
  profileIds: string[]
): Promise<Map<string, StudentCourseMembership>> {
  const membershipMap = new Map<string, StudentCourseMembership>();

  if (profileIds.length === 0) {
    return membershipMap;
  }

  try {
    const rows = await db
      .select({
        profileId: schema.groupmember.profileId,
        groupMemberId: schema.groupmember.id,
        certificateEarnedAt: schema.groupmember.certificateEarnedAt
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(and(eq(schema.course.id, courseId), inArray(schema.groupmember.profileId, profileIds)));

    for (const row of rows) {
      if (!row.profileId) continue;

      membershipMap.set(row.profileId, {
        groupMemberId: row.groupMemberId,
        certificateEarnedAt: row.certificateEarnedAt ?? null
      });
    }

    return membershipMap;
  } catch (error) {
    console.error('getBatchStudentCourseMembership error:', error);
    throw new Error(
      `Failed to get batch student course membership: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns lesson and exercise IDs for a course (shared across all students).
 */
export async function getCourseTrackableContentCounts(courseId: string): Promise<CourseTrackableContentCounts> {
  try {
    const [lessons, exercises] = await Promise.all([
      db.select({ id: schema.lesson.id }).from(schema.lesson).where(eq(schema.lesson.courseId, courseId)),
      db
        .select({ id: schema.exercise.id })
        .from(schema.exercise)
        .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
        .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)))
    ]);

    const lessonIds = lessons.map((lesson) => lesson.id);
    const exerciseIds = exercises.map((exercise) => exercise.id);

    return {
      lessonIds,
      exerciseIds,
      lessonsCount: lessonIds.length,
      exercisesCount: exerciseIds.length
    };
  } catch (error) {
    console.error('getCourseTrackableContentCounts error:', error);
    throw new Error(
      `Failed to get course trackable content counts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns completed exercise IDs for all requested group members in one query.
 */
export async function getBatchCompletedExerciseIdsForMembers(
  courseId: string,
  groupMemberIds: string[]
): Promise<Map<string, Set<string>>> {
  const completionMap = new Map<string, Set<string>>(
    groupMemberIds.map((groupMemberId) => [groupMemberId, new Set<string>()])
  );

  if (groupMemberIds.length === 0) {
    return completionMap;
  }

  try {
    const completionCondition = submissionMeetsCompletionPolicySql('exercise', 'submission');
    const rows = await db
      .selectDistinct({
        groupMemberId: schema.submission.submittedBy,
        exerciseId: schema.exercise.id
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .innerJoin(
        schema.submission,
        and(
          eq(schema.submission.exerciseId, schema.exercise.id),
          inArray(schema.submission.submittedBy, groupMemberIds)
        )
      )
      .where(
        and(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)), completionCondition)
      );

    for (const row of rows) {
      if (!row.groupMemberId) continue;

      completionMap.get(row.groupMemberId)?.add(row.exerciseId);
    }

    return completionMap;
  } catch (error) {
    console.error('getBatchCompletedExerciseIdsForMembers error:', error);
    throw new Error(
      `Failed to get batch completed exercise IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
