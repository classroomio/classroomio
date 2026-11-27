import * as z from 'zod';

/** The id of one item inside a block, such as a card or an option. */
export const ZBlockItemId = z
  .string()
  .min(1)
  .max(64)
  .describe('Short id, unique within this block, such as "a" or "step-1". Keep the ids you read when editing.');

/** An image URL the assistant writes. Stored images may also be http, so the assistant keeps those with `keepImage`. */
export const ZAgentImageUrl = z
  .url({ protocol: /^https$/ })
  .describe('https URL of the image, exactly as the teacher or a tool gave it.');

export const ZAgentKeepImage = z
  .boolean()
  .optional()
  .describe('True when the item already shows an image you cannot read. Send it back as true to keep that image.');

export function isAgentImageUrl(url: string): boolean {
  return ZAgentImageUrl.safeParse(url).success;
}

/**
 * The assistant's view of a stored image URL: https URLs as they are, any other URL as `keepImage`.
 */
export function toAgentImageUrl(url: string | undefined): { imageUrl?: string; keepImage?: boolean } {
  if (!url) return {};

  return isAgentImageUrl(url) ? { imageUrl: url } : { keepImage: true };
}

/**
 * The stored image URL for the assistant's input: a URL it sent, or the previous one when it sent `keepImage`.
 */
export function fromAgentImageUrl(
  input: { imageUrl?: string; keepImage?: boolean },
  previousUrl: string | undefined
): { imageUrl?: string } {
  if (input.imageUrl) return { imageUrl: input.imageUrl };
  if (input.keepImage && previousUrl) return { imageUrl: previousUrl };

  return {};
}

export type TBlockMediaKind = 'video' | 'document' | 'html';

/** One media item a block plays or links: the block's own data, or media kept inside it, such as a tab's video. */
export interface TBlockMediaItem {
  media: TBlockMediaKind;
  data: Record<string, unknown>;
}

/**
 * How the AI assistant writes and reads a block whose whole data it authors, such as a chart or flashcards.
 */
export interface BlockAgentAuthoring<TData, TInputSchema extends z.ZodType<Record<string, unknown>>> {
  /** When the assistant should pick this block, for its tool description. */
  purpose: string;
  /** What the assistant sends to create the block or replace its data. */
  inputSchema: TInputSchema;
  /** The block's data as the assistant reads it, in the shape it sends back to edit it. */
  toInput: (data: TData) => Record<string, unknown>;
  /** Turns the assistant's input into block data, keeping from `previous` what the assistant cannot write. */
  fromInput: (input: z.infer<TInputSchema>, previous: TData | null) => TData;
}

/**
 * What the server and the dashboard share about one block type. Every type is one of these,
 * registered in `registry.ts`.
 */
export interface BlockDefinition<
  TKey extends string,
  TSchema extends z.ZodType<Record<string, unknown>>,
  TAgentInputSchema extends z.ZodType<Record<string, unknown>> = z.ZodType<Record<string, unknown>>
> {
  key: TKey;
  /** Validates `block.data` on every write. */
  dataSchema: TSchema;
  /** Whether the block keeps per-locale text in `block_locale` (a note's HTML). */
  localizedContent: boolean;
  /** Media the block plays or links, so its asset is checked, tracked and signed. */
  media: TBlockMediaKind | null;
  /** The data an anonymous public-course viewer receives; null keeps the type off public pages. */
  toPublicData: ((data: z.infer<TSchema>) => Record<string, unknown>) | null;
  /**
   * Media kept inside the block's data (a tab's video), so its asset is checked, tracked and signed like a
   * media block's. `read` lists the items in a fixed order; `write` puts back items of the same order.
   * Both receive the data as it is (stored, signed or public), not re-validated.
   */
  embeddedMedia?: {
    read: (data: z.infer<TSchema>) => TBlockMediaItem[];
    write: (data: z.infer<TSchema>, items: Record<string, unknown>[]) => z.infer<TSchema>;
  };
  /** Data fields the AI assistant may change on an existing block. Fields that pick the media itself stay off this list. */
  agentEditableFields: readonly (keyof z.infer<TSchema> & string)[];
  /** Lets the AI assistant create the block and rewrite its data; types without it stay off its tools. */
  agent?: BlockAgentAuthoring<z.infer<TSchema>, TAgentInputSchema>;
}

export function defineBlock<
  const TKey extends string,
  TSchema extends z.ZodType<Record<string, unknown>>,
  TAgentInputSchema extends z.ZodType<Record<string, unknown>> = z.ZodType<Record<string, unknown>>
>(definition: BlockDefinition<TKey, TSchema, TAgentInputSchema>): BlockDefinition<TKey, TSchema, TAgentInputSchema> {
  return definition;
}
