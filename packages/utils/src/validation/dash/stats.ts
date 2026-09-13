import * as z from 'zod';

export const ZDashStats = z
  .object({
    orgId: z.string().optional(),
    siteName: z.string().optional(),
    bust: z
      .enum(['0', '1'])
      .optional()
      .transform((value) => value === '1')
  })
  .refine((v) => !!(v.orgId || v.siteName), {
    message: 'Either orgId or siteName is required'
  });

export type TDashStats = z.infer<typeof ZDashStats>;
