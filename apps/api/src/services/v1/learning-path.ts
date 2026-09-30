import type {
  TPublicApiCreateLearningPath,
  TPublicApiLearningPathCourseParam,
  TPublicApiLearningPathParam,
  TPublicApiLearningPathsQuery,
  TPublicApiReorderPathCourses,
  TPublicApiUpdateLearningPath
} from '@cio/utils/validation/public-api';
import type { TAddLearningPathCourse } from '@cio/utils/validation/learning-path';

import { ROLE } from '@cio/utils/constants';
import {
  createLearningPathService,
  deleteLearningPathService,
  listOrgLearningPaths,
  resolveLearningPath,
  updateLearningPathService
} from '@api/services/learning-path/learning-path';
import {
  addCoursesToPathService,
  removeCourseFromPathService,
  reorderPathCoursesService
} from '@api/services/learning-path/course-management';
import { listLearningPathCourses, listLearningPathMembers } from '@cio/db/queries/learning-path';
import { AppError, ErrorCodes } from '@api/utils/errors';

const ADMIN_ROLES = (orgId: string) => ({ [orgId]: ROLE.ADMIN });

function requireV1Actor(actorId: string | null): string {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  return actorId;
}

async function assertPathBelongsToOrganization(orgId: string, pathId: string) {
  const path = await resolveLearningPath(pathId);

  if (!path || path.organizationId !== orgId) {
    throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
  }

  return path;
}

export async function listLearningPathsService(orgId: string, query: TPublicApiLearningPathsQuery) {
  return listOrgLearningPaths(orgId, '', ADMIN_ROLES(orgId), {
    page: query.page,
    limit: query.limit,
    search: query.search
  });
}

export async function getLearningPathService(orgId: string, params: TPublicApiLearningPathParam) {
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);
  const courses = await listLearningPathCourses(path.id);

  return {
    ...path,
    courseIds: courses.map((course) => course.courseId),
    courses
  };
}

export async function createPublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateLearningPath
) {
  const resolvedActorId = requireV1Actor(actorId);

  const created = await createLearningPathService(
    orgId,
    resolvedActorId,
    {
      name: payload.name,
      description: payload.description
    },
    ADMIN_ROLES(orgId)
  );

  if (payload.cost === undefined) {
    return created;
  }

  return updateLearningPathService(created.id, resolvedActorId, { cost: payload.cost }, ADMIN_ROLES(orgId));
}

export async function deletePublicApiLearningPathService(orgId: string, params: TPublicApiLearningPathParam) {
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);

  return deleteLearningPathService(path.id, ADMIN_ROLES(orgId));
}

export async function updatePublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  payload: TPublicApiUpdateLearningPath
) {
  const resolvedActorId = requireV1Actor(actorId);
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);

  return updateLearningPathService(path.id, resolvedActorId, payload, ADMIN_ROLES(orgId));
}

export async function listPublicApiLearningPathStudentsService(orgId: string, params: TPublicApiLearningPathParam) {
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);
  // Ownership is asserted above and the caller holds an org API key, so read
  // the roster directly instead of re-running the dashboard permission check.
  const members = await listLearningPathMembers(path.id, {
    page: 1,
    limit: 100,
    roleId: ROLE.STUDENT
  });

  return members.data;
}

export async function reorderPublicApiPathCoursesService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  payload: TPublicApiReorderPathCourses
) {
  const resolvedActorId = requireV1Actor(actorId);
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);

  return reorderPathCoursesService(path.id, payload.courseIds, resolvedActorId, ADMIN_ROLES(orgId));
}

export async function addCoursesToPublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  payload: TAddLearningPathCourse
) {
  const resolvedActorId = requireV1Actor(actorId);
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);

  return addCoursesToPathService(path.id, payload, resolvedActorId, ADMIN_ROLES(orgId));
}

export async function removeCourseFromPublicApiPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathCourseParam
) {
  const resolvedActorId = requireV1Actor(actorId);
  const path = await assertPathBelongsToOrganization(orgId, params.pathId);

  return removeCourseFromPathService(path.id, params.courseId, resolvedActorId, ADMIN_ROLES(orgId));
}
