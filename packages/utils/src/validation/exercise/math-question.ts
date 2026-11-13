import * as z from 'zod';

import { MATH_REQUIRED_FORMS } from '@cio/question-types';

const ZNonNegative = z.number().finite().min(0);

export const ZMathCompare = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('equivalent') }),
  z.object({ mode: z.literal('exact_form'), form: z.enum(MATH_REQUIRED_FORMS) }),
  z.object({
    mode: z.literal('numeric'),
    absoluteTolerance: ZNonNegative.optional(),
    relativeTolerance: ZNonNegative.optional(),
    significantFigures: z.number().int().min(1).max(15).optional()
  }),
  z.object({ mode: z.literal('set') })
]);

export const ZMathExpressionSettings = z.object({
  acceptedAnswers: z.array(z.string().trim().min(1)).min(1, 'Add at least one accepted answer'),
  compare: ZMathCompare.optional(),
  units: z.object({ unit: z.string().trim().min(1), allowConversion: z.boolean() }).optional(),
  variables: z.array(z.string().trim().min(1)).optional(),
  wrongAnswerFeedback: z
    .array(z.object({ answer: z.string().trim().min(1), feedback: z.string().trim().min(1) }))
    .optional()
});
export type TMathExpressionSettings = z.infer<typeof ZMathExpressionSettings>;

export const ZWorkedSolutionSettings = ZMathExpressionSettings.extend({
  answerPoints: ZNonNegative.optional(),
  workingInputs: z
    .array(z.enum(['typed', 'drawing', 'photo']))
    .min(1)
    .optional()
});
export type TWorkedSolutionSettings = z.infer<typeof ZWorkedSolutionSettings>;
