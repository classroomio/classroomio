import * as schema from '@db/schema';

import { db, eq, inArray } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';
import { positionBetween } from '@db/queries/block/positions';

export interface SeedBlock {
  type: 'note' | 'video' | 'slides' | 'document';
  data?: Record<string, unknown>;
  required?: boolean;
  contents?: Partial<Record<'en' | 'fr', string>>;
}

export interface SeedLessonBlocks {
  lessonId: string;
  blocks: SeedBlock[];
}

/**
 * Places the given blocks, in order, in lessons that have none yet. Lessons that already hold blocks are left alone.
 */
export async function seedLessonBlocks(entries: SeedLessonBlocks[], dbClient: DbOrTxClient = db) {
  const lessonIds = entries.map((entry) => entry.lessonId);
  if (lessonIds.length === 0) return;

  const organizations = await dbClient
    .select({ lessonId: schema.lesson.id, organizationId: schema.group.organizationId })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
    .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
    .where(inArray(schema.lesson.id, lessonIds));
  const organizationByLesson = new Map(organizations.map((row) => [row.lessonId, row.organizationId]));

  const placed = await dbClient
    .selectDistinct({ lessonId: schema.blockPlacement.lessonId })
    .from(schema.blockPlacement)
    .where(inArray(schema.blockPlacement.lessonId, lessonIds));
  const alreadySeeded = new Set(placed.map((row) => row.lessonId));

  for (const entry of entries) {
    const organizationId = organizationByLesson.get(entry.lessonId);
    if (!organizationId || alreadySeeded.has(entry.lessonId)) continue;

    let previousPosition: string | null = null;
    for (const seedBlock of entry.blocks) {
      const [block] = await dbClient
        .insert(schema.block)
        .values({ organizationId, type: seedBlock.type, data: seedBlock.data ?? {} })
        .returning({ id: schema.block.id });

      previousPosition = positionBetween(previousPosition, null);
      await dbClient.insert(schema.blockPlacement).values({
        lessonId: entry.lessonId,
        blockId: block.id,
        position: previousPosition,
        required: seedBlock.required ?? false
      });

      for (const [locale, content] of Object.entries(seedBlock.contents ?? {})) {
        await dbClient.insert(schema.blockLocale).values({ blockId: block.id, locale: locale as 'en' | 'fr', content });
      }
    }
  }
}
