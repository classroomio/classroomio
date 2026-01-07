import * as schema from '@db/schema';

import type { TNewQuiz, TQuiz } from '@db/types';

import { db } from '@db/drizzle';
import { eq } from 'drizzle-orm';

export async function getQuizzesByOrganizationId(orgId: string): Promise<TQuiz[]> {
  const quizzes = await db
    .select()
    .from(schema.quiz)
    .where(eq(schema.quiz.organizationId, orgId))
    .orderBy(schema.quiz.updatedAt);

  return quizzes;
}

export async function getQuizById(quizId: string): Promise<TQuiz | null> {
  const [quiz] = await db.select().from(schema.quiz).where(eq(schema.quiz.id, quizId)).limit(1);

  return quiz || null;
}

export async function createQuiz(data: TNewQuiz): Promise<TQuiz> {
  const [quiz] = await db.insert(schema.quiz).values(data).returning();

  return quiz;
}

export async function updateQuiz(quizId: string, data: Partial<TNewQuiz>): Promise<TQuiz> {
  const [quiz] = await db
    .update(schema.quiz)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.quiz.id, quizId))
    .returning();

  return quiz;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await db.delete(schema.quiz).where(eq(schema.quiz.id, quizId));
}
