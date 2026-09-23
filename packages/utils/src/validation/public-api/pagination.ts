import * as z from 'zod';

export const ZPublicApiPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export type TPublicApiPaginationQuery = z.infer<typeof ZPublicApiPaginationQuery>;
