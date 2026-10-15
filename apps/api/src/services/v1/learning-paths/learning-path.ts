import type {
  TPublicApiCreateLearningPath,
  TPublicApiLearningPathParam,
  TPublicApiLearningPathsQuery,
  TPublicApiUpdateLearningPath
} from '@cio/utils/validation/public-api';

import { ROLE } from '@cio/utils/constants';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getMemberByPathAndProfile, listLearningPathCourses } from '@cio/db/queries/learning-path';
import {
  assertCanManageLearningPath,
  createLearningPathService,
  deleteLearningPathService,
  listOrgLearningPaths,
  resolveLearningPath,
  updateLearningPathService
} from '@api/services/learning-path/learning-path';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TLearningPath } from '@cio/db/types';

/** Rejects key-less callers; every v1 call acts as the key creator. */
export function requireV1Actor(actorId: string | null): string {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  return actorId;
}

/**
 * The key creator's real org role. API keys never escalate: a demoted creator
 * immediately loses the rights their key used to have.
 */
export async function resolveV1OrgRoles(orgId: string, actorId: string): Promise<Record<string, number>> {
  const roleId = await getOrganizationMemberRoleId(orgId, actorId);

  if (roleId === null) {
    throw new AppError('Not a member of this organization', ErrorCodes.UNAUTHORIZED, 403);
  }

  return { [orgId]: roleId };
}

/** Resolves a path (UUID or public id) and 404s unless it belongs to the key's organization. */
export async function assertLearningPathBelongsToOrganization(orgId: string, pathId: string): Promise<TLearningPath> {
  const path = await resolveLearningPath(pathId);

  if (!path || path.organizationId !== orgId) {
    throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
  }

  return path;
}

/**
 * Path reads need an org admin, an assigned path tutor, or any active path
 * member. Writers need a path tutor or org admin (assertCanManageLearningPath,
 * the same rule as learningPathTeamMiddleware).
 */
export async function assertLearningPathReadAccess(
  path: TLearningPath,
  actorId: string,
  orgRoles: Record<string, number>
): Promise<void> {
  if (orgRoles[path.organizationId] === ROLE.ADMIN) {
    return;
  }

  const member = await getMemberByPathAndProfile(path.id, actorId);

  if (!member) {
    throw new AppError('Not enrolled in this learning path', ErrorCodes.UNAUTHORIZED, 403);
  }
}

/** Lists org paths as the key creator (admins see all, tutors see assigned). */
export async function listLearningPathsService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiLearningPathsQuery
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);

  return listOrgLearningPaths(orgId, resolvedActorId, orgRoles, {
    page: query.page,
    limit: query.limit,
    search: query.search
  });
}

/** Reads one org path with ordered courses; members, tutors and admins only. */
export async function getLearningPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);
  await assertLearningPathReadAccess(path, resolvedActorId, orgRoles);

  const courses = await listLearningPathCourses(path.id);

  return {
    ...path,
    courseIds: courses.map((course) => course.courseId),
    courses
  };
}

/** Creates an unpublished path with cost in one transaction; org admins only. */
export async function createPublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateLearningPath
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);

  if (orgRoles[orgId] !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can create learning paths', ErrorCodes.UNAUTHORIZED, 403);
  }

  // Cost lands in the same insert (and transaction) as the path itself.
  return createLearningPathService(
    orgId,
    resolvedActorId,
    {
      name: payload.name,
      description: payload.description,
      ...(payload.cost !== undefined ? { cost: payload.cost } : {})
    },
    orgRoles
  );
}

/** Deletes an org path; org admins only. */
export async function deletePublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);

  // Deleting is org-admin only (path tutors can manage but not delete), the
  // same rule deleteLearningPathService enforces for the dashboard.
  if (orgRoles[orgId] !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can delete learning paths', ErrorCodes.UNAUTHORIZED, 403);
  }

  return deleteLearningPathService(path.id, orgRoles);
}

/** Updates an org path (certificate changes need a certificates plan); path tutors and org admins only. */
export async function updatePublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  payload: TPublicApiUpdateLearningPath
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);
  await assertCanManageLearningPath(path, resolvedActorId, orgRoles);

  return updateLearningPathService(path.id, resolvedActorId, payload, orgRoles);
}
