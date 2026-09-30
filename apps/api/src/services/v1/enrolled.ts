import type { TPublicApiEnrolledQuery } from '@cio/utils/validation/public-api';

import { getUserEnrolled } from '@api/services/organization';

export async function listEnrolledService(orgId: string, query: TPublicApiEnrolledQuery) {
  const { profileId, ...feedQuery } = query;
  const { items, total, counts } = await getUserEnrolled(orgId, profileId, feedQuery);
  const totalPages = Math.ceil(total / query.limit);

  return {
    data: items,
    pagination: { page: query.page, limit: query.limit, total, totalPages },
    counts
  };
}
