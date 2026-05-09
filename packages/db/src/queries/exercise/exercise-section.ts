import * as schema from '@db/schema';

import { asc, db, eq, inArray } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';
import type { TNewExerciseSection } from '@db/types';

export async function getExerciseSectionsByExerciseId(exerciseId: string, dbClient: DbOrTxClient = db) {
  try {
    return dbClient
      .select()
      .from(schema.exerciseSection)
      .where(eq(schema.exerciseSection.exerciseId, exerciseId))
      .orderBy(asc(schema.exerciseSection.order));
  } catch (error) {
    console.error('getExerciseSectionsByExerciseId error:', error);
    throw new Error(
      `Failed to get exercise sections by exercise ID "${exerciseId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getExerciseSectionsByExerciseIds(exerciseIds: string[], dbClient: DbOrTxClient = db) {
  if (exerciseIds.length === 0) return [];

  try {
    return dbClient
      .select()
      .from(schema.exerciseSection)
      .where(inArray(schema.exerciseSection.exerciseId, exerciseIds))
      .orderBy(asc(schema.exerciseSection.exerciseId), asc(schema.exerciseSection.order));
  } catch (error) {
    console.error('getExerciseSectionsByExerciseIds error:', error);
    throw new Error(`Failed to get exercise sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createExerciseSections(sections: TNewExerciseSection[], dbClient: DbOrTxClient = db) {
  if (sections.length === 0) return [];

  try {
    return dbClient.insert(schema.exerciseSection).values(sections).returning();
  } catch (error) {
    console.error('createExerciseSections error:', error);
    throw new Error(`Failed to create exercise sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateExerciseSection(
  exerciseSectionId: string,
  data: Partial<Omit<TNewExerciseSection, 'id' | 'exerciseId'>>,
  dbClient: DbOrTxClient = db
) {
  try {
    const [updated] = await dbClient
      .update(schema.exerciseSection)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.exerciseSection.id, exerciseSectionId))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('updateExerciseSection error:', error);
    throw new Error(
      `Failed to update exercise section "${exerciseSectionId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function deleteExerciseSection(exerciseSectionId: string, dbClient: DbOrTxClient = db) {
  try {
    return dbClient.delete(schema.exerciseSection).where(eq(schema.exerciseSection.id, exerciseSectionId)).returning();
  } catch (error) {
    console.error('deleteExerciseSection error:', error);
    throw new Error(
      `Failed to delete exercise section "${exerciseSectionId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function deleteExerciseSectionsByIds(exerciseSectionIds: string[], dbClient: DbOrTxClient = db) {
  if (exerciseSectionIds.length === 0) return [];

  try {
    return dbClient
      .delete(schema.exerciseSection)
      .where(inArray(schema.exerciseSection.id, exerciseSectionIds))
      .returning();
  } catch (error) {
    console.error('deleteExerciseSectionsByIds error:', error);
    throw new Error(`Failed to delete exercise sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function moveQuestionToSection(
  questionId: number,
  exerciseSectionId: string | null,
  dbClient: DbOrTxClient = db
) {
  try {
    const [updated] = await dbClient
      .update(schema.question)
      .set({ exerciseSectionId })
      .where(eq(schema.question.id, questionId))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('moveQuestionToSection error:', error);
    throw new Error(`Failed to move question to section: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function bulkMoveQuestionsToSection(
  questionIds: number[],
  exerciseSectionId: string | null,
  dbClient: DbOrTxClient = db
) {
  if (questionIds.length === 0) return [];

  try {
    return dbClient
      .update(schema.question)
      .set({ exerciseSectionId })
      .where(inArray(schema.question.id, questionIds))
      .returning();
  } catch (error) {
    console.error('bulkMoveQuestionsToSection error:', error);
    throw new Error(`Failed to move questions to section: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
