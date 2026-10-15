import * as z from 'zod';

export const ZPublicApiEnrolledQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'in_progress', 'completed']).default('all'),
  search: z.string().trim().max(200).optional()
});
export type TPublicApiEnrolledQuery = z.infer<typeof ZPublicApiEnrolledQuery>;
