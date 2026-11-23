import * as schema from '@db/schema';

import { and, eq, gt, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import type { AssignmentAvailabilityState } from '@cio/utils/functions/assignment-availability';
import { db } from '@db/drizzle';

/**
 * Students of the course's organization who are not in the course, when the course is a published, active,
 * self-enrollable catalog course; otherwise null.
 */
export async function getCourseRecommendationAudience(
  courseId: string
): Promise<{ organizationId: string; profileIds: string[] } | null> {
  try {
    const [course] = await db
      .select({ organizationId: schema.group.organizationId, groupId: schema.course.groupId })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(
        and(
          eq(schema.course.id, courseId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.course.isTemplate, false),
          sql`COALESCE(${schema.course.metadata}->>'allowSelfEnrollment', ${schema.course.metadata}->>'allowNewStudent', 'true') != 'false'`
        )
      )
      .limit(1);

    if (!course?.organizationId || !course.groupId) return null;

    const rows = await db
      .select({ profileId: schema.organizationmember.profileId })
      .from(schema.organizationmember)
      .leftJoin(
        schema.groupmember,
        and(
          eq(schema.groupmember.groupId, course.groupId),
          eq(schema.groupmember.profileId, schema.organizationmember.profileId)
        )
      )
      .where(
        and(
          eq(schema.organizationmember.organizationId, course.organizationId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          eq(schema.organizationmember.status, 'ACTIVE'),
          isNotNull(schema.organizationmember.profileId),
          isNull(schema.groupmember.id)
        )
      );

    return {
      organizationId: course.organizationId,
      profileIds: [...new Set(rows.map((row) => row.profileId!))]
    };
  } catch (error) {
    console.error('getCourseRecommendationAudience error:', error);
    throw new Error('Failed to load course recommendation audience');
  }
}

export type DueExerciseStudentRow = {
  exerciseId: string;
  courseId: string;
  organizationId: string;
  dueBy: string;
  profileId: string;
};

/**
 * Students who have not submitted an unlocked exercise on a published, active course whose due date falls in
 * (`from`, `until`], one row per (exercise, student).
 */
export async function listDueExerciseStudentsWithoutSubmission(
  from: Date,
  until: Date
): Promise<DueExerciseStudentRow[]> {
  try {
    const exerciseCourseId = sql<string>`COALESCE(${schema.exercise.courseId}, ${schema.lesson.courseId})`;

    const rows = await db
      .selectDistinct({
        exerciseId: schema.exercise.id,
        courseId: schema.course.id,
        organizationId: schema.group.organizationId,
        dueBy: schema.exercise.dueBy,
        profileId: schema.groupmember.profileId
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.lesson.id, schema.exercise.lessonId))
      .innerJoin(schema.course, eq(schema.course.id, exerciseCourseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .innerJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.roleId, ROLE.STUDENT))
      )
      .leftJoin(
        schema.submission,
        and(
          eq(schema.submission.exerciseId, schema.exercise.id),
          eq(schema.submission.submittedBy, schema.groupmember.id)
        )
      )
      .where(
        and(
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.exercise.isUnlocked, true),
          or(isNull(schema.exercise.lessonId), eq(schema.lesson.isUnlocked, true)),
          gt(schema.exercise.dueBy, toTimestamp(from)),
          lte(schema.exercise.dueBy, toTimestamp(until)),
          isNotNull(schema.groupmember.profileId),
          isNull(schema.submission.id)
        )
      );

    return rows.filter((row): row is DueExerciseStudentRow =>
      Boolean(row.dueBy && row.organizationId && row.profileId)
    );
  } catch (error) {
    console.error('listDueExerciseStudentsWithoutSubmission error:', error);
    throw new Error('Failed to list students with exercises due soon');
  }
}

/** `exercise.due_by` has no time zone and holds UTC wall time. */
function toTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

/** Publish and lock state of an exercise, its lesson and its course, or null when the exercise is not in the course. */
export async function getAssignmentAvailabilityState(
  exerciseId: string,
  courseId: string
): Promise<AssignmentAvailabilityState | null> {
  try {
    const [row] = await db
      .select({
        courseStatus: schema.course.status,
        courseIsPublished: schema.course.isPublished,
        exerciseIsUnlocked: schema.exercise.isUnlocked,
        lessonIsUnlocked: schema.lesson.isUnlocked
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.lesson.id, schema.exercise.lessonId))
      .innerJoin(
        schema.course,
        eq(schema.course.id, sql`COALESCE(${schema.exercise.courseId}, ${schema.lesson.courseId})`)
      )
      .where(and(eq(schema.exercise.id, exerciseId), eq(schema.course.id, courseId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getAssignmentAvailabilityState error:', error);
    throw new Error('Failed to read assignment availability');
  }
}
