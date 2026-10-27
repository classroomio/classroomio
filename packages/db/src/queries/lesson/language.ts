import * as schema from '@db/schema';

import type { TBlockLocale, TLessonLanguage, TLocale, TNewLessonLanguage } from '@db/types';
import { and, eq, inArray } from 'drizzle-orm';

import { db, sql, type DbOrTxClient } from '@db/drizzle';
import { positionBetween } from '@db/queries/block/positions';

function toLessonLanguage(lessonId: string, locale: TBlockLocale): TLessonLanguage {
  return {
    id: locale.id,
    lessonId,
    locale: locale.locale,
    content: locale.content,
    updatedAt: locale.updatedAt
  };
}

async function findPrimaryNoteBlockId(lessonId: string, client: DbOrTxClient): Promise<string | null> {
  const [row] = await client
    .select({ blockId: schema.block.id })
    .from(schema.blockPlacement)
    .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
    .where(and(eq(schema.blockPlacement.lessonId, lessonId), eq(schema.block.type, 'note')))
    .orderBy(sql`${schema.blockPlacement.position} COLLATE "C"`)
    .limit(1);

  return row?.blockId ?? null;
}

async function ensurePrimaryNoteBlockId(lessonId: string, client: DbOrTxClient): Promise<string> {
  const existing = await findPrimaryNoteBlockId(lessonId, client);
  if (existing) return existing;

  const [scope] = await client
    .select({ organizationId: schema.group.organizationId })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
    .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
    .where(eq(schema.lesson.id, lessonId))
    .limit(1);
  if (!scope?.organizationId) {
    throw new Error('Lesson not found');
  }

  await client.execute(sql`select pg_advisory_xact_lock(hashtext(${`lesson_block_positions:${lessonId}`}))`);

  const [last] = await client
    .select({ position: schema.blockPlacement.position })
    .from(schema.blockPlacement)
    .where(eq(schema.blockPlacement.lessonId, lessonId))
    .orderBy(sql`${schema.blockPlacement.position} COLLATE "C" DESC`)
    .limit(1);

  const [block] = await client
    .insert(schema.block)
    .values({ organizationId: scope.organizationId, type: 'note', data: {} })
    .returning({ id: schema.block.id });
  await client
    .insert(schema.blockPlacement)
    .values({ lessonId, blockId: block.id, position: positionBetween(last?.position ?? null, null) });

  return block.id;
}

/**
 * Lists the localized note content of a lesson's first note block.
 */
export async function getLessonLanguagesByLessonId(lessonId: string): Promise<TLessonLanguage[]> {
  const blockId = await findPrimaryNoteBlockId(lessonId, db);
  if (!blockId) return [];

  const locales = await db.select().from(schema.blockLocale).where(eq(schema.blockLocale.blockId, blockId));

  return locales.map((locale) => toLessonLanguage(lessonId, locale));
}

export async function getLessonLanguageByLessonIdAndLocale(
  lessonId: string,
  locale: TLocale
): Promise<TLessonLanguage | null> {
  const blockId = await findPrimaryNoteBlockId(lessonId, db);
  if (!blockId) return null;

  const [row] = await db
    .select()
    .from(schema.blockLocale)
    .where(and(eq(schema.blockLocale.blockId, blockId), eq(schema.blockLocale.locale, locale)))
    .limit(1);

  return row ? toLessonLanguage(lessonId, row) : null;
}

/**
 * Writes a locale of the lesson's first note block, creating the note block when the lesson has none.
 * Version history is recorded by the caller.
 */
export async function createLessonLanguage(
  data: TNewLessonLanguage,
  dbClient?: DbOrTxClient
): Promise<TLessonLanguage> {
  const create = async (client: DbOrTxClient) => {
    const lessonId = data.lessonId!;
    const blockId = await ensurePrimaryNoteBlockId(lessonId, client);
    const [row] = await client
      .insert(schema.blockLocale)
      .values({ blockId, locale: data.locale ?? 'en', content: data.content ?? null })
      .onConflictDoUpdate({
        target: [schema.blockLocale.blockId, schema.blockLocale.locale],
        set: { content: data.content ?? null, updatedAt: sql`now()` }
      })
      .returning();
    if (!row) {
      throw new Error('Failed to create lesson language');
    }

    return toLessonLanguage(lessonId, row);
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
    const blockId = await findPrimaryNoteBlockId(lessonId, client);
    if (!blockId) {
      throw new Error('Lesson language not found');
    }

    const [row] = await client
      .update(schema.blockLocale)
      .set({ ...(data.content !== undefined ? { content: data.content } : {}), updatedAt: sql`now()` })
      .where(and(eq(schema.blockLocale.blockId, blockId), eq(schema.blockLocale.locale, locale)))
      .returning();
    if (!row) {
      throw new Error('Lesson language not found');
    }

    await client
      .update(schema.block)
      .set({ version: sql`${schema.block.version} + 1`, updatedAt: sql`now()` })
      .where(eq(schema.block.id, blockId));

    return toLessonLanguage(lessonId, row);
  };

  return dbClient ? update(dbClient) : db.transaction(update);
}

export async function deleteLessonLanguage(lessonId: string, locale: TLocale): Promise<TLessonLanguage | null> {
  const blockId = await findPrimaryNoteBlockId(lessonId, db);
  if (!blockId) return null;

  const [row] = await db
    .delete(schema.blockLocale)
    .where(and(eq(schema.blockLocale.blockId, blockId), eq(schema.blockLocale.locale, locale)))
    .returning();

  return row ? toLessonLanguage(lessonId, row) : null;
}

export async function upsertLessonLanguage(
  data: TNewLessonLanguage,
  dbClient?: DbOrTxClient
): Promise<TLessonLanguage> {
  const upsert = async (client: DbOrTxClient) => {
    const lessonId = data.lessonId!;
    const locale = data.locale ?? 'en';
    const existing = await getLessonLanguageByLessonIdAndLocaleWith(client, lessonId, locale);
    if (existing) {
      return updateLessonLanguage(lessonId, locale, data, client);
    }

    return createLessonLanguage(data, client);
  };

  return dbClient ? upsert(dbClient) : db.transaction(upsert);
}

async function getLessonLanguageByLessonIdAndLocaleWith(
  client: DbOrTxClient,
  lessonId: string,
  locale: TLocale
): Promise<TLessonLanguage | null> {
  const blockId = await findPrimaryNoteBlockId(lessonId, client);
  if (!blockId) return null;

  const [row] = await client
    .select()
    .from(schema.blockLocale)
    .where(and(eq(schema.blockLocale.blockId, blockId), eq(schema.blockLocale.locale, locale)))
    .limit(1);

  return row ? toLessonLanguage(lessonId, row) : null;
}

export async function listLessonLanguagesForLessons(
  lessonIds: string[],
  dbClient: DbOrTxClient = db
): Promise<TLessonLanguage[]> {
  if (lessonIds.length === 0) return [];

  const rows = await dbClient
    .select({
      lessonId: schema.blockPlacement.lessonId,
      blockId: schema.block.id,
      position: schema.blockPlacement.position
    })
    .from(schema.blockPlacement)
    .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
    .where(and(inArray(schema.blockPlacement.lessonId, lessonIds), eq(schema.block.type, 'note')))
    .orderBy(schema.blockPlacement.lessonId, sql`${schema.blockPlacement.position} COLLATE "C"`);

  const primaryBlockByLesson = new Map<string, string>();
  for (const row of rows) {
    if (!primaryBlockByLesson.has(row.lessonId)) primaryBlockByLesson.set(row.lessonId, row.blockId);
  }
  if (primaryBlockByLesson.size === 0) return [];

  const locales = await dbClient
    .select()
    .from(schema.blockLocale)
    .where(inArray(schema.blockLocale.blockId, [...primaryBlockByLesson.values()]));

  const lessonByBlock = new Map([...primaryBlockByLesson].map(([lessonId, blockId]) => [blockId, lessonId]));

  return locales.map((locale) => toLessonLanguage(lessonByBlock.get(locale.blockId)!, locale));
}
