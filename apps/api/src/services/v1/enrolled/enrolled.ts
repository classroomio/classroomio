import type { TPublicApiEnrolledQuery } from '@cio/utils/validation/public-api';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getUserEnrolled } from '@api/services/organization';

/**
 * The key creator's own enrolled feed. Any org member may read their own
 * data; the profile always comes from the key actor, never a query param.
 */
export async function listEnrolledService(orgId: string, actorId: string | null, query: TPublicApiEnrolledQuery) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const roleId = await getOrganizationMemberRoleId(orgId, actorId);

  if (roleId === null) {
    throw new AppError('Not a member of this organization', ErrorCodes.UNAUTHORIZED, 403);
  }

  const { items, total, counts } = await getUserEnrolled(orgId, actorId, query);
  const totalPages = Math.ceil(total / query.limit);

  return {
    data: items,
    pagination: { page: query.page, limit: query.limit, total, totalPages },
    counts
  };
}
