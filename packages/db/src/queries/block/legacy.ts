import * as schema from '@db/schema';

import type { TBlock, TBlockPlacement, TLessonLanguage, TLocale } from '@db/types';
import { db, eq, inArray, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

type LegacyVideo = NonNullable<typeof schema.lesson.$inferSelect.videos>[number];
type LegacyDocument = NonNullable<typeof schema.lesson.$inferSelect.documents>[number];
type LegacySlide = NonNullable<typeof schema.lesson.$inferSelect.slides>[number];

export interface DerivedLessonContent {
  note: string | null;
  videos: LegacyVideo[];
  documents: LegacyDocument[];
  slides: LegacySlide[];
  lessonLanguages: TLessonLanguage[];
}

interface PlacedBlock {
  placement: TBlockPlacement;
  block: TBlock;
}

function emptyContent(): DerivedLessonContent {
  return { note: null, videos: [], documents: [], slides: [], lessonLanguages: [] };
}

/**
 * Derives the deprecated lesson content fields from a lesson's placed blocks, in display order.
 * `lessonLanguages` comes from the first note block's locales.
 */
export function deriveLessonContent(
  lessonId: string,
  placed: PlacedBlock[],
  locales: { blockId: string; id: number; locale: TLocale; content: string | null; updatedAt: string }[]
): DerivedLessonContent {
  const content = emptyContent();
  const firstNote = placed.find(({ block }) => block.type === 'note');

  for (const { placement, block } of placed) {
    if (block.type === 'video') {
      content.videos.push({ ...(block.data as LegacyVideo), watchEnforced: placement.required });
    } else if (block.type === 'document') {
      content.documents.push(block.data as LegacyDocument);
    } else if (block.type === 'slides') {
      content.slides.push({ ...(block.data as Omit<LegacySlide, 'id'>), id: block.id } as LegacySlide);
    }
  }

  if (firstNote) {
    content.lessonLanguages = locales
      .filter((locale) => locale.blockId === firstNote.block.id)
      .map((locale) => ({
        id: locale.id,
        lessonId,
        locale: locale.locale,
        content: locale.content,
        updatedAt: locale.updatedAt
      }));
    content.note = content.lessonLanguages.find((locale) => locale.locale === 'en')?.content ?? null;
  }

  return content;
}

/**
 * Loads derived legacy content for many lessons with two queries.
 */
export async function getDerivedLessonContentMap(
  lessonIds: string[],
  dbClient: DbOrTxClient = db
): Promise<Map<string, DerivedLessonContent>> {
  const result = new Map<string, DerivedLessonContent>(lessonIds.map((lessonId) => [lessonId, emptyContent()]));
  if (lessonIds.length === 0) return result;

  try {
    const placedRows = await dbClient
      .select({ placement: schema.blockPlacement, block: schema.block })
      .from(schema.blockPlacement)
      .innerJoin(schema.block, eq(schema.block.id, schema.blockPlacement.blockId))
      .where(inArray(schema.blockPlacement.lessonId, lessonIds))
      .orderBy(schema.blockPlacement.lessonId, sql`${schema.blockPlacement.position} COLLATE "C"`);

    const blockIds = [...new Set(placedRows.map((row) => row.block.id))];
    const locales = blockIds.length
      ? await dbClient.select().from(schema.blockLocale).where(inArray(schema.blockLocale.blockId, blockIds))
      : [];

    const placedByLesson = new Map<string, PlacedBlock[]>();
    for (const row of placedRows) {
      const list = placedByLesson.get(row.placement.lessonId) ?? [];
      list.push(row);
      placedByLesson.set(row.placement.lessonId, list);
    }

    for (const lessonId of lessonIds) {
      result.set(lessonId, deriveLessonContent(lessonId, placedByLesson.get(lessonId) ?? [], locales));
    }

    return result;
  } catch (error) {
    console.error('getDerivedLessonContentMap error:', error);
    throw new Error(`Failed to derive lesson content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Overlays lesson rows with the legacy content fields derived from their blocks.
 */
export async function withDerivedLessonContent<T extends { id: string }>(
  lessons: T[],
  dbClient: DbOrTxClient = db
): Promise<(T & DerivedLessonContent)[]> {
  const contentMap = await getDerivedLessonContentMap(
    lessons.map((lesson) => lesson.id),
    dbClient
  );

  return lessons.map((lesson) => ({ ...lesson, ...(contentMap.get(lesson.id) ?? emptyContent()) }));
}
