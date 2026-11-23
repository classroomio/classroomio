import * as schema from '@db/schema';

import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import { db } from '@db/drizzle';

export type LearnerExerciseRow = {
  exerciseId: string;
  title: string;
  dueBy: string | null;
  courseId: string;
  courseTitle: string;
  groupMemberId: string;
  maxScore: number;
};

export type LearnerSubmissionRow = {
  exerciseId: string;
  groupMemberId: string;
  statusId: number | null;
  gradingState: string;
  total: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/**
 * Unlocked exercises in the published, active courses the profile studies in this organization, with the
 * profile's course membership and the exercise's total points.
 */
export async function listLearnerExercises(orgId: string, profileId: string): Promise<LearnerExerciseRow[]> {
  try {
    const exerciseCourseId = sql<string>`COALESCE(${schema.exercise.courseId}, ${schema.lesson.courseId})`;

    const rows = await db
      .select({
        exerciseId: schema.exercise.id,
        title: schema.exercise.title,
        dueBy: schema.exercise.dueBy,
        courseId: schema.course.id,
        courseTitle: schema.course.title,
        groupMemberId: schema.groupmember.id,
        maxScore: sql<number>`(
          SELECT COALESCE(SUM(q.points), 0) FROM ${schema.question} AS q WHERE q.exercise_id = ${schema.exercise.id}
        )`
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.lesson.id, schema.exercise.lessonId))
      .innerJoin(schema.course, eq(schema.course.id, exerciseCourseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .innerJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.group.id), eq(schema.groupmember.profileId, profileId))
      )
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.groupmember.roleId, ROLE.STUDENT),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.exercise.isUnlocked, true),
          or(isNull(schema.exercise.lessonId), eq(schema.lesson.isUnlocked, true))
        )
      );

    return rows.map((row) => ({ ...row, maxScore: Number(row.maxScore) }));
  } catch (error) {
    console.error('listLearnerExercises error:', error);
    throw new Error('Failed to list learner exercises');
  }
}

/** Submissions by the given course memberships for the given exercises, newest first. */
export async function listLearnerSubmissions(params: {
  exerciseIds: string[];
  groupMemberIds: string[];
}): Promise<LearnerSubmissionRow[]> {
  if (params.exerciseIds.length === 0 || params.groupMemberIds.length === 0) return [];

  try {
    const rows = await db
      .select({
        exerciseId: schema.submission.exerciseId,
        groupMemberId: schema.submission.submittedBy,
        statusId: schema.submission.statusId,
        gradingState: schema.submission.gradingState,
        total: schema.submission.total,
        createdAt: schema.submission.createdAt,
        updatedAt: schema.submission.updatedAt
      })
      .from(schema.submission)
      .where(
        and(
          inArray(schema.submission.exerciseId, params.exerciseIds),
          inArray(schema.submission.submittedBy, params.groupMemberIds)
        )
      )
      .orderBy(desc(schema.submission.createdAt));

    return rows.filter((row): row is LearnerSubmissionRow => Boolean(row.groupMemberId));
  } catch (error) {
    console.error('listLearnerSubmissions error:', error);
    throw new Error('Failed to list learner submissions');
  }
}
