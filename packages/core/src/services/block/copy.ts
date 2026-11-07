import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  createBlock,
  createPlacement,
  listBlockLocales,
  listBlockRowsForLessons,
  upsertBlockLocale
} from '@cio/db/queries/block';

interface CopyLessonBlocksInput {
  lessonIdMap: Map<string, string>;
  organizationId: string;
  actorProfileId: string | null;
  transform?: <T>(value: T) => Promise<T> | T;
  dbClient: DbOrTxClient;
}

/**
 * Deep-copies the blocks of the source lessons onto their counterparts in `lessonIdMap`.
 * A block shared by several source lessons stays shared among their copies, so a copied course
 * keeps its internal reuse. Version history is not copied.
 * @param input.transform rewrites block data and content, e.g. to remap asset ids across organizations.
 */
export async function copyLessonBlocks({
  lessonIdMap,
  organizationId,
  actorProfileId,
  transform = (value) => value,
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
      const copy = await createBlock(
        {
          organizationId,
          type: block.type,
          schemaVersion: block.schemaVersion,
          data: await transform(block.data),
          createdBy: actorProfileId
        },
        dbClient
      );
      copiedBlockId = copy.id;
      copiedBlockIds.set(block.id, copiedBlockId);

      for (const locale of locales.filter((entry) => entry.blockId === block.id)) {
        await upsertBlockLocale(
          { blockId: copiedBlockId, locale: locale.locale, content: await transform(locale.content) },
          dbClient
        );
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
