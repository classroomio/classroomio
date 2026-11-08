import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TBlock, TBlockPlacement } from '@cio/db/types';
import {
  createBlock,
  createPlacement,
  deleteBlocksWithoutPlacements,
  deletePlacements,
  listBlockLocales,
  listBlockRowsForLessons,
  updateBlockDataIfVersion,
  updatePlacement,
  upsertBlockLocale
} from '@cio/db/queries/block';
import { recordBlockLocaleVersion } from './block-version';
import { isSameJson } from './json';

type Transform = <T>(value: T) => Promise<T> | T;

interface CopyLessonBlocksInput {
  lessonIdMap: Map<string, string>;
  organizationId: string;
  actorProfileId: string | null;
  transform?: Transform;
  setSourceIds?: boolean;
  dbClient: DbOrTxClient;
}

/**
 * Deep-copies the blocks of the source lessons onto their counterparts in `lessonIdMap`.
 * A block shared by several source lessons stays shared among their copies, so a copied course
 * keeps its internal reuse. Version history is not copied.
 * @param input.transform rewrites block data and content, e.g. to remap asset ids across organizations.
 * @param input.setSourceIds links each copy to its source block so template pulls can update it in place.
 */
export async function copyLessonBlocks({
  lessonIdMap,
  organizationId,
  actorProfileId,
  transform = (value) => value,
  setSourceIds = false,
  dbClient
}: CopyLessonBlocksInput): Promise<Map<string, string>> {
  const rows = await listBlockRowsForLessons([...lessonIdMap.keys()], dbClient);
  const locales = await listBlockLocales([...new Set(rows.map((row) => row.block.id))], dbClient);
  const copiedBlockIds = new Map<string, string>();

  for (const { placement, block, lessonId } of rows) {
    const targetLessonId = lessonIdMap.get(lessonId);
    if (!targetLessonId) continue;

    let copiedBlockId = copiedBlockIds.get(block.id);
    if (!copiedBlockId) {
      const data = await transform(block.data);
      const copy = await createBlock(
        {
          organizationId,
          type: block.type,
          schemaVersion: block.schemaVersion,
          data,
          createdBy: actorProfileId,
          sourceId: setSourceIds ? block.id : null
        },
        dbClient
      );
      copiedBlockId = copy.id;
      copiedBlockIds.set(block.id, copiedBlockId);

      for (const locale of locales.filter((entry) => entry.blockId === block.id)) {
        const content = await transform(locale.content);
        await upsertBlockLocale({ blockId: copiedBlockId, locale: locale.locale, content }, dbClient);
      }
    }

    await createPlacement(
      {
        lessonId: targetLessonId,
        blockId: copiedBlockId,
        position: placement.position,
        required: placement.required,
        watchThreshold: placement.watchThreshold
      },
      dbClient
    );
  }

  return copiedBlockIds;
}

interface PullLessonBlocksInput {
  /** Template lesson id → course lesson id, for every lesson being pulled. */
  lessonIdMap: Map<string, string>;
  /** Every lesson of the course, so a template block already copied into another lesson is reused. */
  courseLessonIds: string[];
  organizationId: string;
  actorProfileId: string | null;
  transform?: Transform;
  dbClient: DbOrTxClient;
}

/**
 * Makes each course lesson in `lessonIdMap` hold the same blocks, in the same order, as its template lesson.
 * A course block linked to a template block through `source_id` is updated in place, so its version history
 * survives and a block shared by several lessons stays shared. Template blocks with no course copy yet are
 * created. Blocks the template lesson no longer holds are removed from the course lesson, and deleted when no
 * other lesson uses them. Changed or new note content is recorded as a manual version.
 */
export async function pullLessonBlocksFromSource({
  lessonIdMap,
  courseLessonIds,
  organizationId,
  actorProfileId,
  transform = (value) => value,
  dbClient
}: PullLessonBlocksInput): Promise<void> {
  const templateRows = await listBlockRowsForLessons([...lessonIdMap.keys()], dbClient);
  const courseRows = await listBlockRowsForLessons(courseLessonIds, dbClient);

  const courseBlockBySource = new Map<string, TBlock>();
  for (const { block } of courseRows) {
    if (block.sourceId && !courseBlockBySource.has(block.sourceId)) courseBlockBySource.set(block.sourceId, block);
  }

  const templateBlocks = new Map(templateRows.map(({ block }) => [block.id, block]));
  const templateLocales = await listBlockLocales([...templateBlocks.keys()], dbClient);
  const existingCourseBlockIds = [...courseBlockBySource.values()].map((block) => block.id);
  const courseLocales = await listBlockLocales(existingCourseBlockIds, dbClient);

  const courseBlockIdByTemplate = new Map<string, string>();
  for (const templateBlock of templateBlocks.values()) {
    const data = await transform(templateBlock.data);
    const existing = courseBlockBySource.get(templateBlock.id);
    let courseBlockId: string;

    if (existing) {
      courseBlockId = existing.id;
      if (!isSameJson(data, existing.data)) {
        const updated = await updateBlockDataIfVersion(existing.id, data, existing.version, dbClient);
        if (!updated) {
          throw new AppError('This block was changed by someone else', ErrorCodes.BLOCK_VERSION_CONFLICT, 409);
        }
      }
    } else {
      const created = await createBlock(
        {
          organizationId,
          type: templateBlock.type,
          schemaVersion: templateBlock.schemaVersion,
          data,
          createdBy: actorProfileId,
          sourceId: templateBlock.id
        },
        dbClient
      );
      courseBlockId = created.id;
    }
    courseBlockIdByTemplate.set(templateBlock.id, courseBlockId);

    for (const templateLocale of templateLocales.filter((entry) => entry.blockId === templateBlock.id)) {
      const content = await transform(templateLocale.content);
      const current = courseLocales.find(
        (entry) => entry.blockId === courseBlockId && entry.locale === templateLocale.locale
      );
      if (current && current.content === content) continue;

      const saved = await upsertBlockLocale(
        { blockId: courseBlockId, locale: templateLocale.locale, content },
        dbClient
      );
      await recordBlockLocaleVersion({
        blockLocaleId: saved.id,
        content: saved.content,
        authorId: actorProfileId,
        intent: 'manual',
        dbClient
      });
    }
  }

  const removedBlockIds: string[] = [];
  for (const [templateLessonId, courseLessonId] of lessonIdMap) {
    const desired = templateRows
      .filter((row) => row.lessonId === templateLessonId)
      .map((row) => ({ placement: row.placement, blockId: courseBlockIdByTemplate.get(row.block.id)! }));
    const current = courseRows.filter((row) => row.lessonId === courseLessonId);
    const desiredBlockIds = new Set(desired.map((entry) => entry.blockId));

    const removed = current.filter((row) => !desiredBlockIds.has(row.block.id));
    const kept = current.filter((row) => desiredBlockIds.has(row.block.id));
    await deletePlacements(
      removed.map((row) => row.placement.id),
      dbClient
    );
    removedBlockIds.push(...removed.map((row) => row.block.id));

    for (const [index, row] of kept.entries()) {
      await updatePlacement(row.placement.id, { position: `~${index}` }, dbClient);
    }

    const keptByBlock = new Map(kept.map((row) => [row.block.id, row.placement]));
    for (const { placement, blockId } of desired) {
      const settings = pickPlacementSettings(placement);
      const keptPlacement = keptByBlock.get(blockId);
      if (keptPlacement) {
        await updatePlacement(keptPlacement.id, settings, dbClient);
        continue;
      }

      await createPlacement({ lessonId: courseLessonId, blockId, ...settings }, dbClient);
    }
  }

  await deleteBlocksWithoutPlacements(removedBlockIds, dbClient);
}

function pickPlacementSettings(placement: TBlockPlacement) {
  return {
    position: placement.position,
    required: placement.required,
    watchThreshold: placement.watchThreshold
  };
}
