import * as z from 'zod';

import {
  ZLessonCreate,
  ZLessonHistoryQuery,
  ZLessonLanguageCreate,
  ZLessonLanguageGetByLocaleParam,
  ZLessonLanguageUpdate,
  ZLessonReorder,
  ZLessonUpdate
} from '../lesson';

export const ZPublicApiLessonParam = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid()
});
export type TPublicApiLessonParam = z.infer<typeof ZPublicApiLessonParam>;

export const ZPublicApiLessonsQuery = z.object({
  sectionId: z.string().uuid().optional()
});
export type TPublicApiLessonsQuery = z.infer<typeof ZPublicApiLessonsQuery>;

export const ZPublicApiLessonVideo = ZLessonUpdate.shape.videos
  .unwrap()
  .element.omit({ key: true, assetId: true })
  .extend({ type: z.enum(['youtube', 'vimeo', 'generic', 'google_drive']) });
export type TPublicApiLessonVideo = z.infer<typeof ZPublicApiLessonVideo>;

export const ZPublicApiCreateLesson = ZLessonCreate.omit({ courseId: true, teacherId: true });
export type TPublicApiCreateLesson = z.infer<typeof ZPublicApiCreateLesson>;

export const ZPublicApiUpdateLesson = ZLessonUpdate.omit({
  teacherId: true,
  videos: true,
  documents: true
}).extend({ videos: z.array(ZPublicApiLessonVideo).optional() });
export type TPublicApiUpdateLesson = z.infer<typeof ZPublicApiUpdateLesson>;

export const ZPublicApiReorderLessons = ZLessonReorder;
export type TPublicApiReorderLessons = z.infer<typeof ZPublicApiReorderLessons>;

export const ZPublicApiLessonTranslationParam = ZLessonLanguageGetByLocaleParam;
export type TPublicApiLessonTranslationParam = z.infer<typeof ZPublicApiLessonTranslationParam>;

export const ZPublicApiCreateLessonTranslation = ZLessonLanguageCreate;
export type TPublicApiCreateLessonTranslation = z.infer<typeof ZPublicApiCreateLessonTranslation>;

export const ZPublicApiUpdateLessonTranslation = ZLessonLanguageUpdate;
export type TPublicApiUpdateLessonTranslation = z.infer<typeof ZPublicApiUpdateLessonTranslation>;

export const ZPublicApiLessonHistoryQuery = ZLessonHistoryQuery;
export type TPublicApiLessonHistoryQuery = z.infer<typeof ZPublicApiLessonHistoryQuery>;
