import { z } from 'zod';

// Pagination schema
export const ZPaginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type TPaginationQuery = z.infer<typeof ZPaginationQuery>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_more: boolean;
  };
}

export function calculatePagination(
  query: TPaginationQuery,
  total: number
): PaginatedResponse<any>['meta'] {
  const total_pages = Math.ceil(total / query.limit);

  return {
    total,
    page: query.page,
    limit: query.limit,
    total_pages,
    has_more: query.page < total_pages
  };
}

// Helper to get pagination parameters from query
export function getPaginationFromQuery(query: Record<string, any>): TPaginationQuery {
  return ZPaginationQuery.parse({
    page: query.page,
    limit: query.limit,
    sort_by: query.sort_by,
    sort_order: query.sort_order
  });
}

// Helper to calculate offset from page and limit
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// Validate sort field against allowed fields
export function validateSortField(
  field: string | undefined,
  allowedFields: string[]
): string | undefined {
  if (!field) return undefined;
  return allowedFields.includes(field) ? field : undefined;
}
