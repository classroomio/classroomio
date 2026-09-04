import * as z from 'zod';

export const ZLessonLanguageGetParam = z.object({
  courseId: z.uuid(),
  lessonId: z.uuid()
});

export type TLessonLanguageGetParam = z.infer<typeof ZLessonLanguageGetParam>;

export const ZLessonLanguageGetByLocaleParam = z.object({
  courseId: z.uuid(),
  lessonId: z.uuid(),
  locale: z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da'])
});

export type TLessonLanguageGetByLocaleParam = z.infer<typeof ZLessonLanguageGetByLocaleParam>;

/**
 * Version intents a client is allowed to ask for. Deliberately narrower than the
 * stored kinds: `publish` is set server-side at the publish boundary and `none`
 * is internal-only, so neither can be claimed by a request.
 */
export const ZLessonVersionIntent = z.enum(['auto', 'manual']);

export type TLessonVersionIntentRequest = z.infer<typeof ZLessonVersionIntent>;

export const ZLessonLanguageCreate = z.object({
  locale: z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']),
  content: z.string().optional(),
  versionIntent: ZLessonVersionIntent.optional(),
  versionLabel: z.string().max(120).optional()
});

export type TLessonLanguageCreate = z.infer<typeof ZLessonLanguageCreate>;

export const ZLessonLanguageUpdate = z.object({
  content: z.string().optional(),
  versionIntent: ZLessonVersionIntent.optional(),
  versionLabel: z.string().max(120).optional()
});

export type TLessonLanguageUpdate = z.infer<typeof ZLessonLanguageUpdate>;
