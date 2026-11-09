import type * as z from 'zod';

import { documentBlock } from './definitions/document';
import { imageBlock } from './definitions/image';
import { noteBlock } from './definitions/note';
import { slidesBlock } from './definitions/slides';
import { videoBlock } from './definitions/video';

export const BLOCK_DEFINITIONS = {
  note: noteBlock,
  video: videoBlock,
  slides: slidesBlock,
  document: documentBlock,
  image: imageBlock
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
