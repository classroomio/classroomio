import type { TLocale } from '@cio/db/types';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import { getFileUploadTypeKeyForMimeType } from '@cio/utils/file-upload';
import { parseSlideEmbed } from '@cio/utils/functions/slide-embed';
import { BLOCK_DEFINITIONS, blockHasLocalizedContent, isBlockType, type TBlockType } from '@cio/utils/validation/block';

import {
  attachLessonBlock,
  createLessonBlock,
  duplicateLessonBlock,
  listBlockLibrary,
  moveLessonPlacement,
  removeLessonPlacement,
  updateLessonBlock,
  updateLessonBlockLocale,
  updateLessonPlacement
} from '../block/block';
import { getAssetService } from '../assets/assets';
import { loadLessonBlocks, type LessonBlock } from '../block/block-view';

export interface AgentLessonBlock {
  blockId: string;
  type: string;
  content?: string | null;
  label?: string;
  sharedWithOtherLessons?: number;
}

export interface AgentLibraryBlock {
  blockId: string;
  type: string;
  content?: string | null;
  label?: string;
  usedInLessons: number;
}

interface BlockAnchor {
  afterBlockId?: string;
  beforeBlockId?: string;
}

interface AgentTextWrite {
  lessonId: string;
  locale: TLocale;
  content: string;
  actorProfileId?: string;
  changeSetId?: string;
}

const BLOCK_LABEL_FIELDS = ['fileName', 'name', 'title', 'alt'] as const;
const NOTE_BLOCK_TYPE = 'note';
const SLIDES_BLOCK_TYPE = 'slides';
const IMAGE_BLOCK_TYPE = 'image';
const DOCUMENT_BLOCK_TYPE = 'document';
const FALLBACK_DOCUMENT_TYPE = 'file';
const LIBRARY_PAGE_SIZE = 20;

function readBlockLabel(data: Record<string, unknown>): string | null {
  for (const field of BLOCK_LABEL_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }

  const metadata = data.metadata as Record<string, unknown> | undefined;
  const metadataTitle = metadata?.title;

  return typeof metadataTitle === 'string' && metadataTitle.trim().length > 0 ? metadataTitle.trim() : null;
}

function wrapUntrustedLabel(label: string): string {
  return `<external_untrusted_document src="lesson-block-label">${label}</external_untrusted_document>`;
}

function toAgentLessonBlock(block: LessonBlock, locale: TLocale): AgentLessonBlock {
  const sharedWithOtherLessons = block.usageCount > 1 ? block.usageCount - 1 : undefined;

  if (blockHasLocalizedContent(block.type)) {
    return { blockId: block.id, type: block.type, content: block.contents[locale] ?? null, sharedWithOtherLessons };
  }

  const label = readBlockLabel(block.data);

  return {
    blockId: block.id,
    type: block.type,
    ...(label ? { label: wrapUntrustedLabel(label) } : {}),
    sharedWithOtherLessons
  };
}

function findLessonBlock(blocks: LessonBlock[], blockId: string): LessonBlock {
  const block = blocks.find((candidate) => candidate.id === blockId);
  if (!block) {
    throw new AppError(
      `Block ${blockId} is not in this lesson. Call get_lesson_content for the current block ids.`,
      ErrorCodes.BLOCK_NOT_FOUND,
      404
    );
  }

  return block;
}

function findTextBlock(blocks: LessonBlock[], blockId: string): LessonBlock {
  const block = findLessonBlock(blocks, blockId);
  if (!blockHasLocalizedContent(block.type)) {
    throw new AppError(
      `Block ${blockId} is a ${block.type} block. Only text (note) blocks can be written or removed with these tools.`,
      ErrorCodes.BLOCK_INVALID_DATA,
      400
    );
  }

  return block;
}

function resolveAnchor(blocks: LessonBlock[], anchor: BlockAnchor) {
  const afterPlacementId = anchor.afterBlockId ? findLessonBlock(blocks, anchor.afterBlockId).placementId : undefined;
  const beforePlacementId = anchor.beforeBlockId
    ? findLessonBlock(blocks, anchor.beforeBlockId).placementId
    : undefined;

  return { afterPlacementId, beforePlacementId };
}

function assertNotShared(block: LessonBlock): void {
  if (block.usageCount <= 1) return;

  throw new AppError(
    `Block ${block.id} is shared with ${block.usageCount - 1} other lesson(s), so editing it would change those lessons too. Ask the teacher whether to detach it (detach_lesson_block) and edit the lesson's own copy, or add a new block instead.`,
    ErrorCodes.CONFLICT,
    409
  );
}

function collapseHtmlWhitespace(html: string): string {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

function isSameLessonHtml(current: string | null | undefined, next: string): boolean {
  if (current == null) return false;

  return collapseHtmlWhitespace(current) === collapseHtmlWhitespace(next);
}

function pickTargetTextBlock(blocks: LessonBlock[]): LessonBlock | null {
  const textBlocks = blocks.filter((block) => blockHasLocalizedContent(block.type));
  if (textBlocks.length > 1) {
    throw new AppError(
      `This lesson has ${textBlocks.length} text blocks. Call get_lesson_content and pass the blockId of the one to write.`,
      ErrorCodes.VALIDATION_ERROR,
      409
    );
  }

  return textBlocks[0] ?? null;
}

/**
 * Lists a lesson's blocks in display order as the agent sees them: text blocks carry their HTML
 * for `locale`, media blocks carry an untrusted display label.
 */
export async function listAgentLessonBlocks(lessonId: string, locale: TLocale): Promise<AgentLessonBlock[]> {
  const blocks = await loadLessonBlocks(lessonId);

  return blocks.map((block) => toAgentLessonBlock(block, locale));
}

/**
 * Writes one text block's HTML for a locale. Without `blockId` it writes the lesson's only text
 * block, or creates one when there is none.
 * @throws AppError when the block is not a text block in this lesson, is shared, or the target is ambiguous.
 */
export async function writeAgentLessonText(
  input: AgentTextWrite & { blockId?: string }
): Promise<{ blockId: string; created: boolean; changed: boolean }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const target = input.blockId ? findTextBlock(blocks, input.blockId) : pickTargetTextBlock(blocks);

  if (!target) {
    const created = await createLessonBlock(
      input.lessonId,
      { type: NOTE_BLOCK_TYPE, data: {}, content: input.content, locale: input.locale },
      { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
    );

    return { blockId: created.id, created: true, changed: true };
  }

  if (isSameLessonHtml(target.contents[input.locale], input.content)) {
    return { blockId: target.id, created: false, changed: false };
  }

  assertNotShared(target);
  await updateLessonBlockLocale(
    input.lessonId,
    target.id,
    input.locale,
    { content: input.content, expectedVersion: target.version },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: target.id, created: false, changed: true };
}

/**
 * Inserts a new text block next to an existing block, or at the end of the lesson without an anchor.
 */
export async function addAgentLessonTextBlock(input: AgentTextWrite & BlockAnchor): Promise<{ blockId: string }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const anchor = resolveAnchor(blocks, input);

  const created = await createLessonBlock(
    input.lessonId,
    { type: NOTE_BLOCK_TYPE, data: {}, content: input.content, locale: input.locale, ...anchor },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: created.id };
}

/**
 * Removes a text block from the lesson. A block shared with other lessons stays in those lessons.
 */
export async function removeAgentLessonTextBlock(input: {
  lessonId: string;
  blockId: string;
  actorProfileId?: string;
  changeSetId?: string;
}): Promise<void> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const target = findTextBlock(blocks, input.blockId);

  await removeLessonPlacement(input.lessonId, target.placementId, {
    actorProfileId: input.actorProfileId,
    source: 'assistant',
    changeSetId: input.changeSetId ?? null
  });
}

/**
 * Moves any block, media included, next to another block in the same lesson. Only this lesson's
 * placement moves, so lessons sharing the block keep their own order.
 * @throws AppError when either block is not in this lesson or the block is anchored to itself.
 */
export async function moveAgentLessonBlock(
  input: { lessonId: string; blockId: string; actorProfileId?: string; changeSetId?: string } & BlockAnchor
): Promise<void> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const target = findLessonBlock(blocks, input.blockId);
  const anchor = resolveAnchor(blocks, input);

  await moveLessonPlacement(input.lessonId, target.placementId, anchor, {
    actorProfileId: input.actorProfileId,
    source: 'assistant',
    changeSetId: input.changeSetId ?? null
  });
}

function editableFieldsOf(type: string): readonly string[] {
  return isBlockType(type) ? BLOCK_DEFINITIONS[type].agentEditableFields : [];
}

function playsVideo(type: string): boolean {
  return isBlockType(type) && BLOCK_DEFINITIONS[type].media === 'video';
}

/**
 * Embeds a slide deck from a share link or iframe code of a supported platform.
 * @throws AppError 400 when the link is not a supported slide platform.
 */
export async function addAgentSlidesBlock(
  input: { lessonId: string; url: string; actorProfileId?: string; changeSetId?: string } & BlockAnchor
): Promise<{ blockId: string; platform: string }> {
  const parsed = parseSlideEmbed(input.url);
  if (!parsed.ok) {
    throw new AppError(
      `That link cannot be embedded as slides (${parsed.reason}). Use a share or embed link from a supported slide platform such as Google Slides, Canva or PowerPoint Online.`,
      ErrorCodes.BLOCK_INVALID_DATA,
      400
    );
  }

  const blocks = await loadLessonBlocks(input.lessonId);
  const anchor = resolveAnchor(blocks, input);
  const created = await createLessonBlock(
    input.lessonId,
    { type: SLIDES_BLOCK_TYPE, data: { src: parsed.src, platform: parsed.platform }, ...anchor },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: created.id, platform: parsed.platform };
}

/**
 * Adds an image block that shows an image from a URL the teacher supplied.
 */
export async function addAgentImageBlock(
  input: {
    lessonId: string;
    url: string;
    alt?: string;
    fit?: 'cover' | 'contain';
    actorProfileId?: string;
    changeSetId?: string;
  } & BlockAnchor
): Promise<{ blockId: string }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const anchor = resolveAnchor(blocks, input);
  const data = {
    url: input.url,
    ...(input.alt ? { alt: input.alt } : {}),
    ...(input.fit ? { fit: input.fit } : {})
  };
  const created = await createLessonBlock(
    input.lessonId,
    { type: IMAGE_BLOCK_TYPE, data, ...anchor },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: created.id };
}

/**
 * Adds a document block for an asset the organization owns, the way the lesson editor's upload does.
 * The download link is signed from the storage key whenever the lesson is read.
 */
export async function addAgentDocumentBlock(
  input: {
    organizationId: string;
    lessonId: string;
    assetId: string;
    fileName: string;
    actorProfileId?: string;
    changeSetId?: string;
  } & BlockAnchor
): Promise<{ blockId: string }> {
  const asset = await getAssetService(input.organizationId, input.assetId);
  const documentType = asset.mimeType ? getFileUploadTypeKeyForMimeType(asset.mimeType) : null;
  const blocks = await loadLessonBlocks(input.lessonId);
  const anchor = resolveAnchor(blocks, input);
  const data = {
    type: documentType ?? FALLBACK_DOCUMENT_TYPE,
    name: asset.title ?? input.fileName,
    link: '',
    key: asset.storageKey ?? '',
    ...(asset.byteSize ? { size: asset.byteSize } : {}),
    assetId: asset.id
  };

  const created = await createLessonBlock(
    input.lessonId,
    { type: DOCUMENT_BLOCK_TYPE, data, ...anchor },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: created.id };
}

/**
 * Changes the agent-editable data fields of one block, as declared by its type's `agentEditableFields`.
 * @throws AppError when a field is not editable for that type or the block is shared.
 */
export async function updateAgentBlockSettings(input: {
  lessonId: string;
  blockId: string;
  changes: Record<string, unknown>;
  actorProfileId?: string;
  changeSetId?: string;
}): Promise<{ blockId: string; changedFields: string[] }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const target = findLessonBlock(blocks, input.blockId);
  const editableFields = editableFieldsOf(target.type);
  const changedFields = Object.keys(input.changes);
  const rejectedFields = changedFields.filter((field) => !editableFields.includes(field));

  if (editableFields.length === 0) {
    throw new AppError(`A ${target.type} block has no settings you can change.`, ErrorCodes.BLOCK_INVALID_DATA, 400);
  }
  if (rejectedFields.length > 0) {
    throw new AppError(
      `You cannot change ${rejectedFields.join(', ')} on a ${target.type} block. Editable fields: ${editableFields.join(', ')}.`,
      ErrorCodes.BLOCK_INVALID_DATA,
      400
    );
  }

  assertNotShared(target);
  const data = { ...target.data, ...input.changes };
  await updateLessonBlock(
    input.lessonId,
    target.id,
    { data, expectedVersion: target.version },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: target.id, changedFields };
}

/**
 * Sets whether students must complete a block, and for videos how much they must watch.
 * @throws AppError 400 when a watch threshold is set on a block that does not play video.
 */
export async function updateAgentBlockRequirements(input: {
  lessonId: string;
  blockId: string;
  required?: boolean;
  watchThreshold?: number | null;
  actorProfileId?: string;
  changeSetId?: string;
}): Promise<{ blockId: string; required: boolean; watchThreshold: number | null }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const target = findLessonBlock(blocks, input.blockId);

  if (input.watchThreshold !== undefined && input.watchThreshold !== null && !playsVideo(target.type)) {
    throw new AppError(
      `A watch threshold only applies to video blocks, not ${target.type} blocks.`,
      ErrorCodes.BLOCK_INVALID_DATA,
      400
    );
  }

  const updated = await updateLessonPlacement(
    input.lessonId,
    target.placementId,
    { required: input.required, watchThreshold: input.watchThreshold },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: updated.id, required: updated.required, watchThreshold: updated.watchThreshold };
}

/**
 * Gives this lesson its own copy of a shared block; the other lessons keep the original.
 * @throws AppError 400 when the block is not shared.
 */
export async function detachAgentLessonBlock(input: {
  lessonId: string;
  blockId: string;
  actorProfileId?: string;
  changeSetId?: string;
}): Promise<{ blockId: string; previousBlockId: string }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const target = findLessonBlock(blocks, input.blockId);
  if (target.usageCount <= 1) {
    throw new AppError(
      `Block ${target.id} is only used in this lesson, so there is nothing to detach.`,
      ErrorCodes.BLOCK_INVALID_DATA,
      400
    );
  }

  const copy = await duplicateLessonBlock(
    input.lessonId,
    target.id,
    { replacePlacementId: target.placementId },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: copy.id, previousBlockId: target.id };
}

/**
 * Searches the organization's reusable blocks. Text blocks carry HTML for `locale`; media blocks an untrusted label.
 */
export async function listAgentBlockLibrary(
  organizationId: string,
  query: { type?: TBlockType; search?: string; locale: TLocale }
): Promise<{ items: AgentLibraryBlock[]; total: number }> {
  const library = await listBlockLibrary(organizationId, {
    type: query.type,
    q: query.search,
    page: 1,
    limit: LIBRARY_PAGE_SIZE
  });

  const items = library.items.map((item): AgentLibraryBlock => {
    if (blockHasLocalizedContent(item.type)) {
      return {
        blockId: item.id,
        type: item.type,
        content: item.contents[query.locale] ?? null,
        usedInLessons: item.usageCount
      };
    }

    const label = readBlockLabel(item.data);

    return {
      blockId: item.id,
      type: item.type,
      ...(label ? { label: wrapUntrustedLabel(label) } : {}),
      usedInLessons: item.usageCount
    };
  });

  return { items, total: library.total };
}

/**
 * Places an existing organization block in a lesson. Later edits to it show in every lesson that uses it.
 */
export async function attachAgentLibraryBlock(
  input: { lessonId: string; blockId: string; actorProfileId?: string; changeSetId?: string } & BlockAnchor
): Promise<{ blockId: string }> {
  const blocks = await loadLessonBlocks(input.lessonId);
  const anchor = resolveAnchor(blocks, input);
  const attached = await attachLessonBlock(
    input.lessonId,
    { blockId: input.blockId, ...anchor },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );

  return { blockId: attached.id };
}

/**
 * Moves a block from one lesson to another. It is placed in the target lesson before it leaves the
 * source, so a failure part-way leaves the block in both lessons rather than in neither.
 */
export async function moveAgentBlockToLesson(
  input: {
    fromLessonId: string;
    toLessonId: string;
    blockId: string;
    actorProfileId?: string;
    changeSetId?: string;
  } & BlockAnchor
): Promise<{ blockId: string }> {
  if (input.fromLessonId === input.toLessonId) {
    throw new AppError('Use move_lesson_block to reorder inside one lesson.', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const [sourceBlocks, targetBlocks] = await Promise.all([
    loadLessonBlocks(input.fromLessonId),
    loadLessonBlocks(input.toLessonId)
  ]);
  const source = findLessonBlock(sourceBlocks, input.blockId);
  const anchor = resolveAnchor(targetBlocks, input);

  await attachLessonBlock(
    input.toLessonId,
    { blockId: source.id, ...anchor },
    { actorProfileId: input.actorProfileId, source: 'assistant', changeSetId: input.changeSetId ?? null }
  );
  await removeLessonPlacement(input.fromLessonId, source.placementId, {
    actorProfileId: input.actorProfileId,
    source: 'assistant',
    changeSetId: input.changeSetId ?? null
  });

  return { blockId: source.id };
}

/**
 * Renders a lesson's blocks for the system prompt, so the model sees block boundaries and ids
 * instead of one merged HTML document.
 * @returns null when the lesson has no blocks.
 */
export async function formatLessonBlocksForPrompt(lessonId: string, locale: TLocale): Promise<string | null> {
  const blocks = await listAgentLessonBlocks(lessonId, locale);
  if (blocks.length === 0) return null;

  return blocks
    .map((block) => {
      const shared = block.sharedWithOtherLessons ? ` sharedWithOtherLessons="${block.sharedWithOtherLessons}"` : '';
      if (block.content !== undefined) {
        return `<lesson_block blockId="${block.blockId}" type="${block.type}"${shared}>\n${block.content ?? ''}\n</lesson_block>`;
      }

      const label = block.label ? `\n${block.label}\n` : '';

      return `<lesson_block blockId="${block.blockId}" type="${block.type}"${shared}>${label}</lesson_block>`;
    })
    .join('\n');
}
