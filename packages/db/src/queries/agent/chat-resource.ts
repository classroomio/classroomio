import * as schema from '@db/schema';
import { eq } from 'drizzle-orm';

import { db } from '@db/drizzle';

export type ResourceCourseBinding = {
  courseId: string | null;
  title: string | null;
};

export async function getLessonCourseBinding(lessonId: string): Promise<ResourceCourseBinding | undefined> {
  try {
    const [row] = await db
      .select({ courseId: schema.lesson.courseId, title: schema.lesson.title })
      .from(schema.lesson)
      .where(eq(schema.lesson.id, lessonId))
      .limit(1);

    return row;
  } catch (error) {
    console.error('getLessonCourseBinding error:', error);
    throw new Error(`Failed to load lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExerciseCourseBinding(exerciseId: string): Promise<ResourceCourseBinding | undefined> {
  try {
    const [row] = await db
      .select({ courseId: schema.exercise.courseId, title: schema.exercise.title })
      .from(schema.exercise)
      .where(eq(schema.exercise.id, exerciseId))
      .limit(1);

    return row;
  } catch (error) {
    console.error('getExerciseCourseBinding error:', error);
    throw new Error(`Failed to load exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCourseSectionBinding(sectionId: string): Promise<ResourceCourseBinding | undefined> {
  try {
    const [row] = await db
      .select({ courseId: schema.courseSection.courseId, title: schema.courseSection.title })
      .from(schema.courseSection)
      .where(eq(schema.courseSection.id, sectionId))
      .limit(1);

    return row;
  } catch (error) {
    console.error('getCourseSectionBinding error:', error);
    throw new Error(`Failed to load section: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
