import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  enrollMember,
  initializeMemberCourseProgress,
  listLearningPathCourses,
  ensureLearningPathCourseGrants
} from '@cio/db/queries/learning-path';
import {
  createOrganizationMember,
  getOrganizationMemberIdByOrgAndProfile,
  getUserOrgRolesMap
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import type { TLearningPathMember } from '@cio/db/types';

export interface EnrollCorePath {
  id: string;
  autoEnroll: boolean;
  sequentialUnlock: boolean;
  organizationId: string;
}

export interface EnrollCoreInput {
  profileId: string;
  email?: string | null;
  roleId: number;
  grantedByProfileId?: string;
}

/**
 * Core enrollment primitive shared by the API sync path and the queued
 * bulk-enroll worker. Ensures org membership (skipping org team members per
 * the self-hosted invariant), upserts the path member, initializes progress
 * cache, and grants path courses when auto-enroll is on.
 *
 * Quota enforcement is injected so the API can fire milestone notifications
 * while the worker uses a silent locked check.
 */
export async function enrollProfileCore(
  path: EnrollCorePath,
  input: EnrollCoreInput,
  tx: DbOrTxClient,
  assertCapacity: (organizationId: string, additionalStudents: number, tx: DbOrTxClient) => Promise<unknown>
): Promise<TLearningPathMember> {
  if (input.roleId === ROLE.STUDENT) {
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, input.profileId, tx);

    if (!orgMemberId) {
      const orgRoles = await getUserOrgRolesMap(input.profileId);
      const isTeamMember = Object.values(orgRoles).some((roleId) => roleId === ROLE.ADMIN || roleId === ROLE.TUTOR);

      if (!isTeamMember) {
        await assertCapacity(path.organizationId, 1, tx);
        await createOrganizationMember(
          {
            organizationId: path.organizationId,
            roleId: ROLE.STUDENT,
            profileId: input.profileId,
            verified: true
          },
          tx
        );
      }
    }
  }

  const member = await enrollMember(
    {
      learningPathId: path.id,
      profileId: input.profileId,
      email: input.email ?? null,
      roleId: input.roleId,
      status: 'NOT_STARTED'
    },
    tx
  );

  const courses = await listLearningPathCourses(path.id, tx);

  await initializeMemberCourseProgress(
    member.id,
    courses.map((course) => ({ id: course.id, order: course.order })),
    path.sequentialUnlock,
    tx
  );

  if (path.autoEnroll) {
    const courseIds = courses.map((course) => course.courseId);
    await ensureLearningPathCourseGrants(path.id, input.profileId, input.grantedByProfileId, tx, courseIds);
  }

  return member;
}
