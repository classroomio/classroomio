import type * as z from 'zod';

export type TBlockMediaKind = 'video' | 'document';

/**
 * What the server and the dashboard share about one block type. Every type is one of these,
 * registered in `registry.ts`.
 */
export interface BlockDefinition<TKey extends string, TSchema extends z.ZodType<Record<string, unknown>>> {
  key: TKey;
  /** Validates `block.data` on every write. */
  dataSchema: TSchema;
  /** Whether the block keeps per-locale text in `block_locale` (a note's HTML). */
  localizedContent: boolean;
  /** Media the block plays or links, so its asset is checked, tracked and signed. */
  media: TBlockMediaKind | null;
  /** The data an anonymous public-course viewer receives; null keeps the type off public pages. */
  toPublicData: ((data: z.infer<TSchema>) => Record<string, unknown>) | null;
  /** Data fields the AI assistant may change on an existing block. Fields that pick the media itself stay off this list. */
  agentEditableFields: readonly (keyof z.infer<TSchema> & string)[];
}

export function defineBlock<const TKey extends string, TSchema extends z.ZodType<Record<string, unknown>>>(
  definition: BlockDefinition<TKey, TSchema>
): BlockDefinition<TKey, TSchema> {
  return definition;
}
