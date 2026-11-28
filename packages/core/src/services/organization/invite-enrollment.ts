import { type DbOrTxClient } from '@cio/db/drizzle';
import type { TCohortMember } from '@cio/db/queries/cohort';
import { addCohortMember, getCourseIdsByCohortIds, getExistingCohortMembers } from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { enrollUsersInCourseGroups } from '@cio/db/queries/group';
import type { TCourseCompletionRecord, TGroupmember } from '@cio/db/types';

export type TInviteEnrollment = {
  enrolledMembers: TGroupmember[];
  complianceRecords: TCourseCompletionRecord[];
  cohortMembers: TCohortMember[];
};

export type TInviteEnrollmentParams = {
  courseIds: string[];
  cohortIds: string[];
  profileId: string;
  email: string;
  roleId: number;
};

export type TInviteEnrollmentDeps = {
  ensureComplianceEnrollmentRecords?: (
    courseIds: string[],
    profileIds: string[],
    dbClient?: DbOrTxClient
  ) => Promise<{ createdRecords: TCourseCompletionRecord[] }>;
};

/**
 * Enrols the profile in the given courses and in the given cohorts plus their courses, linking email-only rows
 * instead of inserting duplicates. Runs on `dbClient`; the caller handles post-commit side effects.
 */
export async function enrollOrganizationInviteUserCore(
  dbClient: DbOrTxClient,
  params: TInviteEnrollmentParams,
  deps: TInviteEnrollmentDeps = {}
): Promise<TInviteEnrollment> {
  const enrolledMembers: TGroupmember[] = [];
  const complianceRecords: TCourseCompletionRecord[] = [];
  const cohortMembers: TCohortMember[] = [];

  try {
    if (params.courseIds.length > 0) {
      const courseGroupMappings = await getCourseGroupIds(params.courseIds, dbClient);
      const courseGroupIds = courseGroupMappings.map((mapping) => mapping.groupId).filter(Boolean) as string[];

      const courseMembers = await enrollUsersInCourseGroups(
        courseGroupIds,
        [{ profileId: params.profileId, email: params.email }],
        params.roleId,
        dbClient
      );
      enrolledMembers.push(...courseMembers);
      if (deps.ensureComplianceEnrollmentRecords) {
        const enrollment = await deps.ensureComplianceEnrollmentRecords(params.courseIds, [params.profileId], dbClient);
        complianceRecords.push(...enrollment.createdRecords);
      }
    }

    if (params.cohortIds.length > 0) {
      const existingCohortMemberships = await getExistingCohortMembers(
        params.cohortIds.map((cohortId) => ({ cohortId, profileId: params.profileId })),
        dbClient
      );
      const cohortIdsToInsert = params.cohortIds.filter(
        (cohortId) => !existingCohortMemberships.has(`${cohortId}:${params.profileId}`)
      );

      for (const cohortId of cohortIdsToInsert) {
        const cohortMember = await addCohortMember(
          {
            cohortId,
            roleId: params.roleId,
            profileId: params.profileId,
            email: params.email
          },
          dbClient
        );
        cohortMembers.push(cohortMember);
      }

      const cohortCourseIds = await getCourseIdsByCohortIds(params.cohortIds, dbClient);
      const courseIdsToEnroll = cohortCourseIds.filter((courseId) => !params.courseIds.includes(courseId));

      if (courseIdsToEnroll.length > 0) {
        const cohortCourseGroups = await getCourseGroupIds(courseIdsToEnroll, dbClient);
        const cohortGroupIds = cohortCourseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];

        const cohortCourseMembers = await enrollUsersInCourseGroups(
          cohortGroupIds,
          [{ profileId: params.profileId, email: params.email }],
          params.roleId,
          dbClient
        );
        enrolledMembers.push(...cohortCourseMembers);
        if (deps.ensureComplianceEnrollmentRecords) {
          const enrollment = await deps.ensureComplianceEnrollmentRecords(
            courseIdsToEnroll,
            [params.profileId],
            dbClient
          );
          complianceRecords.push(...enrollment.createdRecords);
        }
      }
    }

    return { enrolledMembers, complianceRecords, cohortMembers };
  } catch (error) {
    console.error('enrollOrganizationInviteUserCore error:', error);
    throw new Error(`Failed to enroll invite user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
