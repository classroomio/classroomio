import * as schema from '@db/schema';

import type { TGroupAttendance, TNewGroupAttendance } from '@db/types';
import { and, db, eq, inArray, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants/roles';

/**
 * Gets attendance records by course ID
 * @param courseId Course ID
 * @param lessonId Optional lesson ID filter
 * @returns Array of attendance records
 */
export async function getAttendanceByCourseId(courseId: string, lessonId?: string): Promise<TGroupAttendance[]> {
  try {
    if (lessonId) {
      return db
        .select()
        .from(schema.groupAttendance)
        .where(and(eq(schema.groupAttendance.courseId, courseId), eq(schema.groupAttendance.lessonId, lessonId)));
    }
    return db.select().from(schema.groupAttendance).where(eq(schema.groupAttendance.courseId, courseId));
  } catch (error) {
    console.error('getAttendanceByCourseId error:', error);
    throw new Error(
      `Failed to get attendance by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets attendance record for a specific student and lesson
 * @param courseId Course ID
 * @param lessonId Lesson ID
 * @param studentId Student (group member) ID
 * @returns Attendance record or null
 */
export async function getAttendanceByStudentAndLesson(
  courseId: string,
  lessonId: string,
  studentId: string
): Promise<TGroupAttendance | null> {
  try {
    const [attendance] = await db
      .select()
      .from(schema.groupAttendance)
      .where(
        and(
          eq(schema.groupAttendance.courseId, courseId),
          eq(schema.groupAttendance.lessonId, lessonId),
          eq(schema.groupAttendance.studentId, studentId)
        )
      )
      .limit(1);
    return attendance || null;
  } catch (error) {
    console.error('getAttendanceByStudentAndLesson error:', error);
    throw new Error(`Failed to get attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates or updates the attendance record for one student and lesson, writing exactly the given fields.
 */
export async function upsertAttendance(
  data: Pick<TNewGroupAttendance, 'courseId' | 'lessonId' | 'studentId' | 'isPresent' | 'status' | 'checkedInAt'> & {
    courseId: string;
    studentId: string;
  },
  dbClient: DbOrTxClient = db
): Promise<TGroupAttendance> {
  try {
    const [existing] = await dbClient
      .select({ id: schema.groupAttendance.id })
      .from(schema.groupAttendance)
      .where(
        and(
          eq(schema.groupAttendance.courseId, data.courseId),
          eq(schema.groupAttendance.lessonId, data.lessonId),
          eq(schema.groupAttendance.studentId, data.studentId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await dbClient
        .update(schema.groupAttendance)
        .set({
          isPresent: data.isPresent,
          status: data.status,
          ...(data.checkedInAt !== undefined ? { checkedInAt: data.checkedInAt } : {}),
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.groupAttendance.id, existing.id))
        .returning();
      if (!updated) {
        throw new Error('Failed to update attendance');
      }

      return updated;
    }

    const [created] = await dbClient.insert(schema.groupAttendance).values(data).returning();
    if (!created) {
      throw new Error('Failed to create attendance');
    }

    return created;
  } catch (error) {
    console.error('upsertAttendance error:', error);
    throw new Error(`Failed to upsert attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** The subset of `memberIds` that are STUDENT members of the course's group. */
export async function filterCourseStudentMemberIds(
  courseId: string,
  memberIds: string[],
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  if (memberIds.length === 0) return [];

  try {
    const rows = await dbClient
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(
        and(
          eq(schema.course.id, courseId),
          inArray(schema.groupmember.id, memberIds),
          eq(schema.groupmember.roleId, ROLE.STUDENT)
        )
      );

    return rows.map((row) => row.id);
  } catch (error) {
    console.error('filterCourseStudentMemberIds error:', error);
    throw new Error('Failed to verify course students');
  }
}
