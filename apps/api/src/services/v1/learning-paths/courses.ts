import type {
  TPublicApiAddLearningPathCourses,
  TPublicApiLearningPathCourseParam,
  TPublicApiLearningPathParam,
  TPublicApiReorderPathCourses
} from '@cio/utils/validation/public-api';

import {
  addCoursesToPathService,
  removeCourseFromPathService,
  reorderPathCoursesService
} from '@api/services/learning-path/course-management';

import { assertLearningPathBelongsToOrganization, requireV1Actor, resolveV1OrgRoles } from './learning-path';
import { assertCanManageLearningPath } from '@api/services/learning-path/learning-path';

/** Reorders an org path's courses; path tutors and org admins only. */
export async function reorderPublicApiPathCoursesService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  payload: TPublicApiReorderPathCourses
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);
  await assertCanManageLearningPath(path, resolvedActorId, orgRoles);

  return reorderPathCoursesService(path.id, payload.courseIds, resolvedActorId, orgRoles);
}

/** Adds courses to an org path, granting them to student members; path tutors and org admins only. */
export async function addCoursesToPublicApiLearningPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathParam,
  payload: TPublicApiAddLearningPathCourses
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);
  await assertCanManageLearningPath(path, resolvedActorId, orgRoles);

  return addCoursesToPathService(path.id, payload, resolvedActorId, orgRoles);
}

/** Removes a course from an org path (grants and progress kept); path tutors and org admins only. */
export async function removeCourseFromPublicApiPathService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearningPathCourseParam
) {
  const resolvedActorId = requireV1Actor(actorId);
  const orgRoles = await resolveV1OrgRoles(orgId, resolvedActorId);
  const path = await assertLearningPathBelongsToOrganization(orgId, params.pathId);
  await assertCanManageLearningPath(path, resolvedActorId, orgRoles);

  return removeCourseFromPathService(path.id, params.courseId, resolvedActorId, orgRoles);
}
