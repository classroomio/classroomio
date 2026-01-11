import * as schema from '@db/schema';

import type {
  TExercise,
  TExercise as TExerciseType,
  TNewExercise,
  TNewOption,
  TNewQuestion,
  TQuestionType
} from '@db/types';
import { and, db, eq, inArray } from '@db/drizzle';

export async function createExercises(values: TNewExercise[]) {
  try {
    return db.insert(schema.exercise).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExerciseById(exerciseId: string): Promise<TExercise | null> {
  try {
    const [exercise] = await db.select().from(schema.exercise).where(eq(schema.exercise.id, exerciseId)).limit(1);
    return exercise || null;
  } catch (error) {
    throw new Error(
      `Failed to get exercise by ID "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExercisesByLessonIds(lessonIds: string[]): Promise<TExercise[]> {
  if (lessonIds.length === 0) return [];
  try {
    return db.select().from(schema.exercise).where(inArray(schema.exercise.lessonId, lessonIds));
  } catch (error) {
    throw new Error(
      `Failed to get exercises by lesson IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExercisesByCourseId(courseId: string, lessonId?: string): Promise<TExercise[]> {
  try {
    if (lessonId) {
      const results = await db
        .select({ exercise: schema.exercise })
        .from(schema.exercise)
        .innerJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
        .where(and(eq(schema.lesson.courseId, courseId), eq(schema.exercise.lessonId, lessonId)));
      return results.map((r) => r.exercise);
    }
    const results = await db
      .select({ exercise: schema.exercise })
      .from(schema.exercise)
      .innerJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(eq(schema.lesson.courseId, courseId));
    return results.map((r) => r.exercise);
  } catch (error) {
    throw new Error(
      `Failed to get exercises by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateExercise(exerciseId: string, data: Partial<TExerciseType>) {
  try {
    const [updated] = await db
      .update(schema.exercise)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.exercise.id, exerciseId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update exercise "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteExercise(exerciseId: string) {
  try {
    const [deleted] = await db.delete(schema.exercise).where(eq(schema.exercise.id, exerciseId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete exercise "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createQuestions(values: TNewQuestion[]) {
  if (values.length === 0) return [];
  try {
    return db.insert(schema.question).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getQuestionsByExerciseIds(exerciseIds: string[]): Promise<TNewQuestion[]> {
  if (exerciseIds.length === 0) return [];
  try {
    return db.select().from(schema.question).where(inArray(schema.question.exerciseId, exerciseIds));
  } catch (error) {
    throw new Error(
      `Failed to get questions by exercise IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateQuestion(questionId: number, data: Partial<TNewQuestion>) {
  try {
    const [updated] = await db.update(schema.question).set(data).where(eq(schema.question.id, questionId)).returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteQuestion(questionId: number) {
  try {
    const [deleted] = await db.delete(schema.question).where(eq(schema.question.id, questionId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createOptions(values: TNewOption[]) {
  if (values.length === 0) return [];
  try {
    return db.insert(schema.option).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getOptionsByQuestionIds(questionIds: number[]) {
  if (questionIds.length === 0) return [];
  try {
    return db.select().from(schema.option).where(inArray(schema.option.questionId, questionIds));
  } catch (error) {
    throw new Error(
      `Failed to get options by question IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateOption(optionId: number, data: Partial<TNewOption>) {
  try {
    const [updated] = await db.update(schema.option).set(data).where(eq(schema.option.id, optionId)).returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update option "${optionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteOption(optionId: number) {
  try {
    const [deleted] = await db.delete(schema.option).where(eq(schema.option.id, optionId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete option "${optionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets question types by IDs
 * @param ids Array of question type IDs
 * @returns Array of question types
 */
export async function getQuestionTypesByIds(ids: number[]): Promise<TQuestionType[]> {
  if (ids.length === 0) return [];

  try {
    return db.select().from(schema.questionType).where(inArray(schema.questionType.id, ids));
  } catch (error) {
    throw new Error(`Failed to get question types by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
