import * as z from 'zod';

import { QUESTION_TYPE } from '../constants';

const QUESTION_VALIDATION_RULES: Record<
  number,
  Array<(question: { options?: Array<{ isCorrect: boolean }> }) => string | null>
> = {
  [QUESTION_TYPE.RADIO]: [
    (question) => {
      const options = question.options || [];
      if (options.length > 0 && options.length < 2) {
        return 'Options must have at least 2 items for RADIO/CHECKBOX questions';
      }
      return null;
    },
    (question) => {
      const options = question.options || [];
      if (options.length > 0 && !options.some((opt) => opt.isCorrect === true)) {
        return 'Please mark an option as the correct answer';
      }
      return null;
    }
  ],
  [QUESTION_TYPE.CHECKBOX]: [
    (question) => {
      const options = question.options || [];
      if (options.length > 0 && options.length < 2) {
        return 'Options must have at least 2 items for RADIO/CHECKBOX questions';
      }
      return null;
    },
    (question) => {
      const options = question.options || [];
      if (options.length > 0 && !options.some((opt) => opt.isCorrect === true)) {
        return 'Please mark an option as the correct answer';
      }
      return null;
    }
  ],
  [QUESTION_TYPE.TEXTAREA]: []
};

// Base schema for exercise update question (without refinement)
const ZExerciseUpdateQuestionBase = z.object({
  id: z.number().int().optional(),
  question: z.string().min(1),
  questionTypeId: z.number().int().min(1).optional(), // Added to support question type updates
  points: z.number().int().min(0).optional(),
  deletedAt: z.string().optional(), // Marks question as deleted
  options: z
    .array(
      z.object({
        id: z.number().int().optional(),
        label: z.string().min(1),
        isCorrect: z.boolean(),
        deletedAt: z.string().optional() // Marks option as deleted
      })
    )
    .optional()
});

function validateQuestionOptions(question: z.infer<typeof ZExerciseUpdateQuestionBase>, ctx: z.core.$RefinementCtx) {
  // Skip validation for deleted questions
  if (question.deletedAt) return;

  const rules = QUESTION_VALIDATION_RULES[question.questionTypeId ?? -1] ?? [];
  for (const rule of rules) {
    const message = rule(question);
    if (!message) continue;
    ctx.addIssue({
      code: 'custom',
      message,
      path: ['options']
    });
  }
}

// Final schema with validation refinement
const ZExerciseUpdateQuestion = ZExerciseUpdateQuestionBase.superRefine(validateQuestionOptions);

export const ZExerciseCreate = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  lessonId: z.string().optional(),
  sectionId: z.string().optional(),
  order: z.number().int().optional(),
  courseId: z.string().min(1),
  dueBy: z.string().optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        points: z.number().int().min(0).optional(),
        options: z
          .array(
            z.object({
              label: z.string().min(1),
              isCorrect: z.boolean()
            })
          )
          .min(2)
      })
    )
    .optional()
});
export type TExerciseCreate = z.infer<typeof ZExerciseCreate>;

export const ZExerciseUpdate = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  lessonId: z.string().optional(),
  sectionId: z.string().optional(),
  order: z.number().int().optional(),
  isUnlocked: z.boolean().optional(),
  dueBy: z.string().optional(), // Changed from iso.datetime() to string to match frontend format
  questions: z.array(ZExerciseUpdateQuestion).optional()
});
export type TExerciseUpdate = z.infer<typeof ZExerciseUpdate>;

export const ZExerciseGetParam = z.object({
  exerciseId: z.string().min(1)
});
export type TExerciseGetParam = z.infer<typeof ZExerciseGetParam>;

export const ZExerciseListQuery = z.object({
  lessonId: z.string().optional(),
  sectionId: z.string().optional()
});
export type TExerciseListQuery = z.infer<typeof ZExerciseListQuery>;

// Exercise Submission Schemas
export const ZExerciseSubmissionCreate = z.object({
  exerciseId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.number().int(),
        optionId: z.number().int().optional(),
        answer: z.string().optional()
      })
    )
    .min(1)
});
export type TExerciseSubmissionCreate = z.infer<typeof ZExerciseSubmissionCreate>;

// Exercise Template Schemas
export const ZExerciseFromTemplate = z.object({
  lessonId: z.string().optional(),
  sectionId: z.string().optional(),
  order: z.number().int().optional(),
  templateId: z.number().int().min(1)
});

export type TExerciseFromTemplate = z.infer<typeof ZExerciseFromTemplate>;
