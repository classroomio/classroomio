import * as schema from '@db/schema';

import type { TLessonLanguage, TLocale, TNewLessonLanguage } from '@db/types';
import { and, eq } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

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

/**
 * Writes only the lesson language row. Version history is deliberately *not*
 * recorded here: whether a write deserves a snapshot — and whether it folds into
 * an open editing session — is a policy decision owned by
 * `recordLessonLanguageVersion` in `@cio/core/services/lesson-version`. Having
 * this helper insert history meant every caller silently versioned, which turned
 * each autosave debounce into a separate "version".
 */
export async function createLessonLanguage(
  data: TNewLessonLanguage,
  dbClient?: DbOrTxClient
): Promise<TLessonLanguage> {
  const create = async (client: DbOrTxClient) => {
    const [language] = await client.insert(schema.lessonLanguage).values(data).returning();
    if (!language) {
      throw new Error('Failed to create lesson language');
    }

    return language;
  };

  return dbClient ? create(dbClient) : db.transaction(create);
}

export async function updateLessonLanguage(
  lessonId: string,
  locale: TLocale,
  data: Partial<TNewLessonLanguage>,
  dbClient?: DbOrTxClient
): Promise<TLessonLanguage> {
  const update = async (client: DbOrTxClient) => {
    const [existing] = await client
      .select()
      .from(schema.lessonLanguage)
      .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale)))
      .limit(1);

    if (!existing) {
      throw new Error('Lesson language not found');
    }

    const [language] = await client
      .update(schema.lessonLanguage)
      .set(data)
      .where(eq(schema.lessonLanguage.id, existing.id))
      .returning();

    if (!language) {
      throw new Error('Failed to update lesson language');
    }

    return language;
  };

  return dbClient ? update(dbClient) : db.transaction(update);
}

export async function deleteLessonLanguage(lessonId: string, locale: TLocale): Promise<TLessonLanguage | null> {
  const [language] = await db
    .delete(schema.lessonLanguage)
    .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale)))
    .returning();

  return language || null;
}

export async function upsertLessonLanguage(
  data: TNewLessonLanguage,
  dbClient?: DbOrTxClient
): Promise<TLessonLanguage> {
  const upsert = async (client: DbOrTxClient) => {
    const lessonId = data.lessonId!;
    const locale = data.locale || 'en';
    const [existing] = await client
      .select()
      .from(schema.lessonLanguage)
      .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale)))
      .limit(1);

    if (existing) {
      const language = await updateLessonLanguage(lessonId, locale, data, client);
      if (!language) {
        throw new Error('Failed to update lesson language');
      }

      return language;
    }

    return createLessonLanguage(data, client);
  };

  return dbClient ? upsert(dbClient) : db.transaction(upsert);
}
