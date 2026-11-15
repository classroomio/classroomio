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
