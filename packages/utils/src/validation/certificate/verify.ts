import { z } from 'zod';

import { normalizeVerifyCode } from '../../certificate/verify-code';

export const ZVerifyCodeParam = z.object({
  code: z.string().transform((value, ctx) => {
    const normalized = normalizeVerifyCode(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid verification code'
      });
      return z.NEVER;
    }
    return normalized;
  })
});

export type TVerifyCodeParam = z.infer<typeof ZVerifyCodeParam>;
