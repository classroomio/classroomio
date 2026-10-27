import * as z from 'zod';

import { getSlidePlatformByHost, isAllowedSlideEmbedSrc, SLIDE_PLATFORM_IDS } from '../../functions/slide-embed';
import { ZLessonVideoItem } from '../lesson/lesson';
import { ZLessonVersionIntent } from '../lesson/language';
import { isAllowedHref } from '../shared/safe-href';

export const BLOCK_TYPES = ['note', 'video', 'slides', 'document'] as const;
export type TBlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it'] as const;
export const ZBlockLocale = z.enum(BLOCK_LOCALES);
export type TBlockLocaleCode = z.infer<typeof ZBlockLocale>;

export const ZNoteBlockData = z.object({}).strict();
export type TNoteBlockData = z.infer<typeof ZNoteBlockData>;

const HLS_PROXY_PATH = /^\/hls\/[\w./-]+$/;

export const ZVideoBlockData = ZLessonVideoItem.omit({ watchEnforced: true, link: true })
  .extend({ link: z.string() })
  .refine((video) => video.type === 'upload' || HLS_PROXY_PATH.test(video.link) || isAllowedHref(video.link), {
    message: 'Video link scheme is not allowed',
    path: ['link']
  });
export type TVideoBlockData = z.infer<typeof ZVideoBlockData>;

export const ZSlidesBlockData = z
  .object({
    src: z
      .url()
      .refine((src) => isAllowedSlideEmbedSrc(src), { message: 'Slide embed source is not from a supported platform' }),
    platform: z.enum(SLIDE_PLATFORM_IDS)
  })
  .refine(
    (slide) => {
      try {
        const hostname = new URL(slide.src).hostname.replace(/^www\./i, '').toLowerCase();

        return getSlidePlatformByHost(hostname)?.id === slide.platform;
      } catch {
        return false;
      }
    },
    { message: 'Slide platform does not match embed source', path: ['platform'] }
  );
export type TSlidesBlockData = z.infer<typeof ZSlidesBlockData>;

export const ZDocumentBlockData = z.object({
  type: z.string(),
  name: z.string(),
  link: z.string(),
  size: z.number().optional(),
  key: z.string(),
  assetId: z.uuid().optional()
});
export type TDocumentBlockData = z.infer<typeof ZDocumentBlockData>;

export const ZBlockDataByType = {
  note: ZNoteBlockData,
  video: ZVideoBlockData,
  slides: ZSlidesBlockData,
  document: ZDocumentBlockData
} as const;

export type TBlockDataByType = {
  note: TNoteBlockData;
  video: TVideoBlockData;
  slides: TSlidesBlockData;
  document: TDocumentBlockData;
};

export const ZBlockType = z.enum(BLOCK_TYPES);

/**
 * Validates `data` against the schema registered for `type`.
 * @returns the parsed data, or null when it is invalid.
 */
export function parseBlockData<T extends TBlockType>(type: T, data: unknown): TBlockDataByType[T] | null {
  const result = ZBlockDataByType[type].safeParse(data);

  return result.success ? (result.data as TBlockDataByType[T]) : null;
}

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

const blockCreateVariant = <T extends TBlockType>(type: T) =>
  z.object({
    type: z.literal(type),
    data: ZBlockDataByType[type],
    content: z.string().optional(),
    locale: ZBlockLocale.optional()
  });

export const ZBlockCreate = z
  .discriminatedUnion('type', [
    blockCreateVariant('note'),
    blockCreateVariant('video'),
    blockCreateVariant('slides'),
    blockCreateVariant('document')
  ])
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
