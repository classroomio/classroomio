import * as z from 'zod';

import { ZLessonVersionIntent } from '../lesson/language';
import { BLOCK_DEFINITIONS, BLOCK_TYPES, type TBlockType } from './registry';

export const BLOCK_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it'] as const;
export const ZBlockLocale = z.enum(BLOCK_LOCALES);
export type TBlockLocaleCode = z.infer<typeof ZBlockLocale>;

export const ZBlockType = z.enum(BLOCK_TYPES);

const ZPlacementAnchor = z.object({
  beforePlacementId: z.uuid().optional(),
  afterPlacementId: z.uuid().optional()
});

const hasSingleAnchor = (value: { beforePlacementId?: string; afterPlacementId?: string }) =>
  !(value.beforePlacementId && value.afterPlacementId);

const singleAnchorIssue = { message: 'Provide either beforePlacementId or afterPlacementId, not both' };

const ZPlacementSettings = z.object({
  required: z.boolean().optional(),
  watchThreshold: z.number().int().min(1).max(100).nullable().optional()
});

function blockCreateVariant<T extends TBlockType>(type: T) {
  return z.object({
    type: z.literal(type),
    data: BLOCK_DEFINITIONS[type].dataSchema as (typeof BLOCK_DEFINITIONS)[T]['dataSchema'],
    content: z.string().optional(),
    locale: ZBlockLocale.optional()
  });
}

type BlockCreateVariant = { [K in TBlockType]: ReturnType<typeof blockCreateVariant<K>> }[TBlockType];

const blockCreateVariants = BLOCK_TYPES.map((type) => blockCreateVariant(type)) as [
  BlockCreateVariant,
  ...BlockCreateVariant[]
];

export const ZBlockCreate = z
  .discriminatedUnion('type', blockCreateVariants)
  .and(ZPlacementAnchor)
  .and(ZPlacementSettings)
  .refine(hasSingleAnchor, singleAnchorIssue);
export type TBlockCreate = z.infer<typeof ZBlockCreate>;

export const ZBlockAttach = z
  .object({ blockId: z.uuid() })
  .and(ZPlacementAnchor)
  .and(ZPlacementSettings)
  .refine(hasSingleAnchor, singleAnchorIssue);
export type TBlockAttach = z.infer<typeof ZBlockAttach>;

export const ZBlockUpdate = z.object({
  data: z.record(z.string(), z.unknown()),
  expectedVersion: z.number().int().min(1)
});
export type TBlockUpdate = z.infer<typeof ZBlockUpdate>;

export const ZBlockLocaleUpdate = z.object({
  content: z.string(),
  expectedVersion: z.number().int().min(1),
  versionIntent: ZLessonVersionIntent.optional(),
  versionLabel: z.string().max(120).optional()
});
export type TBlockLocaleUpdate = z.infer<typeof ZBlockLocaleUpdate>;

export const ZPlacementUpdate = ZPlacementSettings;
export type TPlacementUpdate = z.infer<typeof ZPlacementUpdate>;

export const ZPlacementMove = ZPlacementAnchor.refine(
  (value) => Boolean(value.beforePlacementId || value.afterPlacementId),
  { message: 'Provide beforePlacementId or afterPlacementId' }
).refine(hasSingleAnchor, singleAnchorIssue);
export type TPlacementMove = z.infer<typeof ZPlacementMove>;

export const ZBlockDuplicate = z.object({
  replacePlacementId: z.uuid().optional()
});
export type TBlockDuplicate = z.infer<typeof ZBlockDuplicate>;

export const ZBlockLibraryQuery = z.object({
  type: ZBlockType.optional(),
  q: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export type TBlockLibraryQuery = z.infer<typeof ZBlockLibraryQuery>;

export const ZBlockHistoryQuery = z.object({
  locale: ZBlockLocale,
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().min(1).optional()
});
export type TBlockHistoryQuery = z.infer<typeof ZBlockHistoryQuery>;

export const ZBlockParam = z.object({ blockId: z.uuid() });
export const ZPlacementParam = z.object({ placementId: z.uuid() });
export const ZLessonBlocksParam = z.object({ courseId: z.uuid(), lessonId: z.uuid() });
