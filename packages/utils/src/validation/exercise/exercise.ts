import * as z from 'zod';

export const ZExerciseCreate = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  lessonId: z.string().optional(),
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
  dueBy: z.iso.datetime().optional(),
  questions: z
    .array(
      z.object({
        id: z.number().int().optional(),
        question: z.string().min(1),
        points: z.number().int().min(0).optional(),
        options: z
          .array(
            z.object({
              id: z.number().int().optional(),
              label: z.string().min(1),
              isCorrect: z.boolean()
            })
          )
          .min(2)
      })
    )
    .optional()
});
export type TExerciseUpdate = z.infer<typeof ZExerciseUpdate>;

export const ZExerciseGetParam = z.object({
  exerciseId: z.string().min(1)
});
export type TExerciseGetParam = z.infer<typeof ZExerciseGetParam>;

export const ZExerciseListQuery = z.object({
  lessonId: z.string().optional()
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
  lessonId: z.string().min(1),
  templateId: z.number().int().min(1)
});

export type TExerciseFromTemplate = z.infer<typeof ZExerciseFromTemplate>;
