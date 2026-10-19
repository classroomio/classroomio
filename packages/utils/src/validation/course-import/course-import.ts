import * as z from 'zod';

import { ZComplianceSettings, ZCourseMetadata } from '../course/course';
import { ZCourseType } from '../course/course-type';
import { ZExerciseQuestionTypeId } from '../exercise/exercise';
import { ZLessonVideoItem } from '../lesson/lesson';

const ZSupportedLocale = z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it']);
const LESSON_BODY_HTML_DESCRIPTION =
  'Lesson body HTML only. Do not include the lesson title. Do not use h1 or h2 anywhere in lessonLanguages[].content. Start headings at h3 because that is the highest heading level allowed in lesson content.';
const TOP_LEVEL_ORDER_DESCRIPTION =
  'Top-level position. Sections, lessons without a section, and exercises with neither a section nor a lesson share one contiguous 1-based sequence.';

export const ZCourseImportWarning = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error'])
});
export type TCourseImportWarning = z.infer<typeof ZCourseImportWarning>;

export const ZCourseImportSourceReference = z.object({
  type: z.enum(['prompt', 'pdf', 'course']),
  label: z.string().min(1),
  pageStart: z.number().int().min(1).optional(),
  pageEnd: z.number().int().min(1).optional()
});
export type TCourseImportSourceReference = z.infer<typeof ZCourseImportSourceReference>;

export const ZCourseImportDraftCourse = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: ZCourseType,
    locale: ZSupportedLocale.default('en'),
    metadata: ZCourseMetadata.optional(),
    compliance: ZComplianceSettings.optional()
  })
  .refine((data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined, {
    message: 'Compliance settings are required for COMPLIANCE courses',
    path: ['compliance']
  });
export type TCourseImportDraftCourse = z.infer<typeof ZCourseImportDraftCourse>;

export const ZCourseImportDraftSection = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().min(1).describe(TOP_LEVEL_ORDER_DESCRIPTION)
});
export type TCourseImportDraftSection = z.infer<typeof ZCourseImportDraftSection>;

export const ZCourseImportDraftLesson = z.object({
  externalId: z.string().min(1),
  sectionExternalId: z
    .string()
    .min(1)
    .optional()
    .describe('Section the lesson belongs to. Omit it for a lesson that sits at the top level of the course.'),
  title: z.string().min(1),
  order: z
    .number()
    .int()
    .min(1)
    .describe(
      'Position within the section, 1-based. A lesson without a section takes its place in the top-level sequence it shares with sections and top-level exercises.'
    ),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  videos: z.array(ZLessonVideoItem).optional()
});
export type TCourseImportDraftLesson = z.infer<typeof ZCourseImportDraftLesson>;

export const ZCourseImportDraftLessonLanguage = z.object({
  lessonExternalId: z.string().min(1),
  locale: ZSupportedLocale,
  content: z.string().min(1).describe(LESSON_BODY_HTML_DESCRIPTION)
});
export type TCourseImportDraftLessonLanguage = z.infer<typeof ZCourseImportDraftLessonLanguage>;

export const ZCourseImportDraftExerciseOption = z.object({
  label: z.string().min(1),
  isCorrect: z.boolean(),
  settings: z.record(z.string(), z.unknown()).optional()
});
export type TCourseImportDraftExerciseOption = z.infer<typeof ZCourseImportDraftExerciseOption>;

export const ZCourseImportDraftExerciseQuestion = z.object({
  question: z.string().min(1),
  questionTypeId: ZExerciseQuestionTypeId.optional(),
  points: z.number().int().min(1),
  order: z.number().int().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  options: z.array(ZCourseImportDraftExerciseOption).optional()
});
export type TCourseImportDraftExerciseQuestion = z.infer<typeof ZCourseImportDraftExerciseQuestion>;

export const ZCourseImportDraftExercise = z.object({
  externalId: z.string().min(1),
  lessonExternalId: z.string().min(1).optional(),
  sectionExternalId: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z
    .number()
    .int()
    .min(1)
    .describe(
      'Position within its section or lesson, 1-based. An exercise with neither takes its place in the top-level sequence it shares with sections and top-level lessons.'
    ),
  dueBy: z.string().optional(),
  questions: z.array(ZCourseImportDraftExerciseQuestion).optional()
});
export type TCourseImportDraftExercise = z.infer<typeof ZCourseImportDraftExercise>;

export type TCourseImportDraftRootEntry = {
  kind: 'section' | 'lesson' | 'exercise';
  externalId: string;
  order: number;
};

type DraftOutline = {
  sections: TCourseImportDraftSection[];
  lessons: TCourseImportDraftLesson[];
  exercises?: TCourseImportDraftExercise[];
};

function isContiguousSequence(orders: number[]) {
  return [...orders].sort((left, right) => left - right).every((order, index) => order === index + 1);
}

function draftRootEntries(draft: DraftOutline) {
  const sections = draft.sections.map((section) => ({
    kind: 'section' as const,
    externalId: section.externalId,
    order: section.order
  }));
  const lessons = draft.lessons
    .filter((lesson) => !lesson.sectionExternalId)
    .map((lesson) => ({ kind: 'lesson' as const, externalId: lesson.externalId, order: lesson.order }));
  const exercises = (draft.exercises ?? [])
    .filter((exercise) => !exercise.sectionExternalId && !exercise.lessonExternalId)
    .map((exercise) => ({ kind: 'exercise' as const, externalId: exercise.externalId, order: exercise.order }));

  return { sections, lessons, exercises };
}

/**
 * Top-level entries of a draft with their course order, or null when the orders are not a valid sequence.
 * Drafts that number sections and top-level exercises separately (and have no top-level lessons) place the exercises after the sections.
 */
export function getDraftRootEntries(draft: DraftOutline): TCourseImportDraftRootEntry[] | null {
  const { sections, lessons, exercises } = draftRootEntries(draft);
  const combined = [...sections, ...lessons, ...exercises];
  if (isContiguousSequence(combined.map((entry) => entry.order))) {
    return combined.sort((left, right) => left.order - right.order);
  }

  const isSeparatelyNumbered =
    lessons.length === 0 &&
    isContiguousSequence(sections.map((entry) => entry.order)) &&
    isContiguousSequence(exercises.map((entry) => entry.order));
  if (!isSeparatelyNumbered) return null;

  const placedExercises = exercises.map((entry) => ({ ...entry, order: sections.length + entry.order }));

  return [...sections, ...placedExercises].sort((left, right) => left.order - right.order);
}

export const ZCourseImportDraftPayload = z
  .object({
    course: ZCourseImportDraftCourse,
    tags: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
    sections: z.array(ZCourseImportDraftSection).default([]),
    lessons: z.array(ZCourseImportDraftLesson).min(1),
    lessonLanguages: z.array(ZCourseImportDraftLessonLanguage).min(1),
    exercises: z.array(ZCourseImportDraftExercise).optional(),
    sourceReferences: z.array(ZCourseImportSourceReference).optional(),
    warnings: z.array(ZCourseImportWarning).default([])
  })
  .superRefine((value, ctx) => {
    const normalizedTags = new Set<string>();
    value.tags.forEach((tag, index) => {
      const tagKey = tag.trim().toLowerCase();
      if (normalizedTags.has(tagKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tags', index],
          message: 'Draft tags must be unique'
        });
      }
      normalizedTags.add(tagKey);
    });

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

    if (!getDraftRootEntries(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sections'],
        message:
          'Top-level orders (sections, lessons without a section, and exercises with neither) must be a contiguous 1-based sequence (1, 2, 3, ...)'
      });
    }

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

      if (lesson.sectionExternalId && !sectionIds.has(lesson.sectionExternalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessons', index, 'sectionExternalId'],
          message: 'Lesson sectionExternalId must reference an existing section'
        });
      }
    });

    const lessonsBySection = new Map<string, number[]>();
    for (const lesson of value.lessons) {
      if (!lesson.sectionExternalId) continue;

      const orders = lessonsBySection.get(lesson.sectionExternalId) ?? [];
      orders.push(lesson.order);
      lessonsBySection.set(lesson.sectionExternalId, orders);
    }
    for (const [, orders] of lessonsBySection) {
      const sorted = [...orders].sort((a, b) => a - b);
      if (sorted.some((order, i) => order !== i + 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessons'],
          message: 'Lesson orders within each section must be a contiguous 1-based sequence (1, 2, 3, ...)'
        });
      }
    }

    value.lessonLanguages.forEach((lessonLanguage, index) => {
      if (!lessonIds.has(lessonLanguage.lessonExternalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessonLanguages', index, 'lessonExternalId'],
          message: 'Lesson language must reference an existing lesson'
        });
      }
    });

    const exerciseIds = new Set<string>();
    value.exercises?.forEach((exercise, index) => {
      if (exerciseIds.has(exercise.externalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exercises', index, 'externalId'],
          message: 'Exercise externalId must be unique'
        });
      }
      exerciseIds.add(exercise.externalId);

      if (exercise.lessonExternalId && !lessonIds.has(exercise.lessonExternalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exercises', index, 'lessonExternalId'],
          message: 'Exercise lessonExternalId must reference an existing lesson'
        });
      }

      if (exercise.sectionExternalId && !sectionIds.has(exercise.sectionExternalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exercises', index, 'sectionExternalId'],
          message: 'Exercise sectionExternalId must reference an existing section'
        });
      }
    });

    if (value.exercises) {
      const lessonsByExternalId = new Map(value.lessons.map((l) => [l.externalId, l]));
      const exercisesByGroup = new Map<string, number[]>();
      for (const exercise of value.exercises) {
        if (!exercise.sectionExternalId && !exercise.lessonExternalId) continue;

        let groupKey = exercise.sectionExternalId ?? '';
        if (exercise.lessonExternalId) {
          const parentLesson = lessonsByExternalId.get(exercise.lessonExternalId);
          groupKey = parentLesson?.sectionExternalId ?? exercise.lessonExternalId;
        }
        const orders = exercisesByGroup.get(groupKey) ?? [];
        orders.push(exercise.order);
        exercisesByGroup.set(groupKey, orders);
      }
      for (const [, orders] of exercisesByGroup) {
        const sorted = [...orders].sort((a, b) => a - b);
        if (sorted.some((order, i) => order !== i + 1)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['exercises'],
            message: 'Exercise orders within each group must be a contiguous 1-based sequence (1, 2, 3, ...)'
          });
        }
      }
    }
  });
export type TCourseImportDraftPayload = z.infer<typeof ZCourseImportDraftPayload>;

export const ZCourseImportDraftCreate = z.object({
  sourceType: z.enum(['prompt', 'pdf', 'course']),
  idempotencyKey: z.string().min(1).optional(),
  summary: z.record(z.string(), z.unknown()).optional(),
  sourceArtifacts: z.array(z.record(z.string(), z.unknown())).optional(),
  draft: ZCourseImportDraftPayload
});
export type TCourseImportDraftCreate = z.infer<typeof ZCourseImportDraftCreate>;

export const ZCourseImportCourseParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseImportCourseParam = z.infer<typeof ZCourseImportCourseParam>;

export const ZCourseImportDraftCreateFromCourse = z.object({
  courseId: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
  summary: z.record(z.string(), z.unknown()).optional(),
  sourceArtifacts: z.array(z.record(z.string(), z.unknown())).optional()
});
export type TCourseImportDraftCreateFromCourse = z.infer<typeof ZCourseImportDraftCreateFromCourse>;

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

export const ZCourseImportDraftPublishBase = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: ZCourseType.optional(),
  metadata: ZCourseMetadata.optional(),
  compliance: ZComplianceSettings.optional(),
  bannerImageUrl: z.string().url().optional(),
  bannerImageQuery: z.string().min(1).max(120).optional(),
  generateBannerImage: z.boolean().optional()
});

export const ZCourseImportDraftPublish = ZCourseImportDraftPublishBase.refine(
  (data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined,
  {
    message: 'Compliance settings are required for COMPLIANCE courses',
    path: ['compliance']
  }
);
export type TCourseImportDraftPublish = z.infer<typeof ZCourseImportDraftPublish>;

export const ZCourseImportDraftPublishToCourseBase = ZCourseImportDraftPublishBase.extend({
  courseId: z.string().min(1),
  syncMode: z.enum(['merge', 'replace']).default('merge')
});

export const ZCourseImportDraftPublishToCourse = ZCourseImportDraftPublishToCourseBase.refine(
  (data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined,
  {
    message: 'Compliance settings are required for COMPLIANCE courses',
    path: ['compliance']
  }
);
export type TCourseImportDraftPublishToCourse = z.infer<typeof ZCourseImportDraftPublishToCourse>;
