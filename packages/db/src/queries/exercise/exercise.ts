import * as schema from '@db/schema';

import type {
  TExercise,
  TExercise as TExerciseType,
  TNewExercise,
  TNewOption,
  TNewQuestion,
  TQuestionType
} from '@db/types';
import { and, asc, db, desc, eq, gt, inArray, isNull, lt, or, sql } from '@db/drizzle';

import type { DbOrTxClient } from '@db/drizzle';
import { contentWriteBumpsTimestamp, stampContentUpdatedAt } from '@db/queries/course/content-timestamp';

export async function touchExercisesUpdatedAt(exerciseIds: string[], dbClient: DbOrTxClient = db) {
  const ids = [...new Set(exerciseIds.filter(Boolean))];
  if (ids.length === 0) return;

  try {
    await dbClient
      .update(schema.exercise)
      .set({ updatedAt: new Date().toISOString() })
      .where(inArray(schema.exercise.id, ids));
  } catch (error) {
    console.error('touchExercisesUpdatedAt error:', error);
    throw new Error(`Failed to touch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function touchExercisesForQuestions(questionIds: number[], dbClient: DbOrTxClient) {
  const ids = [...new Set(questionIds)];
  if (ids.length === 0) return;

  const rows = await dbClient
    .select({ exerciseId: schema.question.exerciseId })
    .from(schema.question)
    .where(inArray(schema.question.id, ids));

  await touchExercisesUpdatedAt(
    rows.map((row) => row.exerciseId),
    dbClient
  );
}

export async function createExercises(values: TNewExercise[], dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.exercise).values(values).returning();
  } catch (error) {
    console.error('createExercises error:', error);
    throw new Error(`Failed to create exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExerciseById(exerciseId: string, dbClient: DbOrTxClient = db): Promise<TExercise | null> {
  try {
    const [exercise] = await dbClient.select().from(schema.exercise).where(eq(schema.exercise.id, exerciseId)).limit(1);
    return exercise || null;
  } catch (error) {
    console.error('getExerciseById error:', error);
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
    console.error('getExerciseCompletionByProfile error:', error);
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
    console.error('getExerciseCompletionsByProfile error:', error);
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
    console.error('getExercisesByLessonIds error:', error);
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
        sectionId: schema.lesson.sectionId,
        lessonCourseId: schema.lesson.courseId
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(and(...conditions));

    return results.map((row) => ({
      ...row.exercise,
      courseId: row.exercise.courseId ?? row.lessonCourseId ?? row.exercise.courseId,
      sectionId: row.exercise.sectionId ?? row.sectionId
    }));
  } catch (error) {
    console.error('getExercisesByCourseId error:', error);
    throw new Error(
      `Failed to get exercises by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateExercise(exerciseId: string, data: Partial<TExerciseType>, dbClient: DbOrTxClient = db) {
  try {
    const fields = { ...data };
    delete fields.updatedAt;
    const fieldNames = Object.keys(fields);
    const patch = contentWriteBumpsTimestamp(fieldNames) ? { ...fields, updatedAt: new Date().toISOString() } : fields;
    const [updated] = await dbClient
      .update(schema.exercise)
      .set(patch)
      .where(eq(schema.exercise.id, exerciseId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateExercise error:', error);
    throw new Error(
      `Failed to update exercise "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateExercisesSectionId(
  courseId: string,
  sectionId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const updated = await dbClient
      .update(schema.exercise)
      .set({ sectionId })
      .where(eq(schema.exercise.courseId, courseId))
      .returning();

    return updated.length;
  } catch (error) {
    console.error('updateExercisesSectionId error:', error);
    throw new Error(
      `Failed to update exercises section ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateUngroupedExercisesSectionId(
  courseId: string,
  sectionId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const updated = await dbClient
      .update(schema.exercise)
      .set({ sectionId })
      .where(and(eq(schema.exercise.courseId, courseId), isNull(schema.exercise.sectionId)))
      .returning();

    return updated.length;
  } catch (error) {
    console.error('updateUngroupedExercisesSectionId error:', error);
    throw new Error(
      `Failed to update ungrouped exercises section ID "${courseId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function deleteExercise(exerciseId: string, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.exercise).where(eq(schema.exercise.id, exerciseId)).returning();
    console.log('Deleted exercise:', deleted);
    return deleted || null;
  } catch (error) {
    console.error('deleteExercise error:', error);
    throw new Error(
      `Failed to delete exercise "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createQuestions(values: TNewQuestion[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    // Keep the identity sequence aligned before bulk inserts so restored data
    // or manual imports cannot reuse an existing question id.
    await syncQuestionIdSequence(dbClient);
    const created = await dbClient.insert(schema.question).values(values).returning();
    await touchExercisesUpdatedAt(
      created.map((question) => question.exerciseId),
      dbClient
    );
    return created;
  } catch (error) {
    const err = error as Error & { code?: string; cause?: unknown };
    console.error('createQuestions error:', {
      message: err.message,
      code: err.code,
      cause: err.cause
    });
    throw new Error('Failed to create questions');
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
    console.error('getQuestionsByExerciseIds error:', error);
    throw new Error(
      `Failed to get questions by exercise IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateQuestion(questionId: number, data: Partial<TNewQuestion>, dbClient: DbOrTxClient = db) {
  try {
    const [updated] = await dbClient
      .update(schema.question)
      .set(stampContentUpdatedAt(data))
      .where(eq(schema.question.id, questionId))
      .returning();
    if (updated) {
      await touchExercisesUpdatedAt([updated.exerciseId], dbClient);
    }

    return updated || null;
  } catch (error) {
    console.error('updateQuestion error:', error);
    throw new Error(
      `Failed to update question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteQuestion(questionId: number, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.question).where(eq(schema.question.id, questionId)).returning();
    if (deleted) {
      await touchExercisesUpdatedAt([deleted.exerciseId], dbClient);
    }

    return deleted || null;
  } catch (error) {
    console.error('deleteQuestion error:', error);
    throw new Error(
      `Failed to delete question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createOptions(values: TNewOption[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    await syncOptionIdSequence(dbClient);
    const created = await dbClient.insert(schema.option).values(values).returning();
    await touchExercisesForQuestions(
      created.map((option) => option.questionId),
      dbClient
    );
    return created;
  } catch (error) {
    console.error('createOptions error:', error);
    throw new Error(`Failed to create options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getOptionsByQuestionIds(questionIds: number[], dbClient: DbOrTxClient = db) {
  if (questionIds.length === 0) return [];
  try {
    return dbClient
      .select()
      .from(schema.option)
      .where(inArray(schema.option.questionId, questionIds))
      .orderBy(asc(schema.option.questionId), asc(schema.option.id));
  } catch (error) {
    console.error('getOptionsByQuestionIds error:', error);
    throw new Error(
      `Failed to get options by question IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateOption(optionId: number, data: Partial<TNewOption>, dbClient: DbOrTxClient = db) {
  try {
    const [updated] = await dbClient
      .update(schema.option)
      .set(stampContentUpdatedAt(data))
      .where(eq(schema.option.id, optionId))
      .returning();
    if (updated) {
      await touchExercisesForQuestions([updated.questionId], dbClient);
    }

    return updated || null;
  } catch (error) {
    console.error('updateOption error:', error);
    throw new Error(
      `Failed to update option "${optionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteOption(optionId: number, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.option).where(eq(schema.option.id, optionId)).returning();
    if (deleted) {
      await touchExercisesForQuestions([deleted.questionId], dbClient);
    }

    return deleted || null;
  } catch (error) {
    console.error('deleteOption error:', error);
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
    const deleted = await dbClient
      .delete(schema.option)
      .where(inArray(schema.option.questionId, questionIds))
      .returning();
    await touchExercisesForQuestions(questionIds, dbClient);
    return deleted;
  } catch (error) {
    console.error('deleteOptionsByQuestionIds error:', error);
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
    const deleted = await dbClient.delete(schema.question).where(inArray(schema.question.id, questionIds)).returning();
    await touchExercisesUpdatedAt(
      deleted.map((question) => question.exerciseId),
      dbClient
    );
    return deleted;
  } catch (error) {
    console.error('deleteQuestionsByIds error:', error);
    throw new Error(`Failed to delete questions by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes options by IDs in a single query
 */
export async function deleteOptionsByIds(optionIds: number[], dbClient: DbOrTxClient = db) {
  if (optionIds.length === 0) return [];
  try {
    const deleted = await dbClient.delete(schema.option).where(inArray(schema.option.id, optionIds)).returning();
    await touchExercisesForQuestions(
      deleted.map((option) => option.questionId),
      dbClient
    );
    return deleted;
  } catch (error) {
    console.error('deleteOptionsByIds error:', error);
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
    const run = async (client: DbOrTxClient) => {
      const results = await Promise.all(
        updates.map(({ id, data }) =>
          client
            .update(schema.option)
            .set(stampContentUpdatedAt(data))
            .where(eq(schema.option.id, id))
            .returning()
            .then((rows) => rows[0])
        )
      );
      const updated = results.filter((row) => row !== undefined);
      await touchExercisesForQuestions(
        updated.map((option) => option.questionId),
        client
      );
      return updated;
    };

    return dbClient ? await run(dbClient) : db.transaction((tx) => run(tx));
  } catch (error) {
    console.error('batchUpdateOptions error:', error);
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
    const run = async (client: DbOrTxClient) => {
      const results = await Promise.all(
        updates.map(({ id, data }) =>
          client
            .update(schema.question)
            .set(stampContentUpdatedAt(data))
            .where(eq(schema.question.id, id))
            .returning()
            .then((rows) => rows[0])
        )
      );
      const updated = results.filter((row) => row !== undefined);
      await touchExercisesUpdatedAt(
        updated.map((question) => question.exerciseId),
        client
      );
      return updated;
    };

    return dbClient ? await run(dbClient) : db.transaction((tx) => run(tx));
  } catch (error) {
    console.error('batchUpdateQuestions error:', error);
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
    console.error('getQuestionTypesByIds error:', error);
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

    // Sort options by id so order matches insertion order (order sent from client)
    for (const question of questionsMap.values()) {
      question.options.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    }

    const questions = Array.from(questionsMap.values()).sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.id ?? 0) - (b.id ?? 0);
    });

    return {
      exercise,
      questions
    };
  } catch (error) {
    console.error('getExerciseWithRelations error:', error);
    throw new Error(
      `Failed to get exercise with relations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Syncs the option table's identity sequence to the current max(id).
 * Call before inserting options to avoid duplicate key on option_pkey when the sequence is behind.
 */
export async function syncOptionIdSequence(dbClient: DbOrTxClient = db): Promise<void> {
  await dbClient.execute(
    sql`
      SELECT setval(
        pg_get_serial_sequence('option', 'id'),
        COALESCE((SELECT MAX(id) FROM "option"), 1),
        EXISTS(SELECT 1 FROM "option")
      )
    `
  );
}

/**
 * Syncs the question table's identity sequence to the current max(id).
 * Call before inserting questions to avoid duplicate key on question_pkey when the sequence is behind.
 */
export async function syncQuestionIdSequence(dbClient: DbOrTxClient = db): Promise<void> {
  await dbClient.execute(
    sql`
      SELECT setval(
        pg_get_serial_sequence('question', 'id'),
        COALESCE((SELECT MAX(id) FROM question), 1),
        EXISTS(SELECT 1 FROM question)
      )
    `
  );
}

/**
 * Syncs the question_type table's identity sequence to the current max(id).
 * Call before inserting question types to avoid duplicate key on question_type_pkey when the sequence is behind.
 */
export async function syncQuestionTypeIdSequence(dbClient: DbOrTxClient = db): Promise<void> {
  await dbClient.execute(
    sql`
      SELECT setval(
        pg_get_serial_sequence('question_type', 'id'),
        COALESCE((SELECT MAX(id) FROM question_type), 1),
        EXISTS(SELECT 1 FROM question_type)
      )
    `
  );
}

export interface PluginExerciseMetadata {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  order: number;
  allowMultipleAttempts: boolean;
  completionPolicy: string;
  passThreshold: number | null;
  questionCount: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

function parseExerciseCursor(cursor?: string | null): { order: number; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const [orderStr, id] = decoded.split('|');
    const order = Number(orderStr);
    if (!Number.isNaN(order) && id) return { order, id };
  } catch {}
  const [orderStr, id] = cursor.split('|');
  const order = Number(orderStr);
  if (!Number.isNaN(order) && id) return { order, id };
  return null;
}

function encodeExerciseCursor(order: number, id: string): string {
  return Buffer.from(`${order}|${id}`).toString('base64url');
}

export async function getPluginExercisesList(
  organizationId: string,
  courseId: string,
  actorId: string,
  canReadAll: boolean,
  options?: { limit?: number; cursor?: string | null; lessonId?: string }
): Promise<{ items: PluginExerciseMetadata[]; nextCursor: string | null }> {
  const limit = Math.max(1, Math.min(Number(options?.limit) || 20, 100));

  const accessCondition =
    !actorId || canReadAll
      ? undefined
      : or(
          and(
            eq(schema.course.status, 'ACTIVE'),
            eq(schema.course.isPublished, true),
            eq(schema.course.publicForAll, true)
          ),
          sql<boolean>`exists (
            select 1 from ${schema.groupmember}
            where ${schema.groupmember.groupId} = ${schema.course.groupId}
              and ${schema.groupmember.profileId} = ${actorId}
          )`
        );

  const [courseExists] = await db
    .select({ id: schema.course.id })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .where(
      and(
        eq(schema.course.id, courseId),
        eq(schema.group.organizationId, organizationId),
        eq(schema.course.isTemplate, false),
        accessCondition
      )
    )
    .limit(1);

  if (!courseExists) {
    return { items: [], nextCursor: null };
  }

  const conditions = [eq(schema.exercise.courseId, courseId)];
  if (options?.lessonId) {
    conditions.push(eq(schema.exercise.lessonId, options.lessonId));
  }

  const parsedCursor = parseExerciseCursor(options?.cursor);
  if (parsedCursor) {
    conditions.push(
      or(
        gt(schema.exercise.order, parsedCursor.order),
        and(eq(schema.exercise.order, parsedCursor.order), gt(schema.exercise.id, parsedCursor.id))
      )!
    );
  }

  const rows = await db
    .select({
      id: schema.exercise.id,
      courseId: schema.exercise.courseId,
      lessonId: schema.exercise.lessonId,
      title: schema.exercise.title,
      description: schema.exercise.description,
      order: schema.exercise.order,
      allowMultipleAttempts: schema.exercise.allowMultipleAttempts,
      completionPolicy: schema.exercise.completionPolicy,
      passThreshold: schema.exercise.passThreshold,
      createdAt: schema.exercise.createdAt,
      updatedAt: schema.exercise.updatedAt,
      questionCount: sql<number>`coalesce(count(${schema.question.id}), 0)::int`,
      totalPoints: sql<number>`coalesce(sum(${schema.question.points}), 0)::float`
    })
    .from(schema.exercise)
    .leftJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
    .where(and(...conditions))
    .groupBy(schema.exercise.id)
    .orderBy(asc(schema.exercise.order), asc(schema.exercise.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow ? encodeExerciseCursor(Number(lastRow.order), lastRow.id) : null;

  const items: PluginExerciseMetadata[] = pageRows
    .filter((row): row is typeof row & { courseId: string } => Boolean(row.courseId))
    .map((row) => ({
      id: row.id,
      courseId: row.courseId,
      lessonId: row.lessonId ?? null,
      title: row.title,
      description: row.description ?? null,
      order: Number(row.order),
      allowMultipleAttempts: Boolean(row.allowMultipleAttempts),
      completionPolicy: row.completionPolicy,
      passThreshold: row.passThreshold !== null ? Number(row.passThreshold) : null,
      questionCount: Number(row.questionCount) || 0,
      totalPoints: Number(row.totalPoints) || 0,
      createdAt: row.createdAt ?? new Date().toISOString(),
      updatedAt: row.updatedAt ?? row.createdAt ?? new Date().toISOString()
    }));

  return { items, nextCursor };
}

export async function getPluginExerciseById(
  organizationId: string,
  exerciseId: string,
  actorId: string,
  canReadAll: boolean
): Promise<PluginExerciseMetadata | null> {
  const accessCondition =
    !actorId || canReadAll
      ? undefined
      : or(
          and(
            eq(schema.course.status, 'ACTIVE'),
            eq(schema.course.isPublished, true),
            eq(schema.course.publicForAll, true)
          ),
          sql<boolean>`exists (
            select 1 from ${schema.groupmember}
            where ${schema.groupmember.groupId} = ${schema.course.groupId}
              and ${schema.groupmember.profileId} = ${actorId}
          )`
        );

  const [row] = await db
    .select({
      id: schema.exercise.id,
      courseId: schema.exercise.courseId,
      lessonId: schema.exercise.lessonId,
      title: schema.exercise.title,
      description: schema.exercise.description,
      order: schema.exercise.order,
      allowMultipleAttempts: schema.exercise.allowMultipleAttempts,
      completionPolicy: schema.exercise.completionPolicy,
      passThreshold: schema.exercise.passThreshold,
      createdAt: schema.exercise.createdAt,
      updatedAt: schema.exercise.updatedAt,
      questionCount: sql<number>`coalesce(count(${schema.question.id}), 0)::int`,
      totalPoints: sql<number>`coalesce(sum(${schema.question.points}), 0)::float`
    })
    .from(schema.exercise)
    .innerJoin(schema.course, eq(schema.exercise.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
    .where(
      and(
        eq(schema.exercise.id, exerciseId),
        eq(schema.group.organizationId, organizationId),
        eq(schema.course.isTemplate, false),
        accessCondition
      )
    )
    .groupBy(schema.exercise.id)
    .limit(1);

  if (!row || !row.courseId) return null;

  return {
    id: row.id,
    courseId: row.courseId,
    lessonId: row.lessonId ?? null,
    title: row.title,
    description: row.description ?? null,
    order: Number(row.order),
    allowMultipleAttempts: Boolean(row.allowMultipleAttempts),
    completionPolicy: row.completionPolicy,
    passThreshold: row.passThreshold !== null ? Number(row.passThreshold) : null,
    questionCount: Number(row.questionCount) || 0,
    totalPoints: Number(row.totalPoints) || 0,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? row.createdAt ?? new Date().toISOString()
  };
}
