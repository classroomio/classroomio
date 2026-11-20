import * as z from 'zod';

export const ZGetEarnedCertificates = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(200).optional()
});

export type TGetEarnedCertificates = z.infer<typeof ZGetEarnedCertificates>;
