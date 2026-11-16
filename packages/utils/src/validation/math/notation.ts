import { z } from 'zod';
import {
  MATH_DECIMAL_SEPARATORS,
  MATH_GRADE_BANDS,
  MATH_MULTIPLICATION_SIGNS,
  MATH_THOUSANDS_SEPARATORS,
  MATH_UNIT_SYSTEMS
} from '@cio/question-types';

const ZMathNotationFields = z.object({
  decimalSeparator: z.enum(MATH_DECIMAL_SEPARATORS),
  thousandsSeparator: z.enum(MATH_THOUSANDS_SEPARATORS),
  multiplicationSign: z.enum(MATH_MULTIPLICATION_SIGNS),
  unitSystem: z.enum(MATH_UNIT_SYSTEMS),
  gradeBand: z.enum(MATH_GRADE_BANDS)
});

const decimalAndThousandsDiffer = (settings: { decimalSeparator?: string; thousandsSeparator?: string }) =>
  !(
    (settings.decimalSeparator === 'comma' && settings.thousandsSeparator === 'comma') ||
    (settings.decimalSeparator === 'point' && settings.thousandsSeparator === 'dot')
  );

const separatorsClash = {
  message: 'The thousands separator must differ from the decimal separator',
  path: ['thousandsSeparator']
};

export const ZMathNotationSettings = ZMathNotationFields.refine(decimalAndThousandsDiffer, separatorsClash);
export type TMathNotationSettings = z.infer<typeof ZMathNotationSettings>;

export const ZCourseMathNotationOverride = ZMathNotationFields.partial()
  .extend({ inheritFromOrg: z.boolean().optional() })
  .refine(decimalAndThousandsDiffer, separatorsClash);
export type TCourseMathNotationOverride = z.infer<typeof ZCourseMathNotationOverride>;
