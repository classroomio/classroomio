import * as schema from '@db/schema';

import { and, count, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

export async function listTemplateSettingSync(courseId: string, dbClient: DbOrTxClient = db) {
  try {
    return await dbClient
      .select()
      .from(schema.courseTemplateSettingSync)
      .where(eq(schema.courseTemplateSettingSync.courseId, courseId));
  } catch (error) {
    console.error('listTemplateSettingSync error:', error);
    throw new Error(
      `Failed to list template setting sync: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function upsertTemplateSettingSync(
  courseId: string,
  settingKeys: string[],
  syncedAt: string,
  dbClient: DbOrTxClient = db
) {
  if (settingKeys.length === 0) return;

  try {
    await dbClient
      .insert(schema.courseTemplateSettingSync)
      .values(settingKeys.map((settingKey) => ({ courseId, settingKey, syncedAt })))
      .onConflictDoUpdate({
        target: [schema.courseTemplateSettingSync.courseId, schema.courseTemplateSettingSync.settingKey],
        set: { syncedAt }
      });
  } catch (error) {
    console.error('upsertTemplateSettingSync error:', error);
    throw new Error(
      `Failed to save template setting sync: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countSubmissionsByExerciseIds(exerciseIds: string[], dbClient: DbOrTxClient = db) {
  if (exerciseIds.length === 0) return new Map<string, number>();

  try {
    const rows = await dbClient
      .select({ exerciseId: schema.submission.exerciseId, total: count() })
      .from(schema.submission)
      .where(inArray(schema.submission.exerciseId, exerciseIds))
      .groupBy(schema.submission.exerciseId);

    return new Map(rows.map((row) => [row.exerciseId, Number(row.total)]));
  } catch (error) {
    console.error('countSubmissionsByExerciseIds error:', error);
    throw new Error(`Failed to count submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function shiftCourseSectionOrders(courseId: string, fromOrder: number, dbClient: DbOrTxClient = db) {
  try {
    await dbClient
      .update(schema.courseSection)
      .set({ order: sql`${schema.courseSection.order} + 1` })
      .where(and(eq(schema.courseSection.courseId, courseId), gte(schema.courseSection.order, fromOrder)));
  } catch (error) {
    console.error('shiftCourseSectionOrders error:', error);
    throw new Error(`Failed to shift section order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function shiftLessonOrders(
  courseId: string,
  sectionId: string | null,
  fromOrder: number,
  dbClient: DbOrTxClient = db
) {
  try {
    const parent = sectionId ? eq(schema.lesson.sectionId, sectionId) : isNull(schema.lesson.sectionId);
    await dbClient
      .update(schema.lesson)
      .set({ order: sql`${schema.lesson.order} + 1` })
      .where(and(eq(schema.lesson.courseId, courseId), parent, gte(schema.lesson.order, fromOrder)));
  } catch (error) {
    console.error('shiftLessonOrders error:', error);
    throw new Error(`Failed to shift lesson order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function shiftExerciseOrders(
  courseId: string,
  parent: { sectionId?: string | null; lessonId?: string | null },
  fromOrder: number,
  dbClient: DbOrTxClient = db
) {
  try {
    const parentFilter = parent.sectionId
      ? eq(schema.exercise.sectionId, parent.sectionId)
      : parent.lessonId
        ? eq(schema.exercise.lessonId, parent.lessonId)
        : and(isNull(schema.exercise.sectionId), isNull(schema.exercise.lessonId));

    await dbClient
      .update(schema.exercise)
      .set({ order: sql`${schema.exercise.order} + 1` })
      .where(and(eq(schema.exercise.courseId, courseId), parentFilter, gte(schema.exercise.order, fromOrder)));
  } catch (error) {
    console.error('shiftExerciseOrders error:', error);
    throw new Error(`Failed to shift exercise order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteExerciseChildren(exerciseId: string, dbClient: DbOrTxClient = db) {
  try {
    const questions = await dbClient
      .select({ id: schema.question.id })
      .from(schema.question)
      .where(eq(schema.question.exerciseId, exerciseId));
    const questionIds = questions.map((question) => question.id);
    if (questionIds.length > 0) {
      await dbClient.delete(schema.question).where(inArray(schema.question.id, questionIds));
    }

    await dbClient.delete(schema.exerciseSection).where(eq(schema.exerciseSection.exerciseId, exerciseId));
  } catch (error) {
    console.error('deleteExerciseChildren error:', error);
    throw new Error(`Failed to replace exercise content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
