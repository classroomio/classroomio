import type { TPublicApiLearningPathParam, TPublicApiPathMembersQuery } from '@cio/utils/validation/public-api';
import { assertCanManageLearningPath } from '../../learning-path/learning-path';
import { listLearningPathMembers } from '@cio/db/queries/learning-path';

import { assertLearningPathBelongsToOrganization, requireV1Actor, resolveV1OrgRoles } from './learning-path';

/** Paged path roster (page, limit, search, roleId); tutors and admins only. */
export async function listPublicApiLearningPathMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  query: TPublicApiPathMembersQuery
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);
  await assertCanManageLearningPath(path, resolvedActorId, orgRoles);

  const members = await listLearningPathMembers(path.id, {
    page: query.page,
    limit: query.limit,
    search: query.search,
    roleId: query.roleId
  });

  return members;
}
