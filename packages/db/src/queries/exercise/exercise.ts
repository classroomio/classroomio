import * as schema from '@db/schema';

import type {
  TExercise,
  TExercise as TExerciseType,
  TNewExercise,
  TNewOption,
  TNewQuestion,
  TQuestionType
} from '@db/types';
import { and, db, eq, inArray, or } from '@db/drizzle';

import type { DbOrTxClient } from '@db/drizzle';

export async function createExercises(values: TNewExercise[], dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.exercise).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExerciseById(exerciseId: string, dbClient: DbOrTxClient = db): Promise<TExercise | null> {
  try {
    const [exercise] = await dbClient.select().from(schema.exercise).where(eq(schema.exercise.id, exerciseId)).limit(1);
    return exercise || null;
  } catch (error) {
    throw new Error(
      `Failed to get exercise by ID "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if a profile has completed an exercise (submission exists)
 */
export async function getExerciseCompletionByProfile(
  exerciseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const result = await dbClient
      .select({ exerciseId: schema.submission.exerciseId })
      .from(schema.submission)
      .innerJoin(schema.groupmember, eq(schema.submission.submittedBy, schema.groupmember.id))
      .where(and(eq(schema.submission.exerciseId, exerciseId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    throw new Error(
      `Failed to get exercise completion for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets completed exercise IDs for a profile (submission exists)
 */
export async function getExerciseCompletionsByProfile(
  exerciseIds: string[],
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  if (exerciseIds.length === 0) return [];
  try {
    const result = await dbClient
      .select({ exerciseId: schema.submission.exerciseId })
      .from(schema.submission)
      .innerJoin(schema.groupmember, eq(schema.submission.submittedBy, schema.groupmember.id))
      .where(and(inArray(schema.submission.exerciseId, exerciseIds), eq(schema.groupmember.profileId, profileId)));

    return result.map((row) => row.exerciseId);
  } catch (error) {
    throw new Error(
      `Failed to get exercise completions for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExercisesByLessonIds(lessonIds: string[], dbClient: DbOrTxClient = db): Promise<TExercise[]> {
  if (lessonIds.length === 0) return [];
  try {
    return dbClient.select().from(schema.exercise).where(inArray(schema.exercise.lessonId, lessonIds));
  } catch (error) {
    throw new Error(
      `Failed to get exercises by lesson IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExercisesByCourseId(
  courseId: string,
  filters: { lessonId?: string; sectionId?: string } = {},
  dbClient: DbOrTxClient = db
): Promise<TExercise[]> {
  try {
    const { lessonId, sectionId } = filters;
    const conditions = [or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId))];

    if (lessonId) {
      conditions.push(eq(schema.exercise.lessonId, lessonId));
    }

    if (sectionId) {
      conditions.push(or(eq(schema.exercise.sectionId, sectionId), eq(schema.lesson.sectionId, sectionId)));
    }

    const results = await dbClient
      .select({
        exercise: schema.exercise,
        lessonSectionId: schema.lesson.sectionId,
        lessonCourseId: schema.lesson.courseId
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(and(...conditions));

    return results.map((row) => ({
      ...row.exercise,
      courseId: row.exercise.courseId ?? row.lessonCourseId ?? row.exercise.courseId,
      sectionId: row.exercise.sectionId ?? row.lessonSectionId ?? row.exercise.sectionId
    }));
  } catch (error) {
    throw new Error(
      `Failed to get exercises by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateExercise(exerciseId: string, data: Partial<TExerciseType>, dbClient: DbOrTxClient = db) {
  try {
    const [updated] = await dbClient
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

export async function deleteExercise(exerciseId: string, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.exercise).where(eq(schema.exercise.id, exerciseId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete exercise "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createQuestions(values: TNewQuestion[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    return dbClient.insert(schema.question).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getQuestionsByExerciseIds(
  exerciseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<TNewQuestion[]> {
  if (exerciseIds.length === 0) return [];
  try {
    return dbClient.select().from(schema.question).where(inArray(schema.question.exerciseId, exerciseIds));
  } catch (error) {
    throw new Error(
      `Failed to get questions by exercise IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateQuestion(questionId: number, data: Partial<TNewQuestion>, dbClient: DbOrTxClient = db) {
  try {
    const [updated] = await dbClient
      .update(schema.question)
      .set(data)
      .where(eq(schema.question.id, questionId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteQuestion(questionId: number, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.question).where(eq(schema.question.id, questionId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createOptions(values: TNewOption[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    return dbClient.insert(schema.option).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getOptionsByQuestionIds(questionIds: number[], dbClient: DbOrTxClient = db) {
  if (questionIds.length === 0) return [];
  try {
    return dbClient.select().from(schema.option).where(inArray(schema.option.questionId, questionIds));
  } catch (error) {
    throw new Error(
      `Failed to get options by question IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateOption(optionId: number, data: Partial<TNewOption>, dbClient: DbOrTxClient = db) {
  try {
    const [updated] = await dbClient.update(schema.option).set(data).where(eq(schema.option.id, optionId)).returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update option "${optionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteOption(optionId: number, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.option).where(eq(schema.option.id, optionId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete option "${optionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes all options for given question IDs in a single query
 */
export async function deleteOptionsByQuestionIds(questionIds: number[], dbClient: DbOrTxClient = db) {
  if (questionIds.length === 0) return [];
  try {
    return dbClient.delete(schema.option).where(inArray(schema.option.questionId, questionIds)).returning();
  } catch (error) {
    throw new Error(
      `Failed to delete options by question IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes questions by IDs in a single query
 */
export async function deleteQuestionsByIds(questionIds: number[], dbClient: DbOrTxClient = db) {
  if (questionIds.length === 0) return [];
  try {
    return dbClient.delete(schema.question).where(inArray(schema.question.id, questionIds)).returning();
  } catch (error) {
    throw new Error(`Failed to delete questions by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes options by IDs in a single query
 */
export async function deleteOptionsByIds(optionIds: number[], dbClient: DbOrTxClient = db) {
  if (optionIds.length === 0) return [];
  try {
    return dbClient.delete(schema.option).where(inArray(schema.option.id, optionIds)).returning();
  } catch (error) {
    throw new Error(`Failed to delete options by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch update options - updates multiple options in parallel using a single transaction
 */
export async function updateOptions(
  updates: Array<{ id: number; data: Partial<TNewOption> }>,
  dbClient?: DbOrTxClient
) {
  if (updates.length === 0) return [];
  try {
    const run = (client: DbOrTxClient) =>
      Promise.all(
        updates.map(({ id, data }) =>
          client
            .update(schema.option)
            .set(data)
            .where(eq(schema.option.id, id))
            .returning()
            .then((r) => r[0])
        )
      );

    const results = dbClient ? await run(dbClient) : await db.transaction((tx) => run(tx));
    return results.filter((r) => r !== undefined);
  } catch (error) {
    throw new Error(`Failed to batch update options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch update questions - updates multiple questions in parallel using a single transaction
 */
export async function updateQuestions(
  updates: Array<{ id: number; data: Partial<TNewQuestion> }>,
  dbClient?: DbOrTxClient
) {
  if (updates.length === 0) return [];
  try {
    const run = (client: DbOrTxClient) =>
      Promise.all(
        updates.map(({ id, data }) =>
          client
            .update(schema.question)
            .set(data)
            .where(eq(schema.question.id, id))
            .returning()
            .then((r) => r[0])
        )
      );

    const results = dbClient ? await run(dbClient) : await db.transaction((tx) => run(tx));
    return results.filter((r) => r !== undefined);
  } catch (error) {
    throw new Error(`Failed to batch update questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets question types by IDs
 * @param ids Array of question type IDs
 * @returns Array of question types
 */
export async function getQuestionTypesByIds(ids: number[], dbClient: DbOrTxClient = db): Promise<TQuestionType[]> {
  if (ids.length === 0) return [];

  try {
    return dbClient.select().from(schema.questionType).where(inArray(schema.questionType.id, ids));
  } catch (error) {
    throw new Error(`Failed to get question types by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Optimized: Fetches exercise with questions and question types in a single query using JOINs
 * @param exerciseId Exercise ID
 * @returns Exercise with questions (including questionType) and options separately
 */
export async function getExerciseWithRelationsOptimized(
  exerciseId: string,
  dbClient: DbOrTxClient = db
): Promise<{
  exercise: TExercise;
  questions: (TNewQuestion & { questionType: TQuestionType; options: TNewOption[] })[];
}> {
  try {
    const result = await dbClient
      .select({
        exercise: schema.exercise,
        question: schema.question,
        questionType: schema.questionType,
        option: schema.option
      })
      .from(schema.exercise)
      .leftJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
      .leftJoin(schema.questionType, eq(schema.question.questionTypeId, schema.questionType.id))
      .leftJoin(schema.option, eq(schema.option.questionId, schema.question.id))
      .where(eq(schema.exercise.id, exerciseId));

    if (result.length === 0 || !result[0].exercise) {
      throw new Error(`Exercise not found: ${exerciseId}`);
    }

    const exercise = result[0].exercise;

    // Group questions with their question types and options (deduplicate by question ID, collect options)
    const questionsMap = new Map<number, TNewQuestion & { questionType: TQuestionType; options: TNewOption[] }>();
    for (const row of result) {
      if (row.question && row.questionType) {
        if (!questionsMap.has(row.question.id)) {
          questionsMap.set(row.question.id, {
            ...row.question,
            questionType: row.questionType,
            options: []
          });
        }
        // Add option if it exists and hasn't been added yet
        if (row.option && row.option.id) {
          const question = questionsMap.get(row.question.id)!;
          const optionId = row.option.id;
          // Check if option already added (avoid duplicates from JOIN)
          if (!question.options.some((opt) => opt.id === optionId)) {
            question.options.push(row.option);
          }
        }
      }
    }

    return {
      exercise,
      questions: Array.from(questionsMap.values())
    };
  } catch (error) {
    throw new Error(
      `Failed to get exercise with relations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
