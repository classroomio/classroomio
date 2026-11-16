import type * as z from 'zod';

import type { TBlockCommentAnchorKind } from './definition';
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
 * What a team comment on a block of this type pins to, or null for an unknown type.
 */
export function getBlockCommentAnchorKind(type: string): TBlockCommentAnchorKind | null {
  if (!isBlockType(type)) return null;

  return BLOCK_DEFINITIONS[type].commentAnchor.kind;
}

/**
 * Identifies the media a block shows, so comments pinned to an earlier media can be flagged.
 * Rows backfilled from legacy columns were never validated, so a throwing projection reads as null.
 * @returns null when the type has no media identity or the data cannot be read.
 */
export function getBlockCommentFingerprint(type: string, data: Record<string, unknown>): string | null {
  if (!isBlockType(type)) return null;

  const fingerprint = BLOCK_DEFINITIONS[type].commentAnchor.fingerprint as ((value: unknown) => string | null) | null;
  if (!fingerprint) return null;

  try {
    const value = fingerprint(data);

    return typeof value === 'string' && value ? value : null;
  } catch {
    return null;
  }
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
