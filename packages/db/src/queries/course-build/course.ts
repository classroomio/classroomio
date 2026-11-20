import * as schema from '@db/schema';

import { asc, eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourseBuildCourse, TNewCourseBuildCourse } from '@db/types';

type CourseBuildCoursePatch = Partial<Omit<TNewCourseBuildCourse, 'id' | 'jobId' | 'createdAt'>>;

export async function createCourseBuildCourses(
  rows: TNewCourseBuildCourse[],
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildCourse[]> {
  if (!rows.length) return [];

  try {
    return await dbClient.insert(schema.courseBuildCourse).values(rows).returning();
  } catch (error) {
    console.error('createCourseBuildCourses error:', error);
    throw new Error('Failed to create course build courses');
  }
}

export async function listCourseBuildCourses(
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildCourse[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseBuildCourse)
      .where(eq(schema.courseBuildCourse.jobId, jobId))
      .orderBy(asc(schema.courseBuildCourse.position));
  } catch (error) {
    console.error('listCourseBuildCourses error:', error);
    throw new Error('Failed to list course build courses');
  }
}

export async function getCourseBuildCourseById(
  courseBuildCourseId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildCourse | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.courseBuildCourse)
      .where(eq(schema.courseBuildCourse.id, courseBuildCourseId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCourseBuildCourseById error:', error);
    throw new Error('Failed to fetch course build course');
  }
}

export async function updateCourseBuildCourse(
  courseBuildCourseId: string,
  patch: CourseBuildCoursePatch,
  dbClient: DbOrTxClient = db
): Promise<TCourseBuildCourse | null> {
  try {
    const [row] = await dbClient
      .update(schema.courseBuildCourse)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(schema.courseBuildCourse.id, courseBuildCourseId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('updateCourseBuildCourse error:', error);
    throw new Error('Failed to update course build course');
  }
}

export async function incrementCourseBuildSectionsWritten(
  courseBuildCourseId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.courseBuildCourse)
      .set({
        sectionsWritten: sql`${schema.courseBuildCourse.sectionsWritten} + 1`,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.courseBuildCourse.id, courseBuildCourseId));
  } catch (error) {
    console.error('incrementCourseBuildSectionsWritten error:', error);
    throw new Error('Failed to update course build progress');
  }
}
