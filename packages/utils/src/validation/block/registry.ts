import type * as z from 'zod';

import type { BlockAgentAuthoring, TBlockMediaItem, TBlockMediaKind } from './definition';

import { chartBlock } from './definitions/chart';
import { documentBlock } from './definitions/document';
import { flashcardsBlock } from './definitions/flashcards';
import { imageBlock } from './definitions/image';
import { multipleChoiceBlock } from './definitions/multiple-choice';
import { noteBlock } from './definitions/note';
import { processBlock } from './definitions/process';
import { slidesBlock } from './definitions/slides';
import { tabsBlock } from './definitions/tabs';
import { videoBlock } from './definitions/video';

export const BLOCK_DEFINITIONS = {
  note: noteBlock,
  video: videoBlock,
  slides: slidesBlock,
  document: documentBlock,
  image: imageBlock,
  chart: chartBlock,
  flashcards: flashcardsBlock,
  tabs: tabsBlock,
  multiple_choice: multipleChoiceBlock,
  process: processBlock
} as const;

export type TBlockType = keyof typeof BLOCK_DEFINITIONS;

export type TBlockDataByType = {
  [K in TBlockType]: z.infer<(typeof BLOCK_DEFINITIONS)[K]['dataSchema']>;
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFINITIONS) as [TBlockType, ...TBlockType[]];

export function isBlockType(value: string): value is TBlockType {
  return Object.prototype.hasOwnProperty.call(BLOCK_DEFINITIONS, value);
}

export function getBlockDefinition<T extends TBlockType>(type: T): (typeof BLOCK_DEFINITIONS)[T] {
  return BLOCK_DEFINITIONS[type];
}

export type TAgentBlockAuthoring = BlockAgentAuthoring<Record<string, unknown>, z.ZodType<Record<string, unknown>>>;

/** The block types the AI assistant can create and rewrite whole, in registry order. */
export const AGENT_AUTHORED_BLOCK_TYPES = BLOCK_TYPES.filter((type) => 'agent' in BLOCK_DEFINITIONS[type]);

/**
 * How the AI assistant writes and reads blocks of `type`.
 * @returns null when the assistant cannot author that type.
 */
export function getBlockAgentAuthoring(type: string): TAgentBlockAuthoring | null {
  if (!isBlockType(type)) return null;

  const definition = BLOCK_DEFINITIONS[type] as { agent?: TAgentBlockAuthoring };

  return definition.agent ?? null;
}

export function blockHasLocalizedContent(type: string): boolean {
  return isBlockType(type) && BLOCK_DEFINITIONS[type].localizedContent;
}

/**
 * Validates `data` against the schema registered for `type`.
 * @returns the parsed data, or null when it is invalid.
 */
export function parseBlockData<T extends TBlockType>(type: T, data: unknown): TBlockDataByType[T] | null {
  const result = BLOCK_DEFINITIONS[type].dataSchema.safeParse(data);

  return result.success ? (result.data as TBlockDataByType[T]) : null;
}

/**
 * Every media item a block plays or links: its own data for a media type, plus media kept inside its
 * data, such as a tab's video. Data is read as it is (stored, signed or public), and a shape the reader
 * does not recognise yields no items instead of throwing.
 */
export function listBlockMedia(type: string, data: Record<string, unknown>): TBlockMediaItem[] {
  if (!isBlockType(type)) return [];

  const definition = BLOCK_DEFINITIONS[type] as {
    media: TBlockMediaKind | null;
    embeddedMedia?: { read: (value: unknown) => TBlockMediaItem[] };
  };
  if (definition.media) return [{ media: definition.media, data }];
  if (!definition.embeddedMedia) return [];

  try {
    return definition.embeddedMedia.read(data);
  } catch {
    return [];
  }
}

/**
 * Puts media items back into a block's data, in the order {@link listBlockMedia} listed them, e.g. after
 * signing their URLs.
 */
export function withBlockMedia(
  type: string,
  data: Record<string, unknown>,
  items: Record<string, unknown>[]
): Record<string, unknown> {
  if (!isBlockType(type) || items.length === 0) return data;

  const definition = BLOCK_DEFINITIONS[type] as {
    media: TBlockMediaKind | null;
    embeddedMedia?: { write: (value: unknown, media: Record<string, unknown>[]) => Record<string, unknown> };
  };
  if (definition.media) return items[0];
  if (!definition.embeddedMedia) return data;

  try {
    return definition.embeddedMedia.write(data, items);
  } catch {
    return data;
  }
}

/**
 * The asset a block references, when its type plays or links media.
 */
export function getBlockAssetId(type: string, data: Record<string, unknown>): string | null {
  if (!isBlockType(type) || !BLOCK_DEFINITIONS[type].media) return null;

  return typeof data.assetId === 'string' ? data.assetId : null;
}

/**
 * Projects stored block data for an anonymous public-course viewer. Rows backfilled from legacy
 * lesson columns were never validated, so the projection reads the stored data as it is.
 * @returns null when the type is not shown on public pages.
 */
export function toPublicBlockData(type: string, data: Record<string, unknown>): Record<string, unknown> | null {
  if (!isBlockType(type)) return null;

  const toPublicData = BLOCK_DEFINITIONS[type].toPublicData as ((value: unknown) => Record<string, unknown>) | null;

  return toPublicData ? toPublicData(data) : null;
}
