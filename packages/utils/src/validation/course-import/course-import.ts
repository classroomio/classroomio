import * as z from 'zod';

import { ZCourseMetadata } from '../course/course';

const ZSupportedLocale = z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']);

export const ZCourseImportWarning = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error'])
});
export type TCourseImportWarning = z.infer<typeof ZCourseImportWarning>;

export const ZCourseImportSourceReference = z.object({
  type: z.enum(['prompt', 'pdf']),
  label: z.string().min(1),
  pageStart: z.number().int().min(1).optional(),
  pageEnd: z.number().int().min(1).optional()
});
export type TCourseImportSourceReference = z.infer<typeof ZCourseImportSourceReference>;

export const ZCourseImportDraftCourse = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED']),
  locale: ZSupportedLocale.default('en'),
  metadata: ZCourseMetadata.optional()
});
export type TCourseImportDraftCourse = z.infer<typeof ZCourseImportDraftCourse>;

export const ZCourseImportDraftSection = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().min(0)
});
export type TCourseImportDraftSection = z.infer<typeof ZCourseImportDraftSection>;

export const ZCourseImportDraftLesson = z.object({
  externalId: z.string().min(1),
  sectionExternalId: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().min(0),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional()
});
export type TCourseImportDraftLesson = z.infer<typeof ZCourseImportDraftLesson>;

export const ZCourseImportDraftLessonLanguage = z.object({
  lessonExternalId: z.string().min(1),
  locale: ZSupportedLocale,
  content: z.string().min(1)
});
export type TCourseImportDraftLessonLanguage = z.infer<typeof ZCourseImportDraftLessonLanguage>;

export const ZCourseImportDraftPayload = z
  .object({
    course: ZCourseImportDraftCourse,
    sections: z.array(ZCourseImportDraftSection).min(1),
    lessons: z.array(ZCourseImportDraftLesson).min(1),
    lessonLanguages: z.array(ZCourseImportDraftLessonLanguage).min(1),
    exercises: z.array(z.record(z.string(), z.unknown())).optional(),
    sourceReferences: z.array(ZCourseImportSourceReference).optional(),
    warnings: z.array(ZCourseImportWarning).default([])
  })
  .superRefine((value, ctx) => {
    const sectionIds = new Set<string>();
    value.sections.forEach((section, index) => {
      if (sectionIds.has(section.externalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', index, 'externalId'],
          message: 'Section externalId must be unique'
        });
      }
      sectionIds.add(section.externalId);
    });

    const lessonIds = new Set<string>();
    value.lessons.forEach((lesson, index) => {
      if (lessonIds.has(lesson.externalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessons', index, 'externalId'],
          message: 'Lesson externalId must be unique'
        });
      }
      lessonIds.add(lesson.externalId);

      if (!sectionIds.has(lesson.sectionExternalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessons', index, 'sectionExternalId'],
          message: 'Lesson sectionExternalId must reference an existing section'
        });
      }
    });

    value.lessonLanguages.forEach((lessonLanguage, index) => {
      if (!lessonIds.has(lessonLanguage.lessonExternalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessonLanguages', index, 'lessonExternalId'],
          message: 'Lesson language must reference an existing lesson'
        });
      }
    });
  });
export type TCourseImportDraftPayload = z.infer<typeof ZCourseImportDraftPayload>;

export const ZCourseImportDraftCreate = z.object({
  sourceType: z.enum(['prompt', 'pdf']),
  idempotencyKey: z.string().min(1).optional(),
  summary: z.record(z.string(), z.unknown()).optional(),
  sourceArtifacts: z.array(z.record(z.string(), z.unknown())).optional(),
  draft: ZCourseImportDraftPayload
});
export type TCourseImportDraftCreate = z.infer<typeof ZCourseImportDraftCreate>;

export const ZCourseImportDraftGetParam = z.object({
  draftId: z.string().uuid()
});
export type TCourseImportDraftGetParam = z.infer<typeof ZCourseImportDraftGetParam>;

export const ZCourseImportDraftUpdate = z.object({
  summary: z.record(z.string(), z.unknown()).optional(),
  sourceArtifacts: z.array(z.record(z.string(), z.unknown())).optional(),
  warnings: z.array(ZCourseImportWarning).optional(),
  draft: ZCourseImportDraftPayload.optional()
});
export type TCourseImportDraftUpdate = z.infer<typeof ZCourseImportDraftUpdate>;

export const ZCourseImportDraftPublish = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED']).optional(),
  metadata: ZCourseMetadata.optional()
});
export type TCourseImportDraftPublish = z.infer<typeof ZCourseImportDraftPublish>;
