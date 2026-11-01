import * as schema from '@db/schema';

import type { TLessonCheckInCode } from '@db/types';
import { and, db, eq, sql, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants/roles';

export type LessonSessionContext = {
  lessonId: string;
  lessonTitle: string;
  lessonAt: string | null;
  courseId: string;
  courseTitle: string;
  organizationId: string;
};

export async function getLessonSessionContext(lessonId: string): Promise<LessonSessionContext | null> {
  try {
    const [row] = await db
      .select({
        lessonId: schema.lesson.id,
        lessonTitle: schema.lesson.title,
        lessonAt: schema.lesson.lessonAt,
        courseId: schema.course.id,
        courseTitle: schema.course.title,
        organizationId: schema.group.organizationId
      })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(eq(schema.lesson.id, lessonId))
      .limit(1);

    if (!row?.organizationId) return null;

    return { ...row, organizationId: row.organizationId };
  } catch (error) {
    console.error('getLessonSessionContext error:', error);
    throw new Error('Failed to load lesson session');
  }
}

/** The profile's STUDENT group member id in the course, or null when they are not a student of it. */
export async function getCourseStudentMemberId(courseId: string, profileId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(
        and(
          eq(schema.course.id, courseId),
          eq(schema.groupmember.profileId, profileId),
          eq(schema.groupmember.roleId, ROLE.STUDENT)
        )
      )
      .limit(1);

    return row?.id ?? null;
  } catch (error) {
    console.error('getCourseStudentMemberId error:', error);
    throw new Error('Failed to load course student');
  }
}

/** Stores the lesson's check-in code, replacing any earlier one. */
export async function replaceLessonCheckInCode(
  values: { lessonId: string; code: string; expiresAt: string; createdByProfileId: string },
  dbClient: DbOrTxClient = db
): Promise<TLessonCheckInCode> {
  try {
    const [row] = await dbClient
      .insert(schema.lessonCheckInCode)
      .values(values)
      .onConflictDoUpdate({
        target: schema.lessonCheckInCode.lessonId,
        set: {
          code: values.code,
          expiresAt: values.expiresAt,
          createdByProfileId: values.createdByProfileId,
          createdAt: sql`now()`
        }
      })
      .returning();

    return row!;
  } catch (error) {
    console.error('replaceLessonCheckInCode error:', error);
    throw new Error('Failed to save check-in code');
  }
}

export async function getLessonCheckInCode(lessonId: string): Promise<TLessonCheckInCode | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.lessonCheckInCode)
      .where(eq(schema.lessonCheckInCode.lessonId, lessonId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLessonCheckInCode error:', error);
    throw new Error('Failed to load check-in code');
  }
}

export async function deleteLessonCheckInCode(lessonId: string): Promise<boolean> {
  try {
    const rows = await db
      .delete(schema.lessonCheckInCode)
      .where(eq(schema.lessonCheckInCode.lessonId, lessonId))
      .returning({ lessonId: schema.lessonCheckInCode.lessonId });

    return rows.length > 0;
  } catch (error) {
    console.error('deleteLessonCheckInCode error:', error);
    throw new Error('Failed to delete check-in code');
  }
}
