import * as z from 'zod';

import { ZPublicApiCourseLessonParam } from './course-lesson';

export const ZPublicApiLessonLocale = z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']);
export type TPublicApiLessonLocale = z.infer<typeof ZPublicApiLessonLocale>;

export const ZPublicApiCourseLessonTranslationParam = ZPublicApiCourseLessonParam.extend({
  locale: ZPublicApiLessonLocale
});
export type TPublicApiCourseLessonTranslationParam = z.infer<typeof ZPublicApiCourseLessonTranslationParam>;

export const ZPublicApiCourseLessonTranslationsQuery = z.object({
  locale: ZPublicApiLessonLocale.optional()
});
export type TPublicApiCourseLessonTranslationsQuery = z.infer<typeof ZPublicApiCourseLessonTranslationsQuery>;

export const ZPublicApiSetCourseLessonTranslation = z.object({
  content: z.string(),
  versionIntent: z.enum(['auto', 'manual']).optional(),
  versionLabel: z.string().max(120).optional()
});
export type TPublicApiSetCourseLessonTranslation = z.infer<typeof ZPublicApiSetCourseLessonTranslation>;

export const ZPublicApiCourseLessonHistoryQuery = z.object({
  locale: ZPublicApiLessonLocale,
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().min(1).max(100).optional()
});
export type TPublicApiCourseLessonHistoryQuery = z.infer<typeof ZPublicApiCourseLessonHistoryQuery>;
