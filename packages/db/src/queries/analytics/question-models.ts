import { eq, inArray } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db, type DbOrTxClient } from '@db/drizzle';

/** The questions with their options, for grouping the answers a metric collected. */
export async function getQuestionsWithOptionsByIds(questionIds: number[], dbClient: DbOrTxClient = db) {
  if (questionIds.length === 0) return [];

  try {
    const rows = await dbClient
      .select({ question: schema.question, option: schema.option })
      .from(schema.question)
      .leftJoin(schema.option, eq(schema.option.questionId, schema.question.id))
      .where(inArray(schema.question.id, questionIds));

    const questions = new Map<
      number,
      typeof schema.question.$inferSelect & { options: Array<typeof schema.option.$inferSelect> }
    >();
    for (const row of rows) {
      const entry = questions.get(row.question.id) ?? { ...row.question, options: [] };
      if (row.option) entry.options.push(row.option);
      questions.set(row.question.id, entry);
    }

    return [...questions.values()];
  } catch (error) {
    console.error('getQuestionsWithOptionsByIds error:', error);
    throw new Error('Failed to get questions');
  }
}
