import * as z from 'zod';

export const ZGetEnrolled = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(['all', 'not_started', 'in_progress']).default('all'),
  kind: z.enum(['all', 'course', 'learning_path']).default('all'),
  search: z.string().trim().max(200).optional()
});

export type TGetEnrolled = z.infer<typeof ZGetEnrolled>;
