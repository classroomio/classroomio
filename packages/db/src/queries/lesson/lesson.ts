import { db, eq, inArray } from '@db/drizzle';
import * as schema from '@db/schema';
import { TNewLesson, TNewLessonSection, TNewLessonLanguage } from '@db/types';

export async function getSectionsByCourseId(courseId: string) {
  try {
    return db.select().from(schema.lessonSection).where(eq(schema.lessonSection.courseId, courseId));
  } catch (error) {
    throw new Error(
      `Failed to get sections by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessonSections(values: TNewLessonSection[]) {
  try {
    return db.insert(schema.lessonSection).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create lesson sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getLessonsByCourseId(courseId: string) {
  try {
    return db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseId));
  } catch (error) {
    throw new Error(
      `Failed to get lessons by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessons(values: TNewLesson[]) {
  try {
    return db.insert(schema.lesson).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getLessonLanguagesByLessonIds(lessonIds: string[]) {
  if (lessonIds.length === 0) return [];
  try {
    return db.select().from(schema.lessonLanguage).where(inArray(schema.lessonLanguage.lessonId, lessonIds));
  } catch (error) {
    throw new Error(
      `Failed to get lesson languages by lesson IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessonLanguages(values: TNewLessonLanguage[]) {
  if (values.length === 0) return [];
  try {
    return db.insert(schema.lessonLanguage).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create lesson languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
