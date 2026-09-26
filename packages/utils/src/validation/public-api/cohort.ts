import * as z from 'zod';

export const ZPublicApiCohortParam = z.object({
  cohortId: z.string().uuid()
});
export type TPublicApiCohortParam = z.infer<typeof ZPublicApiCohortParam>;

export const ZPublicApiCreateCohort = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional()
});
export type TPublicApiCreateCohort = z.infer<typeof ZPublicApiCreateCohort>;

export const ZPublicApiUpdateCohort = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    coverImage: z.string().url().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TPublicApiUpdateCohort = z.infer<typeof ZPublicApiUpdateCohort>;
