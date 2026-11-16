import { z } from 'zod';

export const MATH_IMAGE_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MATH_DOCUMENT_MEDIA_TYPES = [...MATH_IMAGE_MEDIA_TYPES, 'application/pdf'] as const;
export const MATH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MATH_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const MATH_FREE_PLAN_MONTHLY_CONVERSIONS = 30;

const BASE64_OVERHEAD = 4 / 3;

export const ZMathConvertImageBody = z.object({
  courseId: z.string().uuid(),
  source: z.enum(['photo', 'draw']),
  image: z.object({
    mediaType: z.enum(MATH_IMAGE_MEDIA_TYPES),
    data: z
      .string()
      .min(1)
      .max(Math.ceil(MATH_IMAGE_MAX_BYTES * BASE64_OVERHEAD))
  })
});

export type TMathConvertImageBody = z.infer<typeof ZMathConvertImageBody>;

export const ZMathImportWorksheetBody = z.object({
  courseId: z.string().uuid(),
  document: z.object({
    mediaType: z.enum(MATH_DOCUMENT_MEDIA_TYPES),
    data: z
      .string()
      .min(1)
      .max(Math.ceil(MATH_DOCUMENT_MAX_BYTES * BASE64_OVERHEAD))
  })
});

export type TMathImportWorksheetBody = z.infer<typeof ZMathImportWorksheetBody>;

export const MATH_IMPORT_QUESTION_TYPES = ['MATH_EXPRESSION', 'NUMERIC', 'RADIO'] as const;

export const ZMathWorksheetModelOutput = z.object({
  questions: z.array(
    z.object({
      title: z.string().describe('The question text; wrap every piece of math in $...$'),
      type: z.enum(MATH_IMPORT_QUESTION_TYPES),
      answer: z
        .string()
        .nullable()
        .describe('MATH_EXPRESSION and NUMERIC: the answer as LaTeX without $ delimiters. RADIO: null'),
      options: z
        .array(z.string())
        .nullable()
        .describe('RADIO only: the option texts in order, math wrapped in $...$. Otherwise null'),
      correctOptionIndex: z.number().int().nullable().describe('RADIO only: zero-based index of the correct option'),
      checkExpression: z
        .string()
        .nullable()
        .describe('LaTeX of the expression from the question whose value equals the answer, without $ delimiters'),
      checkEquation: z
        .string()
        .nullable()
        .describe('LaTeX of the equation from the question that the answer solves, without $ delimiters'),
      points: z.number().min(0).max(100).nullable()
    })
  )
});

export type TMathWorksheetModelOutput = z.infer<typeof ZMathWorksheetModelOutput>;

export const ZAiReviewRequestBody = z.object({
  questionId: z.number().int()
});
export type TAiReviewRequestBody = z.infer<typeof ZAiReviewRequestBody>;

export const ZAiReviewDecisionBody = z.object({
  questionId: z.number().int(),
  status: z.enum(['accepted', 'edited', 'rejected']),
  awardedPoints: z.number().min(0).max(99_999_999.99).optional()
});
export type TAiReviewDecisionBody = z.infer<typeof ZAiReviewDecisionBody>;

export const ZAiReviewBulkAcceptBody = z.object({
  minConfidence: z.number().min(0.5).max(1).optional()
});
export type TAiReviewBulkAcceptBody = z.infer<typeof ZAiReviewBulkAcceptBody>;

export const ZAiReviewModelOutput = z.object({
  stepMarks: z.array(
    z.object({
      stepId: z.string().describe('The id of the rubric step, copied exactly'),
      awarded: z.number().describe('Points awarded for this step, between 0 and the step points'),
      comment: z.string().nullable().describe('One short sentence on why, or null')
    })
  ),
  firstWrongStep: z
    .string()
    .nullable()
    .describe('The id of the first rubric step the student gets wrong or leaves out; null when every step is right'),
  comment: z.string().describe('Two sentences at most for the teacher: what is good and what went wrong'),
  confidence: z.number().min(0).max(1).describe('How sure you are of these marks; use below 0.6 when the writing is hard to read')
});
export type TAiReviewModelOutput = z.infer<typeof ZAiReviewModelOutput>;
