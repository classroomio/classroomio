import * as z from 'zod';

import { ZPublicApiPaginationQuery } from './pagination';

const ZPublicApiCohortStatus = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

export const ZPublicApiCohortParam = z.object({
  cohortId: z.string().uuid()
});
export type TPublicApiCohortParam = z.infer<typeof ZPublicApiCohortParam>;

export const ZPublicApiCohortsQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional().describe('Matches name or description.'),
  status: ZPublicApiCohortStatus.optional(),
  sortBy: z
    .enum(['createdAt', 'name', 'courses', 'students', 'status'])
    .default('createdAt')
    .describe('courses and students sort on courseCount and studentCount. Default: createdAt.'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Default: desc.')
});
export type TPublicApiCohortsQuery = z.infer<typeof ZPublicApiCohortsQuery>;

export const ZPublicApiCreateCohort = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional()
});
export type TPublicApiCreateCohort = z.infer<typeof ZPublicApiCreateCohort>;

export const ZPublicApiUpdateCohort = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional().describe('Send null to clear it.'),
    coverImage: z.string().url().nullable().optional().describe('Send null to clear it.'),
    status: ZPublicApiCohortStatus.optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TPublicApiUpdateCohort = z.infer<typeof ZPublicApiUpdateCohort>;
