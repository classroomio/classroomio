import * as z from 'zod';

export const ZPublicApiPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number, starting at 1. Default: 1.'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('Items per page, 1-100. Default: 20.')
});
export type TPublicApiPaginationQuery = z.infer<typeof ZPublicApiPaginationQuery>;
