import * as z from 'zod';

import { MATH_REQUIRED_FORMS, MAX_VARIABLES, VARIABLE_NAME_PATTERN, VARIABLE_TYPES } from '@cio/question-types';

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

export const ZQuestionVariable = z.object({
  name: z.string().regex(VARIABLE_NAME_PATTERN, 'Use one letter other than e and i'),
  type: z.enum(VARIABLE_TYPES),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().finite().positive().optional(),
  choices: z.array(z.number().finite()).max(50).optional()
});

export const ZQuestionParameters = z.object({
  variables: z.array(ZQuestionVariable).min(1).max(MAX_VARIABLES),
  constraints: z.array(z.string().trim().min(1)).max(10).optional(),
  answerFormula: z.string().trim().optional(),
  requireIntegerAnswer: z.boolean().optional(),
  requireNonzeroAnswer: z.boolean().optional()
});
export type TQuestionParameters = z.infer<typeof ZQuestionParameters>;

export const ZMathExpressionSettings = z.object({
  parameters: ZQuestionParameters.optional(),
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
