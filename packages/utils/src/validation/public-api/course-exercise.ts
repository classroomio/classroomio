import * as z from 'zod';

import { QUESTION_TYPE } from '../constants';
import { validateQuestionOptions } from '../exercise/exercise';
import { ZSlug } from '../shared/slug';
import { ZPublicApiCourseParam } from './course';
import { ZPublicApiPaginationQuery } from './pagination';

/** Question types the public API accepts; MATCHING (15) and HOTSPOT (16) are disabled and excluded. */
export const ZPublicApiQuestionTypeId = z.union([
  z.literal(QUESTION_TYPE.RADIO),
  z.literal(QUESTION_TYPE.CHECKBOX),
  z.literal(QUESTION_TYPE.TEXTAREA),
  z.literal(QUESTION_TYPE.TRUE_FALSE),
  z.literal(QUESTION_TYPE.SHORT_ANSWER),
  z.literal(QUESTION_TYPE.NUMERIC),
  z.literal(QUESTION_TYPE.FILL_BLANK),
  z.literal(QUESTION_TYPE.FILE_UPLOAD),
  z.literal(QUESTION_TYPE.ORDERING),
  z.literal(QUESTION_TYPE.LINK),
  z.literal(QUESTION_TYPE.WORD_BANK),
  z.literal(QUESTION_TYPE.STAR),
  z.literal(QUESTION_TYPE.VIDEO_RECORDING),
  z.literal(QUESTION_TYPE.THUMBS)
]);

const MAX_QUESTIONS = 200;
export const PUBLIC_API_MAX_QUESTION_OPTIONS = 50;
const MAX_SECTIONS = 50;

const ZSettings = z.record(z.string(), z.unknown());

export const ZPublicApiCourseExerciseParam = ZPublicApiCourseParam.extend({
  exerciseId: z.string().uuid()
});
export type TPublicApiCourseExerciseParam = z.infer<typeof ZPublicApiCourseExerciseParam>;

export const ZPublicApiCourseExerciseNotifyParam = ZPublicApiCourseExerciseParam.extend({
  jobId: z.string().min(1).max(64)
});
export type TPublicApiCourseExerciseNotifyParam = z.infer<typeof ZPublicApiCourseExerciseNotifyParam>;

export const ZPublicApiCourseExerciseNotifyStatusQuery = z.object({
  pollCount: z.coerce.number().int().min(0).max(1000).default(0)
});
export type TPublicApiCourseExerciseNotifyStatusQuery = z.infer<typeof ZPublicApiCourseExerciseNotifyStatusQuery>;

export const ZPublicApiCourseExercisesQuery = ZPublicApiPaginationQuery.extend({
  sectionId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional()
});
export type TPublicApiCourseExercisesQuery = z.infer<typeof ZPublicApiCourseExercisesQuery>;

export const ZPublicApiCreateExerciseQuestion = z
  .object({
    question: z.string().min(1),
    questionTypeId: ZPublicApiQuestionTypeId.default(QUESTION_TYPE.RADIO),
    points: z.number().int().min(1),
    order: z.number().int().min(0).optional(),
    settings: ZSettings.optional(),
    options: z
      .array(
        z.object({
          label: z.string().min(1),
          isCorrect: z.boolean(),
          settings: ZSettings.optional()
        })
      )
      .max(PUBLIC_API_MAX_QUESTION_OPTIONS)
      .optional()
  })
  .superRefine(validateQuestionOptions);
export type TPublicApiCreateExerciseQuestion = z.infer<typeof ZPublicApiCreateExerciseQuestion>;

export const ZPublicApiCreateCourseExercise = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    sectionId: z.string().uuid().optional(),
    lessonId: z.string().uuid().optional(),
    order: z.number().int().min(1),
    dueBy: z.string().datetime({ offset: true }).optional(),
    slug: ZSlug.optional(),
    questions: z.array(ZPublicApiCreateExerciseQuestion).max(MAX_QUESTIONS).optional(),
    templateId: z.number().int().min(1).optional()
  })
  .superRefine((data, ctx) => {
    if (data.templateId === undefined) {
      if (!data.title) {
        ctx.addIssue({ code: 'custom', message: 'title is required unless templateId is set', path: ['title'] });
      }
      return;
    }

    for (const field of ['title', 'description', 'dueBy', 'slug', 'questions'] as const) {
      if (data[field] !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: `${field} cannot be combined with templateId: the template supplies the title, description and questions`,
          path: [field]
        });
      }
    }
  });
export type TPublicApiCreateCourseExercise = z.infer<typeof ZPublicApiCreateCourseExercise>;

/** With an `id`, a partial edit that keeps omitted fields; without one, a complete new question or option. */
export const ZPublicApiUpdateExerciseQuestion = z
  .object({
    id: z.number().int().positive().optional(),
    delete: z.boolean().optional(),
    exerciseSectionId: z.string().uuid().nullable().optional(),
    question: z.string().min(1).optional().describe('Required for a new question'),
    questionTypeId: ZPublicApiQuestionTypeId.optional().describe('Defaults to RADIO (1) for a new question'),
    points: z.number().int().min(1).optional().describe('Required for a new question'),
    order: z.number().int().min(0).optional(),
    settings: ZSettings.optional(),
    options: z
      .array(
        z.object({
          id: z.number().int().positive().optional(),
          delete: z.boolean().optional(),
          label: z.string().min(1).optional().describe('Required for a new option'),
          isCorrect: z.boolean().optional().describe('Required for a new option'),
          settings: ZSettings.optional()
        })
      )
      .max(PUBLIC_API_MAX_QUESTION_OPTIONS)
      .optional()
  })
  .superRefine((question, ctx) => {
    if (question.delete && !question.id) {
      ctx.addIssue({ code: 'custom', message: 'delete needs the id of an existing question', path: ['delete'] });
    }

    (question.options ?? []).forEach((option, index) => {
      if (option.id) return;
      if (option.delete) {
        ctx.addIssue({
          code: 'custom',
          message: 'delete needs the id of an existing option',
          path: ['options', index, 'delete']
        });
      }
      if (option.label === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'label is required for a new option',
          path: ['options', index, 'label']
        });
      }
      if (option.isCorrect === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'isCorrect is required for a new option',
          path: ['options', index, 'isCorrect']
        });
      }
    });

    if (question.id) return;

    if (question.question === undefined) {
      ctx.addIssue({ code: 'custom', message: 'question is required for a new question', path: ['question'] });
    }
    if (question.points === undefined) {
      ctx.addIssue({ code: 'custom', message: 'points is required for a new question', path: ['points'] });
    }

    validateQuestionOptions(
      {
        ...question,
        questionTypeId: question.questionTypeId ?? QUESTION_TYPE.RADIO,
        deletedAt: question.delete ? 'deleted' : undefined,
        options: question.options
          ?.filter((option) => !option.delete)
          .map((option) => ({ isCorrect: option.isCorrect === true }))
      },
      ctx
    );
  });
export type TPublicApiUpdateExerciseQuestion = z.infer<typeof ZPublicApiUpdateExerciseQuestion>;

export const ZPublicApiExerciseSectionAfterBehavior = z.discriminatedUnion('action', [
  z.object({ action: z.literal('continue') }),
  z.object({ action: z.literal('go_to_section'), exerciseSectionId: z.string().uuid() }),
  z.object({ action: z.literal('submit') })
]);

export const ZPublicApiExerciseSection = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  order: z.number().int().min(0),
  colorTheme: z.enum(['blue', 'green', 'amber', 'rose', 'violet', 'slate']).default('blue'),
  afterBehavior: ZPublicApiExerciseSectionAfterBehavior.default({ action: 'continue' })
});

export const ZPublicApiUpdateCourseExercise = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    sectionId: z.string().uuid().optional(),
    lessonId: z.string().uuid().optional(),
    order: z.number().int().min(1).optional(),
    isUnlocked: z.boolean().optional(),
    dueBy: z.string().datetime({ offset: true }).optional(),
    allowMultipleAttempts: z.boolean().optional(),
    slug: ZSlug.optional(),
    questions: z.array(ZPublicApiUpdateExerciseQuestion).max(MAX_QUESTIONS).optional(),
    sections: z.array(ZPublicApiExerciseSection).max(MAX_SECTIONS).optional(),
    sectionDisplayMode: z.enum(['one_question', 'all_questions']).optional(),
    completionPolicy: z.enum(['submitted', 'passed']).optional(),
    passThreshold: z.number().int().min(0).max(100).optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Send at least one field to update'
  });
export type TPublicApiUpdateCourseExercise = z.infer<typeof ZPublicApiUpdateCourseExercise>;

export const ZPublicApiExerciseQuestionParam = ZPublicApiCourseExerciseParam.extend({
  questionId: z.coerce.number().int().positive()
});
export type TPublicApiExerciseQuestionParam = z.infer<typeof ZPublicApiExerciseQuestionParam>;

export const ZPublicApiAddExerciseQuestion = ZPublicApiCreateExerciseQuestion.safeExtend({
  exerciseSectionId: z
    .string()
    .uuid()
    .optional()
    .describe('The exercise section to put the question in; required when the exercise has sections')
});
export type TPublicApiAddExerciseQuestion = z.infer<typeof ZPublicApiAddExerciseQuestion>;

const ZPublicApiNewQuestionOption = z.object({
  label: z.string().min(1),
  isCorrect: z.boolean(),
  settings: ZSettings.optional()
});

const ZPublicApiQuestionOptionPatch = z.object({
  id: z.number().int().positive(),
  label: z.string().min(1).optional(),
  isCorrect: z.boolean().optional(),
  settings: ZSettings.optional()
});

export const ZPublicApiUpdateExerciseQuestionFields = z
  .object({
    exerciseSectionId: z.string().uuid().nullable().optional(),
    question: z.string().min(1).optional(),
    questionTypeId: ZPublicApiQuestionTypeId.optional(),
    points: z.number().int().min(1).optional(),
    order: z.number().int().min(0).optional(),
    settings: ZSettings.optional(),
    addOptions: z.array(ZPublicApiNewQuestionOption).max(PUBLIC_API_MAX_QUESTION_OPTIONS).optional(),
    updateOptions: z
      .array(ZPublicApiQuestionOptionPatch)
      .max(PUBLIC_API_MAX_QUESTION_OPTIONS)
      .optional()
      .describe('Edits existing options by id; fields you leave out keep their values'),
    removeOptionIds: z
      .array(z.number().int().positive())
      .max(PUBLIC_API_MAX_QUESTION_OPTIONS)
      .optional()
      .describe('Options to remove; options you do not name are kept')
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Send at least one field to update'
  })
  .refine(
    (data) => {
      const ids = [...(data.updateOptions ?? []).map((option) => option.id), ...(data.removeOptionIds ?? [])];

      return new Set(ids).size === ids.length;
    },
    { message: 'An option id can appear only once across updateOptions and removeOptionIds', path: ['removeOptionIds'] }
  );
export type TPublicApiUpdateExerciseQuestionFields = z.infer<typeof ZPublicApiUpdateExerciseQuestionFields>;

export const ZPublicApiDeleteExerciseQuestionQuery = z.object({
  force: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(false)
    .transform((value) => value === true || value === 'true')
    .describe('Also delete the answers students gave to the question; without it, an answered question is not deleted')
});
export type TPublicApiDeleteExerciseQuestionQuery = z.infer<typeof ZPublicApiDeleteExerciseQuestionQuery>;

export const ZPublicApiExerciseSectionParam = ZPublicApiCourseExerciseParam.extend({
  sectionId: z.string().uuid()
});
export type TPublicApiExerciseSectionParam = z.infer<typeof ZPublicApiExerciseSectionParam>;

export const ZPublicApiAddExerciseSection = ZPublicApiExerciseSection.omit({ id: true });
export type TPublicApiAddExerciseSection = z.infer<typeof ZPublicApiAddExerciseSection>;

export const ZPublicApiUpdateExerciseSectionFields = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    order: z.number().int().min(0).optional(),
    colorTheme: z.enum(['blue', 'green', 'amber', 'rose', 'violet', 'slate']).optional(),
    afterBehavior: ZPublicApiExerciseSectionAfterBehavior.optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Send at least one field to update'
  });
export type TPublicApiUpdateExerciseSectionFields = z.infer<typeof ZPublicApiUpdateExerciseSectionFields>;
