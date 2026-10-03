import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  enrollBulkMember,
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
import { env } from '../../config/env';

export interface EnrollCorePath {
  id: string;
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
 * bulk-enroll worker. Ensures org membership (skipping org team members only
 * on self-hosted installs), upserts the path member, initializes progress
 * cache, and always grants path courses to STUDENT members. Tutors get the
 * path membership and progress cache but no course grants.
 *
 * Quota enforcement is injected so the API can fire milestone notifications
 * while the worker uses a silent locked check.
 */
export async function enrollProfileCore(
  path: EnrollCorePath,
  input: EnrollCoreInput,
  tx: DbOrTxClient,
  assertCapacity: (organizationId: string, additionalStudents: number, tx: DbOrTxClient) => Promise<unknown>
): Promise<TLearningPathMember>;
export async function enrollProfileCore(
  path: EnrollCorePath,
  input: EnrollCoreInput,
  tx: DbOrTxClient,
  assertCapacity: (organizationId: string, additionalStudents: number, tx: DbOrTxClient) => Promise<unknown>,
  options: { enqueuedAt: string }
): Promise<TLearningPathMember | null>;
export async function enrollProfileCore(
  path: EnrollCorePath,
  input: EnrollCoreInput,
  tx: DbOrTxClient,
  assertCapacity: (organizationId: string, additionalStudents: number, tx: DbOrTxClient) => Promise<unknown>,
  options?: { enqueuedAt?: string }
): Promise<TLearningPathMember | null> {
  const member = options?.enqueuedAt
    ? await enrollBulkMember(
        {
          learningPathId: path.id,
          profileId: input.profileId,
          email: input.email ?? null,
          roleId: input.roleId,
          status: 'NOT_STARTED'
        },
        options.enqueuedAt,
        tx
      )
    : await enrollMember(
        {
          learningPathId: path.id,
          profileId: input.profileId,
          email: input.email ?? null,
          roleId: input.roleId,
          status: 'NOT_STARTED'
        },
        tx
      );

  // A removal that landed after the bulk enqueue stands: report, don't resurrect.
  if (!member) {
    return null;
  }

  if (member.roleId === ROLE.STUDENT) {
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, input.profileId, tx);

    if (!orgMemberId) {
      // Single-org self-hosted installs never enroll an org team member as a
      // student; cloud tenancy allows both (admin of one org, student of
      // another), so the team check only applies when self-hosted.
      const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
      let isTeamMemberElsewhere = false;

      if (isSelfHosted) {
        const orgRoles = await getUserOrgRolesMap(input.profileId, tx);
        isTeamMemberElsewhere = Object.values(orgRoles).some(
          (roleId) => roleId === ROLE.ADMIN || roleId === ROLE.TUTOR
        );
      }

      if (!isTeamMemberElsewhere) {
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

  const courses = await listLearningPathCourses(path.id, tx);

  await initializeMemberCourseProgress(
    member.id,
    courses.map((course) => ({ id: course.id, order: course.order })),
    path.sequentialUnlock,
    tx
  );

  if (member.roleId === ROLE.STUDENT) {
    const courseIds = courses.map((course) => course.courseId);
    await ensureLearningPathCourseGrants(path.id, input.profileId, input.grantedByProfileId, tx, courseIds);
  }

  return member;
}
