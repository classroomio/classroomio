import { ROLE } from '@cio/utils/constants';
import * as schema from '@db/schema';
import { and, db, eq, inArray, sql, type DbOrTxClient } from '@db/drizzle';

/** Whether an exercise is limited to chosen students: it is as soon as it has one assignment row. */
export async function getExerciseAssignedMemberIds(exerciseId: string, dbClient: DbOrTxClient = db) {
  try {
    const rows = await dbClient
      .select({ groupMemberId: schema.exerciseAssignment.groupMemberId })
      .from(schema.exerciseAssignment)
      .where(eq(schema.exerciseAssignment.exerciseId, exerciseId));

    return rows.map((row) => row.groupMemberId);
  } catch (error) {
    console.error('getExerciseAssignedMemberIds error:', error);
    throw new Error(`Failed to get assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Replaces who an exercise is assigned to; an empty list makes it visible to every student again. */
export async function replaceExerciseAssignments(
  exerciseId: string,
  groupMemberIds: string[],
  dbClient: DbOrTxClient = db
) {
  try {
    await dbClient.delete(schema.exerciseAssignment).where(eq(schema.exerciseAssignment.exerciseId, exerciseId));

    if (groupMemberIds.length === 0) return;

    await dbClient
      .insert(schema.exerciseAssignment)
      .values([...new Set(groupMemberIds)].map((groupMemberId) => ({ exerciseId, groupMemberId })));
  } catch (error) {
    console.error('replaceExerciseAssignments error:', error);
    throw new Error(`Failed to save assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** The student members of a course for the given profiles, as group member ids keyed by profile id. */
export async function getCourseStudentMemberIds(courseId: string, profileIds: string[], dbClient: DbOrTxClient = db) {
  if (profileIds.length === 0) return new Map<string, string>();

  try {
    const rows = await dbClient
      .select({ id: schema.groupmember.id, profileId: schema.groupmember.profileId })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(
        and(
          eq(schema.course.id, courseId),
          eq(schema.groupmember.roleId, ROLE.STUDENT),
          inArray(schema.groupmember.profileId, profileIds)
        )
      );

    return new Map(rows.flatMap((row) => (row.profileId ? [[row.profileId, row.id] as const] : [])));
  } catch (error) {
    console.error('getCourseStudentMemberIds error:', error);
    throw new Error(`Failed to get course students: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Exercises of the course that are limited to other students. Empty for anyone who is not a student of the course,
 * so teachers and admins always see everything.
 */
export async function getHiddenExerciseIdsForStudent(courseId: string, profileId: string, dbClient: DbOrTxClient = db) {
  try {
    const result = await dbClient.execute<{ id: string }>(sql`
      SELECT DISTINCT assignment.exercise_id AS id
      FROM exercise_assignment assignment
      JOIN exercise ON exercise.id = assignment.exercise_id
      WHERE exercise.course_id = ${courseId}
        AND EXISTS (
          SELECT 1
          FROM groupmember member
          JOIN course ON course.group_id = member.group_id
          WHERE course.id = ${courseId} AND member.profile_id = ${profileId} AND member.role_id = ${ROLE.STUDENT}
        )
        AND NOT EXISTS (
          SELECT 1
          FROM exercise_assignment own
          JOIN groupmember own_member ON own_member.id = own.group_member_id
          WHERE own.exercise_id = exercise.id AND own_member.profile_id = ${profileId}
        )
    `);

    return new Set(result.map((row) => row.id));
  } catch (error) {
    console.error('getHiddenExerciseIdsForStudent error:', error);
    throw new Error(`Failed to get hidden exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
