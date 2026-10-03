import type { DbOrTxClient } from '@cio/db/drizzle';
import { getOrgCourseGroups, getEnrollOnlyInLearningPathCourses } from '@cio/db/queries/course';
import {
  addCohortMember,
  getCohortCoursePairsByCohortIds,
  getCourseIdsByCohortIds,
  getExistingCohortMembers
} from '@cio/db/queries/cohort';
import { enrollUsersInCourseGroups, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import {
  bulkInsertDirectCourseGrants,
  getOrgLearningPathsByIds,
  grantCourseAccess
} from '@cio/db/queries/learning-path';
import { ROLE } from '@cio/utils/constants';
import { membershipKey } from '@cio/utils/functions';

import { enrollProfileCore } from '../learning-path/enroll-profile-core';

export interface TInviteEnrollmentParams {
  courseIds: string[];
  cohortIds: string[];
  pathIds: string[];
  organizationId: string;
  profileId: string;
  email: string;
  roleId: number;
  grantedByProfileId?: string;
  assertCapacity?: (organizationId: string, additional: number, tx: DbOrTxClient) => Promise<unknown>;
  ensureCompliance?: (courseIds: string[], profileIds: string[], tx: DbOrTxClient) => Promise<unknown>;
}

export interface TInviteEnrollmentResult {
  enrolledCount: number;
  skippedPathOnlyCourseIds: string[];
  enrolledPathIds: string[];
}

/** No-op capacity check for callers that enforce the student limit themselves. */
async function defaultAssertCapacity(): Promise<void> {}

/**
 * Shared invite enrollment used by the API accept flow and the SSO/token-auth
 * hooks so every entry point creates the same rows. Runs in the caller-supplied
 * transaction. Direct courses skip path-only ids (audit-trailed), cohorts
 * grant COHORT provenance to STUDENT members only, paths always grant to
 * STUDENT members via the core primitive.
 */
export async function enrollOrganizationInviteUserCore(
  tx: DbOrTxClient,
  params: TInviteEnrollmentParams
): Promise<TInviteEnrollmentResult> {
  let enrolledCount = 0;
  let skippedPathOnlyCourseIds: string[] = [];
  const enrolledPathIds: string[] = [];
  const assertCapacity = params.assertCapacity ?? defaultAssertCapacity;
  const ensureCompliance = params.ensureCompliance;

  if (params.courseIds.length > 0) {
    const pathOnlyCourses = await getEnrollOnlyInLearningPathCourses(params.courseIds, tx);
    skippedPathOnlyCourseIds = pathOnlyCourses.map((course) => course.id);
    const pathOnlyIds = new Set(skippedPathOnlyCourseIds);
    const directCourseIds = params.courseIds.filter((courseId) => !pathOnlyIds.has(courseId));

    if (directCourseIds.length > 0) {
      const courseGroupMappings = await getOrgCourseGroups(params.organizationId, directCourseIds, tx);
      const courseGroupIds = courseGroupMappings.map((mapping) => mapping.groupId).filter(Boolean) as string[];

      enrolledCount += await enrollUsersInCourseGroups(
        courseGroupIds,
        [{ profileId: params.profileId, email: params.email }],
        params.roleId,
        tx
      );

      if (params.roleId === ROLE.STUDENT) {
        await bulkInsertDirectCourseGrants(
          {
            groupIds: courseGroupIds,
            profileIds: [params.profileId],
            courseIds: directCourseIds,
            source: 'ORG_AUDIENCE',
            grantedByProfileId: params.grantedByProfileId
          },
          tx
        );
      }

      if (ensureCompliance) {
        await ensureCompliance(directCourseIds, [params.profileId], tx);
      }
    }
  }

  if (params.cohortIds.length > 0) {
    const existingCohortMemberships = await getExistingCohortMembers(
      params.cohortIds.map((cohortId) => ({ cohortId, profileId: params.profileId })),
      tx
    );
    const cohortIdsToInsert = params.cohortIds.filter(
      (cohortId) => !existingCohortMemberships.has(membershipKey(cohortId, params.profileId))
    );

    for (const cohortId of cohortIdsToInsert) {
      await addCohortMember(
        {
          cohortId,
          roleId: params.roleId,
          profileId: params.profileId,
          email: params.email
        },
        tx
      );
    }

    const allCohortCourseIds = await getCourseIdsByCohortIds(params.cohortIds, tx);
    const pathOnly = await getEnrollOnlyInLearningPathCourses(allCohortCourseIds, tx);
    const pathOnlyIds = new Set(pathOnly.map((course) => course.id));
    skippedPathOnlyCourseIds = [...new Set([...skippedPathOnlyCourseIds, ...pathOnlyIds])];
    const allowedCohortCourseIds = allCohortCourseIds.filter((id) => !pathOnlyIds.has(id));
    const courseIdsToEnroll = allowedCohortCourseIds.filter((courseId) => !params.courseIds.includes(courseId));

    if (courseIdsToEnroll.length > 0) {
      const cohortCourseGroups = await getOrgCourseGroups(params.organizationId, courseIdsToEnroll, tx);
      const cohortGroupIds = cohortCourseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];

      enrolledCount += await enrollUsersInCourseGroups(
        cohortGroupIds,
        [{ profileId: params.profileId, email: params.email }],
        params.roleId,
        tx
      );

      if (ensureCompliance) {
        await ensureCompliance(courseIdsToEnroll, [params.profileId], tx);
      }
    }

    if (params.roleId === ROLE.STUDENT && allowedCohortCourseIds.length > 0) {
      // One grant per (cohort, course) so removing the learner from one cohort
      // revokes only that cohort's grants.
      const cohortCoursePairs = await getCohortCoursePairsByCohortIds(params.cohortIds, tx);
      const courseGroups = await getOrgCourseGroups(params.organizationId, allowedCohortCourseIds, tx);
      const groupMemberIdByCourseId = new Map<string, string>();

      for (const entry of courseGroups) {
        if (!entry.groupId) {
          continue;
        }

        const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, params.profileId, tx);

        if (groupMemberId) {
          groupMemberIdByCourseId.set(entry.courseId, groupMemberId);
        }
      }

      for (const pair of cohortCoursePairs) {
        const groupMemberId = groupMemberIdByCourseId.get(pair.courseId);

        if (!groupMemberId) {
          continue;
        }

        await grantCourseAccess(
          {
            groupmemberId: groupMemberId,
            courseId: pair.courseId,
            profileId: params.profileId,
            source: 'COHORT',
            cohortId: pair.cohortId,
            grantedByProfileId: params.grantedByProfileId
          },
          tx
        );
      }
    }
  }

  if (params.pathIds.length > 0) {
    const paths = await getOrgLearningPathsByIds(params.organizationId, params.pathIds, tx);

    for (const path of paths) {
      await enrollProfileCore(
        { id: path.id, sequentialUnlock: path.sequentialUnlock, organizationId: path.organizationId },
        {
          profileId: params.profileId,
          email: params.email,
          roleId: ROLE.STUDENT,
          grantedByProfileId: params.grantedByProfileId
        },
        tx,
        assertCapacity
      );
      enrolledCount += 1;
      enrolledPathIds.push(path.id);
    }
  }

  return { enrolledCount, skippedPathOnlyCourseIds, enrolledPathIds };
}
