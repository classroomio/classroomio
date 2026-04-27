import * as z from 'zod';

export const ZLoginActivity = z
  .object({
    orgId: z.string().optional(),
    siteName: z.string().optional(),
    days: z.coerce.number().int().min(1).max(365).default(90)
  })
  .refine((v) => !!(v.orgId || v.siteName), {
    message: 'Either orgId or siteName is required'
  });

export type TLoginActivity = z.infer<typeof ZLoginActivity>;
