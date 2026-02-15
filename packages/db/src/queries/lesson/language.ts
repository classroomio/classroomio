import * as schema from '@db/schema';

import type { TLessonLanguage, TLocale, TNewLessonLanguage } from '@db/types';
import { and, eq } from 'drizzle-orm';

import { db } from '@db/drizzle';

export async function getLessonLanguagesByLessonId(lessonId: string): Promise<TLessonLanguage[]> {
  const languages = await db.select().from(schema.lessonLanguage).where(eq(schema.lessonLanguage.lessonId, lessonId));

  return languages;
}

export async function getLessonLanguageByLessonIdAndLocale(
  lessonId: string,
  locale: TLocale
): Promise<TLessonLanguage | null> {
  const [language] = await db
    .select()
    .from(schema.lessonLanguage)
    .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale)))
    .limit(1);

  return language || null;
}

export async function createLessonLanguage(data: TNewLessonLanguage): Promise<TLessonLanguage> {
  const [language] = await db.insert(schema.lessonLanguage).values(data).returning();

  return language;
}

export async function updateLessonLanguage(
  lessonId: string,
  locale: TLocale,
  data: Partial<TNewLessonLanguage>
): Promise<TLessonLanguage> {
  const [language] = await db
    .update(schema.lessonLanguage)
    .set(data)
    .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale)))
    .returning();

  return language;
}

export async function upsertLessonLanguage(data: TNewLessonLanguage): Promise<TLessonLanguage> {
  // Check if exists
  const existing = await getLessonLanguageByLessonIdAndLocale(data.lessonId!, data.locale || 'en');

  if (existing) {
    return updateLessonLanguage(data.lessonId!, data.locale || 'en', data);
  }

  return createLessonLanguage(data);
}
