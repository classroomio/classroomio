import type { TBlock, TBlockPlacement, TLocale } from '@cio/db/types';
import { listBlockMedia, withBlockMedia, type TBlockType } from '@cio/utils/validation/block';
import {
  getPlacementCountsByBlockIds,
  listBlockLocales,
  listBlockRowsForLessons,
  listLessonBlockRows,
  type LessonBlockRow
} from '@cio/db/queries/block';
import { signHtmlContentUrl } from '../../utils/html-content';
import { enrichLessonMedia, type LessonDocument, type LessonVideo } from '../../utils/lesson-media';

export interface LessonBlock {
  id: string;
  placementId: string;
  lessonId: string;
  type: TBlockType;
  position: string;
  required: boolean;
  watchThreshold: number | null;
  version: number;
  schemaVersion: number;
  data: Record<string, unknown>;
  contents: Partial<Record<TLocale, string | null>>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toLessonBlock(
  placement: TBlockPlacement,
  block: TBlock,
  contents: LessonBlock['contents'],
  usageCount: number
): LessonBlock {
  return {
    id: block.id,
    placementId: placement.id,
    lessonId: placement.lessonId,
    type: block.type as TBlockType,
    position: placement.position,
    required: placement.required,
    watchThreshold: placement.watchThreshold,
    version: block.version,
    schemaVersion: block.schemaVersion,
    data: block.data,
    contents,
    usageCount,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  };
}

async function hydrateRows(rows: LessonBlockRow[]): Promise<LessonBlock[]> {
  const blockIds = [...new Set(rows.map((row) => row.block.id))];
  const [locales, usageCounts] = await Promise.all([
    listBlockLocales(blockIds),
    getPlacementCountsByBlockIds(blockIds)
  ]);

  const contentsByBlock = new Map<string, LessonBlock['contents']>();
  for (const locale of locales) {
    const contents = contentsByBlock.get(locale.blockId) ?? {};
    contents[locale.locale] = locale.content;
    contentsByBlock.set(locale.blockId, contents);
  }

  return rows.map((row) =>
    toLessonBlock(row.placement, row.block, contentsByBlock.get(row.block.id) ?? {}, usageCounts.get(row.block.id) ?? 1)
  );
}

/**
 * Loads a lesson's blocks in display order, without media enrichment.
 */
export async function loadLessonBlocks(lessonId: string): Promise<LessonBlock[]> {
  return hydrateRows(await listLessonBlockRows(lessonId));
}

/**
 * Loads blocks for many lessons at once, keyed by lesson id. Lessons without blocks map to an empty list.
 */
export async function loadBlocksForLessons(lessonIds: string[]): Promise<Map<string, LessonBlock[]>> {
  const rows = await listBlockRowsForLessons(lessonIds);
  const blocks = await hydrateRows(rows);
  const byLesson = new Map<string, LessonBlock[]>(lessonIds.map((lessonId) => [lessonId, []]));
  for (const block of blocks) {
    byLesson.get(block.lessonId)?.push(block);
  }

  return byLesson;
}

/**
 * Adds a signed `url` to an HTML page item so the sandboxed content route serves it.
 */
export function withHtmlContentUrl(data: Record<string, unknown>): Record<string, unknown> {
  const url = typeof data.assetId === 'string' ? signHtmlContentUrl(data.assetId) : null;

  return url ? { ...data, url } : data;
}

/**
 * Applies canonical asset metadata and presigned URLs to every video and document a block plays,
 * including videos kept inside a block such as a tab, and a signed URL to every HTML page.
 * @returns blocks in the same order; blocks without media pass through untouched.
 */
export async function enrichBlocksMedia(blocks: LessonBlock[]): Promise<LessonBlock[]> {
  const mediaByBlock = blocks.map((block) => listBlockMedia(block.type, block.data));
  const videos = mediaByBlock.flat().filter((item) => item.media === 'video');
  const documents = mediaByBlock.flat().filter((item) => item.media === 'document');
  const hasHtml = mediaByBlock.flat().some((item) => item.media === 'html');
  if (videos.length === 0 && documents.length === 0 && !hasHtml) return blocks;

  const enriched = await enrichLessonMedia({
    videos: videos.map((item) => item.data as LessonVideo),
    documents: documents.map((item) => item.data as LessonDocument)
  });

  let nextVideo = 0;
  let nextDocument = 0;

  return blocks.map((block, index) => {
    const items = mediaByBlock[index];
    if (items.length === 0) return block;

    const signed = items.map((item) => {
      if (item.media === 'html') return withHtmlContentUrl(item.data);

      return item.media === 'video' ? enriched.videos[nextVideo++] : enriched.documents[nextDocument++];
    }) as Record<string, unknown>[];

    return { ...block, data: withBlockMedia(block.type, block.data, signed) };
  });
}
