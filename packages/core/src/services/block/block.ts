import { AppError, ErrorCodes } from '@cio/utils/errors';
import {
  parseBlockData,
  type TBlockAttach,
  type TBlockCreate,
  type TBlockDuplicate,
  type TBlockLibraryQuery,
  type TBlockType,
  type TPlacementMove,
  type TPlacementUpdate
} from '@cio/utils/validation/block';
import type { TBlock, TBlockLocale, TBlockPlacement, TLocale } from '@cio/db/types';
import type { TLessonVersionIntent } from '@cio/utils/constants/lesson-version';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  bumpBlockVersionIfVersion,
  copyBlockLocales,
  createBlock,
  createPlacement,
  deleteBlocksWithoutPlacements,
  deletePlacements,
  getBlockById,
  getBlockUsages,
  getBlockVersionHistory,
  getLessonBlockRow,
  getLessonBlockScope,
  getPlacementCountsByBlockIds,
  getPlacementPositions,
  getPlacementWithBlock,
  listBlockLocales,
  listLessonBlockRows,
  listLessonIdsForBlock,
  listOrganizationBlocks,
  lockLessonBlockPositions,
  repointPlacement,
  touchLessonsUpdatedAt,
  updateBlockDataIfVersion,
  updatePlacement,
  upsertBlockLocale,
  type BlockUsage,
  type LessonBlockRow,
  type LessonBlockScope,
  type TBlockVersionPage,
  type TBlockVersionCursor
} from '@cio/db/queries/block';
import { createAssetUsage, deleteAssetUsagesByTargetSlots, getAssetById } from '@cio/db/queries/assets';
import { touchCourseUpdatedAt } from '@cio/db/queries/course';
import { sanitizeOptionalHtml } from '../../utils/sanitize-html';
import { recordBlockLocaleVersion } from './block-version';
import { enrichBlocksMedia, loadLessonBlocks, toLessonBlock, type LessonBlock } from './block-view';
import { positionForAnchor } from './positions';

const LESSON_MEDIA_SLOTS = ['lesson_video', 'lesson_document'] as const;
const DEFAULT_LOCALE: TLocale = 'en';

interface BlockActor {
  actorProfileId?: string | null;
}

async function requireLessonScope(lessonId: string, dbClient: DbOrTxClient): Promise<LessonBlockScope> {
  const scope = await getLessonBlockScope(lessonId, dbClient);
  if (!scope) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  return scope;
}

async function requireLessonBlockRow(
  lessonId: string,
  blockId: string,
  dbClient: DbOrTxClient
): Promise<LessonBlockRow> {
  const row = await getLessonBlockRow(lessonId, blockId, dbClient);
  if (!row) {
    throw new AppError('Block not found in this lesson', ErrorCodes.BLOCK_NOT_FOUND, 404);
  }

  return row;
}

async function requirePlacementInLesson(
  lessonId: string,
  placementId: string,
  dbClient: DbOrTxClient
): Promise<LessonBlockRow> {
  const row = await getPlacementWithBlock(placementId, dbClient);
  if (!row || row.placement.lessonId !== lessonId) {
    throw new AppError('Block placement not found in this lesson', ErrorCodes.BLOCK_PLACEMENT_NOT_FOUND, 404);
  }

  return row;
}

function validatedBlockData(type: TBlockType, data: unknown): Record<string, unknown> {
  const parsed = parseBlockData(type, data);
  if (!parsed) {
    throw new AppError(`Invalid data for a ${type} block`, ErrorCodes.BLOCK_INVALID_DATA, 400);
  }

  return parsed as Record<string, unknown>;
}

async function assertAssetsBelongToOrganization(
  type: TBlockType,
  data: Record<string, unknown>,
  organizationId: string
): Promise<void> {
  if (type !== 'video' && type !== 'document') return;

  const assetId = data.assetId;
  if (typeof assetId !== 'string') return;

  const asset = await getAssetById(assetId, organizationId);
  if (!asset) {
    throw new AppError('Asset not found', ErrorCodes.BLOCK_INVALID_DATA, 400);
  }
}

/**
 * Rewrites the lesson's media usage rows from its current video and document blocks,
 * so the media library always reflects what each lesson actually plays.
 */
export async function syncLessonAssetUsages(
  lessonId: string,
  organizationId: string,
  actorProfileId: string | null,
  dbClient: DbOrTxClient
): Promise<void> {
  const rows = await listLessonBlockRows(lessonId, dbClient);
  await touchLessonsUpdatedAt([lessonId], dbClient);
  await deleteAssetUsagesByTargetSlots('lesson', lessonId, [...LESSON_MEDIA_SLOTS], dbClient);

  const seen = new Set<string>();
  for (const [position, row] of rows.entries()) {
    const slotType =
      row.block.type === 'video' ? 'lesson_video' : row.block.type === 'document' ? 'lesson_document' : null;
    const assetId = row.block.data.assetId;
    if (!slotType || typeof assetId !== 'string') continue;

    const usageKey = `${slotType}:${assetId}`;
    if (seen.has(usageKey)) continue;
    seen.add(usageKey);

    await createAssetUsage(
      {
        organizationId,
        assetId,
        targetType: 'lesson',
        targetId: lessonId,
        slotType,
        slotKey: null,
        position,
        createdByProfileId: actorProfileId
      },
      dbClient
    );
  }
}

async function syncUsagesForBlockLessons(
  blockId: string,
  organizationId: string,
  actorProfileId: string | null,
  dbClient: DbOrTxClient
) {
  const lessonIds = await listLessonIdsForBlock(blockId, dbClient);
  for (const lessonId of lessonIds) {
    await syncLessonAssetUsages(lessonId, organizationId, actorProfileId, dbClient);
  }
}

async function hydrateSingleBlock(placement: TBlockPlacement, block: TBlock): Promise<LessonBlock> {
  const [locales, counts] = await Promise.all([listBlockLocales([block.id]), getPlacementCountsByBlockIds([block.id])]);
  const contents: LessonBlock['contents'] = {};
  for (const locale of locales) {
    contents[locale.locale] = locale.content;
  }

  const [enriched] = await enrichBlocksMedia([toLessonBlock(placement, block, contents, counts.get(block.id) ?? 1)]);

  return enriched;
}

async function saveNoteContent(
  blockId: string,
  locale: TLocale,
  content: string | null,
  options: { authorId: string | null; intent?: TLessonVersionIntent; label?: string | null },
  dbClient: DbOrTxClient
): Promise<TBlockLocale> {
  const saved = await upsertBlockLocale({ blockId, locale, content }, dbClient);

  await recordBlockLocaleVersion({
    blockLocaleId: saved.id,
    content: saved.content,
    authorId: options.authorId,
    intent: options.intent ?? 'auto',
    label: options.label ?? null,
    dbClient
  });

  return saved;
}

/**
 * Lists a lesson's blocks in display order with media URLs resolved.
 */
export async function getLessonBlocks(lessonId: string): Promise<LessonBlock[]> {
  try {
    const blocks = await loadLessonBlocks(lessonId);

    return await enrichBlocksMedia(blocks);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch lesson blocks',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates a block and places it in the lesson, at the end unless an anchor is given.
 * @throws AppError for an invalid payload, an unknown anchor or a missing lesson.
 */
export async function createLessonBlock(
  lessonId: string,
  input: TBlockCreate,
  options: BlockActor = {}
): Promise<LessonBlock> {
  const actorProfileId = options.actorProfileId ?? null;
  const data = validatedBlockData(input.type, input.data);

  const created = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    await assertAssetsBelongToOrganization(input.type, data, scope.organizationId);
    await lockLessonBlockPositions(lessonId, tx);

    const ordered = await getPlacementPositions(lessonId, tx);
    const position = positionForAnchor(ordered, input);
    const block = await createBlock(
      { organizationId: scope.organizationId, type: input.type, data, createdBy: actorProfileId },
      tx
    );

    if (input.type === 'note') {
      const content = sanitizeOptionalHtml(input.content) ?? '';
      await saveNoteContent(block.id, input.locale ?? DEFAULT_LOCALE, content, { authorId: actorProfileId }, tx);
    }

    const placement = await createPlacement(
      {
        lessonId,
        blockId: block.id,
        position,
        required: input.required ?? false,
        watchThreshold: input.watchThreshold ?? null
      },
      tx
    );

    await syncLessonAssetUsages(lessonId, scope.organizationId, actorProfileId, tx);

    return { placement, block, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(created.courseId);

  return hydrateSingleBlock(created.placement, created.block);
}

/**
 * Places an existing organization block in this lesson; edits to it show up in every lesson that uses it.
 */
export async function attachLessonBlock(
  lessonId: string,
  input: TBlockAttach,
  options: BlockActor = {}
): Promise<LessonBlock> {
  const actorProfileId = options.actorProfileId ?? null;

  const attached = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const block = await getBlockById(input.blockId, tx);
    if (!block || block.organizationId !== scope.organizationId) {
      throw new AppError('Block not found', ErrorCodes.BLOCK_NOT_FOUND, 404);
    }

    if (await getLessonBlockRow(lessonId, block.id, tx)) {
      throw new AppError('Block is already in this lesson', ErrorCodes.CONFLICT, 409);
    }

    await lockLessonBlockPositions(lessonId, tx);

    const ordered = await getPlacementPositions(lessonId, tx);
    const placement = await createPlacement(
      {
        lessonId,
        blockId: block.id,
        position: positionForAnchor(ordered, input),
        required: input.required ?? false,
        watchThreshold: input.watchThreshold ?? null
      },
      tx
    );

    await syncLessonAssetUsages(lessonId, scope.organizationId, actorProfileId, tx);

    return { placement, block, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(attached.courseId);

  return hydrateSingleBlock(attached.placement, attached.block);
}

/**
 * Replaces a block's data when `expectedVersion` is current.
 * @throws AppError 409 BLOCK_VERSION_CONFLICT when someone else saved first.
 */
export async function updateLessonBlock(
  lessonId: string,
  blockId: string,
  input: { data: Record<string, unknown>; expectedVersion: number },
  options: BlockActor = {}
): Promise<LessonBlock> {
  const actorProfileId = options.actorProfileId ?? null;

  const updated = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const row = await requireLessonBlockRow(lessonId, blockId, tx);
    const type = row.block.type as TBlockType;
    const data = validatedBlockData(type, input.data);
    await assertAssetsBelongToOrganization(type, data, scope.organizationId);

    const block = await updateBlockDataIfVersion(blockId, data, input.expectedVersion, tx);
    if (!block) {
      throw new AppError('This block was changed by someone else', ErrorCodes.BLOCK_VERSION_CONFLICT, 409);
    }

    await syncUsagesForBlockLessons(blockId, scope.organizationId, actorProfileId, tx);

    return { placement: row.placement, block, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(updated.courseId);

  return hydrateSingleBlock(updated.placement, updated.block);
}

/**
 * Saves a note block's content for one locale and records a version snapshot.
 * @throws AppError 409 BLOCK_VERSION_CONFLICT when `expectedVersion` is stale, 400 for non-note blocks.
 */
export async function updateLessonBlockLocale(
  lessonId: string,
  blockId: string,
  locale: TLocale,
  input: {
    content: string;
    expectedVersion: number;
    versionIntent?: TLessonVersionIntent;
    versionLabel?: string | null;
  },
  options: BlockActor = {}
): Promise<LessonBlock> {
  const updated = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const row = await requireLessonBlockRow(lessonId, blockId, tx);
    if (row.block.type !== 'note') {
      throw new AppError('Only note blocks have localized content', ErrorCodes.BLOCK_INVALID_DATA, 400);
    }

    const block = await bumpBlockVersionIfVersion(blockId, input.expectedVersion, tx);
    if (!block) {
      throw new AppError('This block was changed by someone else', ErrorCodes.BLOCK_VERSION_CONFLICT, 409);
    }

    await saveNoteContent(
      blockId,
      locale,
      sanitizeOptionalHtml(input.content) ?? '',
      {
        authorId: options.actorProfileId ?? null,
        intent: input.versionIntent,
        label: input.versionLabel
      },
      tx
    );
    await touchLessonsUpdatedAt(await listLessonIdsForBlock(blockId, tx), tx);

    return { placement: row.placement, block, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(updated.courseId);

  return hydrateSingleBlock(updated.placement, updated.block);
}

/**
 * Updates per-lesson settings (required, watch threshold) of one placement.
 */
export async function updateLessonPlacement(
  lessonId: string,
  placementId: string,
  input: TPlacementUpdate
): Promise<LessonBlock> {
  const updated = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const row = await requirePlacementInLesson(lessonId, placementId, tx);
    const placement = await updatePlacement(
      placementId,
      {
        ...(input.required !== undefined ? { required: input.required } : {}),
        ...(input.watchThreshold !== undefined ? { watchThreshold: input.watchThreshold } : {})
      },
      tx
    );
    if (!placement) {
      throw new AppError('Block placement not found', ErrorCodes.BLOCK_PLACEMENT_NOT_FOUND, 404);
    }
    await touchLessonsUpdatedAt([lessonId], tx);

    return { placement, block: row.block, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(updated.courseId);

  return hydrateSingleBlock(updated.placement, updated.block);
}

/**
 * Moves a placement next to another one in the same lesson.
 */
export async function moveLessonPlacement(
  lessonId: string,
  placementId: string,
  anchor: TPlacementMove
): Promise<LessonBlock> {
  const moved = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const row = await requirePlacementInLesson(lessonId, placementId, tx);
    if (anchor.beforePlacementId === placementId || anchor.afterPlacementId === placementId) {
      throw new AppError('A block cannot be moved relative to itself', ErrorCodes.VALIDATION_ERROR, 400);
    }

    await lockLessonBlockPositions(lessonId, tx);

    const ordered = (await getPlacementPositions(lessonId, tx)).filter((entry) => entry.id !== placementId);
    const placement = await updatePlacement(placementId, { position: positionForAnchor(ordered, anchor) }, tx);
    if (!placement) {
      throw new AppError('Block placement not found', ErrorCodes.BLOCK_PLACEMENT_NOT_FOUND, 404);
    }

    await syncLessonAssetUsages(lessonId, scope.organizationId, null, tx);

    return { placement, block: row.block, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(moved.courseId);

  return hydrateSingleBlock(moved.placement, moved.block);
}

/**
 * Removes a placement from the lesson. The block itself is deleted only when no lesson uses it any more.
 * @returns whether the block row was deleted as an orphan.
 */
export async function removeLessonPlacement(
  lessonId: string,
  placementId: string,
  options: BlockActor = {}
): Promise<{ blockId: string; blockDeleted: boolean }> {
  const removed = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const row = await requirePlacementInLesson(lessonId, placementId, tx);

    await deletePlacements([placementId], tx);
    const deletedBlocks = await deleteBlocksWithoutPlacements([row.block.id], tx);
    await syncLessonAssetUsages(lessonId, scope.organizationId, options.actorProfileId ?? null, tx);

    return { blockId: row.block.id, blockDeleted: deletedBlocks.length > 0, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(removed.courseId);

  return { blockId: removed.blockId, blockDeleted: removed.blockDeleted };
}

/**
 * Copies a block. With `replacePlacementId` the copy takes over that placement, detaching this lesson
 * from the shared block; otherwise the copy is placed right after the original.
 */
export async function duplicateLessonBlock(
  lessonId: string,
  blockId: string,
  input: TBlockDuplicate,
  options: BlockActor = {}
): Promise<LessonBlock> {
  const actorProfileId = options.actorProfileId ?? null;

  const duplicated = await db.transaction(async (tx) => {
    const scope = await requireLessonScope(lessonId, tx);
    const row = await requireLessonBlockRow(lessonId, blockId, tx);
    if (input.replacePlacementId && input.replacePlacementId !== row.placement.id) {
      throw new AppError('Placement does not use this block', ErrorCodes.BLOCK_PLACEMENT_NOT_FOUND, 404);
    }

    const copy = await createBlock(
      {
        organizationId: scope.organizationId,
        type: row.block.type,
        schemaVersion: row.block.schemaVersion,
        data: row.block.data,
        createdBy: actorProfileId
      },
      tx
    );
    await copyBlockLocales(blockId, copy.id, tx);

    let placement: TBlockPlacement;
    if (input.replacePlacementId) {
      const repointed = await repointPlacement(input.replacePlacementId, copy.id, tx);
      if (!repointed) {
        throw new AppError('Block placement not found', ErrorCodes.BLOCK_PLACEMENT_NOT_FOUND, 404);
      }
      placement = repointed;
    } else {
      await lockLessonBlockPositions(lessonId, tx);
      const ordered = await getPlacementPositions(lessonId, tx);
      placement = await createPlacement(
        {
          lessonId,
          blockId: copy.id,
          position: positionForAnchor(ordered, { afterPlacementId: row.placement.id }),
          required: row.placement.required,
          watchThreshold: row.placement.watchThreshold
        },
        tx
      );
    }

    await deleteBlocksWithoutPlacements([blockId], tx);
    await syncLessonAssetUsages(lessonId, scope.organizationId, actorProfileId, tx);

    return { placement, block: copy, courseId: scope.courseId };
  });

  await touchCourseUpdatedAt(duplicated.courseId);

  return hydrateSingleBlock(duplicated.placement, duplicated.block);
}

export interface BlockLibraryItem {
  id: string;
  type: TBlockType;
  data: Record<string, unknown>;
  contents: LessonBlock['contents'];
  version: number;
  usageCount: number;
  updatedAt: string;
}

/**
 * Lists the organization's blocks for the reuse picker, newest first.
 */
export async function listBlockLibrary(
  organizationId: string,
  query: TBlockLibraryQuery
): Promise<{ items: BlockLibraryItem[]; total: number }> {
  const { items, total } = await listOrganizationBlocks(organizationId, {
    type: query.type,
    search: query.q,
    page: query.page,
    limit: query.limit
  });

  const noteIds = items.filter((item) => item.block.type === 'note').map((item) => item.block.id);
  const locales = await listBlockLocales(noteIds);
  const contentsByBlock = new Map<string, LessonBlock['contents']>();
  for (const locale of locales) {
    const contents = contentsByBlock.get(locale.blockId) ?? {};
    contents[locale.locale] = locale.content;
    contentsByBlock.set(locale.blockId, contents);
  }

  return {
    items: items.map(({ block, usageCount }) => ({
      id: block.id,
      type: block.type as TBlockType,
      data: block.data,
      contents: contentsByBlock.get(block.id) ?? {},
      version: block.version,
      usageCount,
      updatedAt: block.updatedAt
    })),
    total
  };
}

/**
 * Lists every lesson a block appears in.
 * @throws AppError 404 when the block is not in the organization.
 */
export async function getBlockUsageList(organizationId: string, blockId: string): Promise<BlockUsage[]> {
  const block = await getBlockById(blockId);
  if (!block || block.organizationId !== organizationId) {
    throw new AppError('Block not found', ErrorCodes.BLOCK_NOT_FOUND, 404);
  }

  return getBlockUsages(blockId);
}

/**
 * Parses a serialized `<iso timestamp>|<id>` history cursor.
 * @returns undefined for malformed input, so a hand-edited URL restarts at the newest page.
 */
export function parseBlockVersionCursor(cursor?: string): TBlockVersionCursor | undefined {
  if (!cursor) return undefined;

  const separatorIndex = cursor.lastIndexOf('|');
  if (separatorIndex <= 0) return undefined;

  const timestamp = cursor.slice(0, separatorIndex);
  const id = Number(cursor.slice(separatorIndex + 1));
  if (!timestamp || !Number.isInteger(id) || Number.isNaN(new Date(timestamp).getTime())) return undefined;

  return { timestamp, id };
}

/**
 * Pages through a note block's version history for one locale.
 */
export async function getLessonBlockHistory(
  lessonId: string,
  blockId: string,
  locale: TLocale,
  options: { limit: number; cursor?: string }
): Promise<TBlockVersionPage> {
  await requireLessonBlockRow(lessonId, blockId, db);

  return getBlockVersionHistory(blockId, locale, options.limit, parseBlockVersionCursor(options.cursor));
}
