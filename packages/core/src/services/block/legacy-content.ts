import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TLessonSlide, TLessonVideoItem } from '@cio/utils/validation/lesson';
import type { TBlockType } from '@cio/utils/validation/block';
import { parseBlockData } from '@cio/utils/validation/block';
import type { TLessonLanguage, TLocale } from '@cio/db/types';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  createBlock,
  createPlacement,
  deleteBlocksWithoutPlacements,
  deletePlacements,
  getLessonBlockScope,
  getPlacementPositions,
  listLessonBlockRows,
  lockLessonBlockPositions,
  updateBlockDataIfVersion,
  updatePlacement,
  upsertBlockLocale,
  type LessonBlockRow
} from '@cio/db/queries/block';
import { sanitizeOptionalHtml } from '../../utils/sanitize-html';
import type { LessonDocument, LessonVideo } from '../../utils/lesson-media';
import { syncLessonAssetUsages } from './block';
import { recordBlockLocaleVersion } from './block-version';
import { enrichBlocksMedia, loadBlocksForLessons, loadLessonBlocks, type LessonBlock } from './block-view';
import { positionsAfter } from './positions';

const DEFAULT_LOCALE: TLocale = 'en';

export interface LegacyLessonContent {
  note: string | null;
  videos: LessonVideo[];
  documents: LessonDocument[];
  slides: TLessonSlide[];
}

export interface LegacyLessonContentPatch {
  note?: string;
  videos?: TLessonVideoItem[];
  documents?: LessonDocument[];
  slides?: TLessonSlide[];
}

export const LEGACY_LESSON_CONTENT_KEYS = ['note', 'videos', 'documents', 'slides', 'videoUrl', 'slideUrl'] as const;
type LegacyContentKey = (typeof LEGACY_LESSON_CONTENT_KEYS)[number];

/**
 * Separates the deprecated content fields from the lesson columns that are still stored on the lesson row.
 * `videoUrl` and `slideUrl` are dropped: nothing reads them any more.
 */
export function splitLegacyContent<T extends Partial<Record<LegacyContentKey, unknown>>>(
  data: T
): { patch: LegacyLessonContentPatch; rest: Omit<T, LegacyContentKey> } {
  const { note, videos, documents, slides, videoUrl: _videoUrl, slideUrl: _slideUrl, ...rest } = data;

  return {
    patch: { note, videos, documents, slides } as LegacyLessonContentPatch,
    rest: rest as Omit<T, LegacyContentKey>
  };
}

/**
 * Derives the deprecated lesson content fields (`note`, `videos`, `documents`, `slides`) from blocks,
 * for API responses that still expose them.
 */
export function blocksToLegacyContent(blocks: LessonBlock[], locale: TLocale = DEFAULT_LOCALE): LegacyLessonContent {
  const firstNote = blocks.find((block) => block.type === 'note');

  return {
    note: firstNote ? (firstNote.contents[locale] ?? null) : null,
    videos: blocks
      .filter((block) => block.type === 'video')
      .map((block) => ({ ...(block.data as LessonVideo), watchEnforced: block.required })),
    documents: blocks.filter((block) => block.type === 'document').map((block) => block.data as LessonDocument),
    slides: blocks
      .filter((block) => block.type === 'slides')
      .map((block) => ({ ...(block.data as Omit<TLessonSlide, 'id'>), id: block.id }))
  };
}

/**
 * Overlays a lesson row with its blocks and the legacy fields derived from them.
 * @param options.enrich resolve presigned media URLs on the blocks and the derived fields.
 */
export async function attachBlocksToLesson<T extends { id: string }>(
  lesson: T,
  options: { enrich?: boolean } = {}
): Promise<T & LegacyLessonContent & { blocks: LessonBlock[] }> {
  const loaded = await loadLessonBlocks(lesson.id);
  const blocks = options.enrich ? await enrichBlocksMedia(loaded) : loaded;

  return { ...lesson, ...blocksToLegacyContent(blocks), blocks };
}

/**
 * Same as {@link attachBlocksToLesson} for many lessons, using one block query.
 */
export async function attachBlocksToLessons<T extends { id: string }>(
  lessons: T[]
): Promise<(T & LegacyLessonContent & { blocks: LessonBlock[] })[]> {
  const blocksByLesson = await loadBlocksForLessons(lessons.map((lesson) => lesson.id));

  return lessons.map((lesson) => {
    const blocks = blocksByLesson.get(lesson.id) ?? [];

    return { ...lesson, ...blocksToLegacyContent(blocks), blocks };
  });
}

/**
 * Derives the deprecated `lessonLanguages` rows from the lesson's first note block.
 */
export function blocksToLegacyLanguages(lessonId: string, blocks: LessonBlock[]): TLessonLanguage[] {
  const firstNote = blocks.find((block) => block.type === 'note');
  if (!firstNote) return [];

  return Object.entries(firstNote.contents).map(([locale, content]) => ({
    id: 0,
    lessonId,
    locale: locale as TLocale,
    content: content ?? null,
    updatedAt: firstNote.updatedAt
  }));
}

interface LegacyItem {
  identity: string;
  data: Record<string, unknown>;
  required?: boolean;
}

function videoIdentity(video: { assetId?: string; key?: string; link?: string }): string {
  return video.assetId ?? video.key ?? video.link ?? '';
}

function toLegacyItems(type: TBlockType, patch: LegacyLessonContentPatch): LegacyItem[] | null {
  if (type === 'video' && patch.videos) {
    return patch.videos.map(({ watchEnforced, ...data }) => ({
      identity: videoIdentity(data),
      data,
      required: watchEnforced ?? false
    }));
  }

  if (type === 'document' && patch.documents) {
    return patch.documents.map((document) => ({ identity: document.assetId ?? document.key, data: { ...document } }));
  }

  if (type === 'slides' && patch.slides) {
    return patch.slides.map(({ id: _slideId, ...data }) => ({ identity: data.src, data }));
  }

  return null;
}

function sortedJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : 1))
        .map(([key, entry]) => [key, sortedJson(entry)])
    );
  }

  return value;
}

function isSameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortedJson(left)) === JSON.stringify(sortedJson(right));
}

function existingIdentity(row: LessonBlockRow): string {
  const data = row.block.data;
  if (row.block.type === 'video') return videoIdentity(data as { assetId?: string; key?: string; link?: string });
  if (row.block.type === 'document') return String(data.assetId ?? data.key ?? '');

  return String(data.src ?? '');
}

async function replaceBlocksOfType(
  lessonId: string,
  organizationId: string,
  type: TBlockType,
  items: LegacyItem[],
  actorProfileId: string | null,
  tx: DbOrTxClient
): Promise<void> {
  const rows = (await listLessonBlockRows(lessonId, tx)).filter((row) => row.block.type === type);
  const available = [...rows];
  const matched: { row: LessonBlockRow; item: LegacyItem }[] = [];
  const created: LegacyItem[] = [];

  for (const item of items) {
    const index = available.findIndex((row) => existingIdentity(row) === item.identity);
    if (index === -1) {
      created.push(item);
      continue;
    }

    matched.push({ row: available[index], item });
    available.splice(index, 1);
  }

  const orderedSlots = matched.map(({ row }) => row.placement.position).sort((left, right) => (left < right ? -1 : 1));
  for (const [index, { row, item }] of matched.entries()) {
    const data = parseBlockData(type, item.data);
    if (!data) {
      throw new AppError(`Invalid data for a ${type} block`, ErrorCodes.BLOCK_INVALID_DATA, 400);
    }

    if (!isSameJson(data, row.block.data)) {
      await updateBlockDataIfVersion(row.block.id, data as Record<string, unknown>, row.block.version, tx);
    }
    await updatePlacement(
      row.placement.id,
      { position: `~${index}`, ...(type === 'video' ? { required: item.required ?? false } : {}) },
      tx
    );
  }
  for (const [index, { row }] of matched.entries()) {
    await updatePlacement(row.placement.id, { position: orderedSlots[index] }, tx);
  }

  await deletePlacements(
    available.map((row) => row.placement.id),
    tx
  );
  await deleteBlocksWithoutPlacements(
    available.map((row) => row.block.id),
    tx
  );

  if (created.length > 0) {
    const ordered = await getPlacementPositions(lessonId, tx);
    const lastPosition = ordered[ordered.length - 1]?.position ?? null;
    const positions = positionsAfter(lastPosition, created.length);

    for (const [index, item] of created.entries()) {
      const data = parseBlockData(type, item.data);
      if (!data) {
        throw new AppError(`Invalid data for a ${type} block`, ErrorCodes.BLOCK_INVALID_DATA, 400);
      }

      const block = await createBlock(
        { organizationId, type, data: data as Record<string, unknown>, createdBy: actorProfileId },
        tx
      );
      await createPlacement(
        { lessonId, blockId: block.id, position: positions[index], required: item.required ?? false },
        tx
      );
    }
  }
}

async function replaceLegacyNote(
  lessonId: string,
  organizationId: string,
  note: string,
  actorProfileId: string | null,
  tx: DbOrTxClient
): Promise<void> {
  const content = sanitizeOptionalHtml(note) ?? '';
  const rows = await listLessonBlockRows(lessonId, tx);
  const noteRow = rows.find((row) => row.block.type === 'note');

  let blockId = noteRow?.block.id;
  if (!blockId) {
    if (content.trim() === '') return;

    const ordered = await getPlacementPositions(lessonId, tx);
    const block = await createBlock({ organizationId, type: 'note', data: {}, createdBy: actorProfileId }, tx);
    await createPlacement(
      {
        lessonId,
        blockId: block.id,
        position: positionsAfter(ordered[ordered.length - 1]?.position ?? null, 1)[0]
      },
      tx
    );
    blockId = block.id;
  }

  const saved = await upsertBlockLocale({ blockId, locale: DEFAULT_LOCALE, content }, tx);
  await recordBlockLocaleVersion({
    blockLocaleId: saved.id,
    content: saved.content,
    authorId: actorProfileId,
    intent: 'auto',
    dbClient: tx
  });
}

/**
 * Applies writes that still use the deprecated `note`, `videos`, `documents` and `slides` fields by translating
 * them into block changes: matching items keep their block, new items become blocks, omitted items are removed.
 * @returns true when the patch touched any block.
 */
export async function applyLegacyLessonContent(
  lessonId: string,
  patch: LegacyLessonContentPatch,
  options: { actorProfileId?: string | null; dbClient?: DbOrTxClient } = {}
): Promise<boolean> {
  const hasContent =
    patch.note !== undefined ||
    patch.videos !== undefined ||
    patch.documents !== undefined ||
    patch.slides !== undefined;
  if (!hasContent) return false;

  const actorProfileId = options.actorProfileId ?? null;
  const apply = async (tx: DbOrTxClient) => {
    const scope = await getLessonBlockScope(lessonId, tx);
    if (!scope) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    await lockLessonBlockPositions(lessonId, tx);

    for (const type of ['video', 'document', 'slides'] as const) {
      const items = toLegacyItems(type, patch);
      if (items) {
        await replaceBlocksOfType(lessonId, scope.organizationId, type, items, actorProfileId, tx);
      }
    }

    if (patch.note !== undefined) {
      await replaceLegacyNote(lessonId, scope.organizationId, patch.note, actorProfileId, tx);
    }

    await syncLessonAssetUsages(lessonId, scope.organizationId, actorProfileId, tx);
  };

  if (options.dbClient) {
    await apply(options.dbClient);
  } else {
    await db.transaction(apply);
  }

  return true;
}
