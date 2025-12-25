import { db, eq, inArray } from '@db/drizzle';
import { TNewExercise, TNewQuestion, TNewOption, TExercise } from '@db/types';
import * as schema from '@db/schema';

export async function createExercises(values: TNewExercise[]) {
  try {
    return db.insert(schema.exercise).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
