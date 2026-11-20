import { emitCohortMemberWebhookEvent, emitOrganizationMemberWebhookEvent } from '@cio/core/services/webhook/emit';
import type { TOrganizationmember } from '@cio/db/types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { isUniqueConstraintViolation } from '@cio/utils/errors';
import {
  type TCreateCohort,
  type TUpdateCohort,
  type TAddCourseToCohort,
  type TAddCohortMembers,
  type TUpdateCohortMember,
  type TCreateCohortNewsfeed,
  type TUpdateCohortNewsfeed,
  type TUpdateCohortReaction,
  type TCreateCohortNewsfeedComment
} from '@cio/utils/validation/cohort';
import {
  addCourseToCohort,
  addCohortMember,
  countCohortNewsfeedComments,
  countCohortsByOrgForProfile,
  countCoursesByCohort,
  createCohortWithCreatorMembership,
  createCohortNewsfeed as createCohortNewsfeedQuery,
  createCohortNewsfeedComment as createCohortNewsfeedCommentQuery,
  deleteCohort as deleteCohortQuery,
  deleteCohortNewsfeed as deleteCohortNewsfeedQuery,
  deleteCohortNewsfeedComment as deleteCohortNewsfeedCommentQuery,
  getEnrolledCohortsByProfile,
  getCohortById,
  isOrgAdminByCohortId,
  getCohortCoursePairsByCohortIds,
  getCohortMemberByEmail,
  getCohortMemberById,
  getCohortMemberByProfileId,
  getCohortMembers,
  getCohortNewsfeed,
  getCohortNewsfeedById,
  getCohortNewsfeedCommentById,
  getCohortNewsfeedComments,
  getCohortsByOrg,
  getCohortsByOrgForProfile,
  getCoursesByCohort,
  getCohortMemberRole,
  isCohortCourse,
  isCohortMember,
  listCohortEnrollmentMembers,
  removeCourseFromCohort,
  removeCohortMember,
  updateCohort as updateCohortQuery,
  updateCohortMember as updateCohortMemberQuery,
  updateCohortNewsfeed as updateCohortNewsfeedQuery,
  updateCohortNewsfeedReaction,
  getPaginatedCohortPeople,
  type PaginatedCohortPeopleOptions,
  type TCohortListFilters,
  type TCohortListPage
} from '@cio/db/queries/cohort';
import { getAddableOrgCourses, getCourseGroupIds, getCourseOrgInfo } from '@cio/db/queries/course';
import { getGroupMemberByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { grantCourseAccess, revokeCohortGrants } from '@cio/db/queries/learning-path';
import { recordDirectCourseGrantsBulk } from '@api/services/course/enrollment-grants';
import { getProfileByEmail } from '@cio/db/queries/auth';
import {
  getOrgMembersByProfileIds,
  getOrganizationMemberIdByOrgAndProfile,
  insertOrganizationMembersOnConflictDoNothing,
  listActiveOrganizationRoles
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import type { TAddableCoursesQuery } from '@cio/utils/validation/course';
import { assertCourseAllowsDirectStudentAdd, filterOutPathOnlyCourseIds } from '@api/services/course/path-gate';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { assertStudentCapacityOrThrow, notifyStudentMilestone } from '../organization/student-limit';
import type { StudentMilestoneNotification } from '../organization/student-limit';
import type { TGroupmember } from '@cio/db/types';
import type { TEventSource } from '@cio/core/services/posthog';
import { captureLearnersEnrolled } from '@api/services/product-events';

type CohortMemberEnrollment = {
  profileId: string;
  email: string | null;
  roleId: number;
};

type CohortCourseGroup = {
  courseId: string;
  groupId: string;
};

function isCohortStaffRole(roleId: number) {
  return roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
}

async function listCohortCourseGroups(cohortId: string): Promise<CohortCourseGroup[]> {
  const cohortCourses = await getCoursesByCohort(cohortId);
  const courseIds = cohortCourses.map((row) => row.course.id);
  const groups = await getCourseGroupIds(courseIds);

  return groups.flatMap((row) => (row.groupId ? [{ courseId: row.courseId, groupId: row.groupId }] : []));
}

type CohortStudentEnrollment = {
  enrolled: number;
  milestone: StudentMilestoneNotification | null;
  enrolledMembers: TGroupmember[];
  createdOrganizationMembers: TOrganizationmember[];
};

const NO_COHORT_STUDENT_ENROLLMENT: CohortStudentEnrollment = {
  enrolled: 0,
  milestone: null,
  enrolledMembers: [],
  createdOrganizationMembers: []
};

async function announceCohortStudentEnrollment(
  organizationId: string,
  source: TEventSource,
  enrollment: CohortStudentEnrollment
) {
  captureLearnersEnrolled(enrollment.enrolledMembers, 'cohort', source);

  for (const createdMember of enrollment.createdOrganizationMembers) {
    await emitOrganizationMemberWebhookEvent('organization.member.added', organizationId, createdMember);
  }

  if (enrollment.milestone) {
    notifyStudentMilestone(enrollment.milestone).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }
}

/**
 * Enrolls cohort STUDENT members into the groups of the given (non-path-only)
 * courses with COHORT grants. Inside a caller's transaction it returns the
 * enrollment for the caller to announce after commit; standalone, it
 * announces it here after commit.
 */
async function enrollCohortStudentsInGroups(
  organizationId: string,
  groupIds: string[],
  members: CohortMemberEnrollment[],
  courseIds: string[],
  cohortId: string,
  source: TEventSource,
  dbClient?: DbOrTxClient
): Promise<CohortStudentEnrollment> {
  const { allowedCourseIds } = await filterOutPathOnlyCourseIds(courseIds, dbClient ?? db);

  if (allowedCourseIds.length === 0) {
    return NO_COHORT_STUDENT_ENROLLMENT;
  }

  const studentMembers = members.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const uniqueGroupIds = [...new Set(groupIds)];

  if (studentMembers.length === 0 || uniqueGroupIds.length === 0) {
    return NO_COHORT_STUDENT_ENROLLMENT;
  }

  const studentProfileIds = studentMembers
    .map((member) => member.profileId)
    .filter((profileId): profileId is string => Boolean(profileId));
  const existingMembers = await getOrgMembersByProfileIds(organizationId, studentProfileIds, dbClient ?? db);
  const existingMemberProfileIds = new Set(existingMembers.map((member) => member.profileId));
  const newStudentProfileIds = new Set(
    studentProfileIds.filter((profileId) => !existingMemberProfileIds.has(profileId))
  );

  const organizationMemberRows = studentMembers.map((member) => ({
    organizationId,
    roleId: ROLE.STUDENT,
    profileId: member.profileId,
    email: member.email?.trim() || undefined,
    verified: true
  }));

  const groupMemberRows = uniqueGroupIds.flatMap((groupId) =>
    studentMembers.map((member) => ({
      groupId,
      roleId: ROLE.STUDENT,
      profileId: member.profileId,
      email: member.email?.trim() || undefined
    }))
  );

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;
  let createdOrganizationMembers: TOrganizationmember[] = [];

  let enrolledMembers: TGroupmember[] = [];

  const run = async (tx: DbOrTxClient) => {
    studentMilestoneNotification = await assertStudentCapacityOrThrow(organizationId, newStudentProfileIds.size, tx, {
      deferNotification: true
    });
    createdOrganizationMembers = await insertOrganizationMembersOnConflictDoNothing(organizationMemberRows, tx);
    enrolledMembers = await insertGroupMembersOnConflictDoNothing(groupMemberRows, tx);
    await recordDirectCourseGrantsBulk(
      {
        groupIds: uniqueGroupIds,
        profileIds: studentProfileIds,
        courseIds: allowedCourseIds,
        source: 'COHORT',
        cohortId
      },
      tx
    );
  };

  if (dbClient && dbClient !== db) {
    await run(dbClient);
  } else {
    await db.transaction(run);
  }

  const enrollment: CohortStudentEnrollment = {
    enrolled: groupMemberRows.length,
    milestone: studentMilestoneNotification,
    enrolledMembers,
    createdOrganizationMembers
  };

  if (dbClient && dbClient !== db) {
    return enrollment;
  }

  await announceCohortStudentEnrollment(organizationId, source, enrollment);

  return { ...enrollment, milestone: null };
}

async function enrollCohortStaffInCourseGroups(
  organizationId: string,
  groupIds: string[],
  members: CohortMemberEnrollment[],
  dbClient: DbOrTxClient
) {
  const cohortStaff = members.filter((member) => member.profileId && isCohortStaffRole(member.roleId));
  const uniqueGroupIds = [...new Set(groupIds)];

  if (uniqueGroupIds.length === 0 || cohortStaff.length === 0) {
    return;
  }

  const profileIds = cohortStaff.map((member) => member.profileId);
  const organizationRoles = await listActiveOrganizationRoles(organizationId, profileIds, dbClient);
  const organizationStaffIds = new Set(
    organizationRoles.filter((member) => isCohortStaffRole(member.roleId)).map((member) => member.profileId)
  );
  const staff = cohortStaff.filter((member) => organizationStaffIds.has(member.profileId));

  if (staff.length === 0) {
    return;
  }

  const membershipRows = uniqueGroupIds.flatMap((groupId) =>
    staff.map((member) => ({
      groupId,
      roleId: member.roleId,
      profileId: member.profileId,
      email: member.email ?? undefined
    }))
  );

  await insertGroupMembersOnConflictDoNothing(membershipRows, dbClient);
}

// ─── Cohort CRUD ─────────────────────────────────────────────────────────────

export async function createCohort(organizationId: string, profileId: string, data: TCreateCohort) {
  try {
    const description = data.description?.trim() || `A cohort for ${data.name}`;

    return createCohortWithCreatorMembership(
      {
        organizationId,
        createdByProfileId: profileId,
        name: data.name,
        description,
        coverImage: data.coverImage
      },
      profileId
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create cohort',
      ErrorCodes.COHORT_CREATE_FAILED,
      500
    );
  }
}

export async function getCohort(cohortId: string) {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }
    return cohort;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get cohort',
      ErrorCodes.COHORT_NOT_FOUND,
      500
    );
  }
}

export async function listOrgCohorts(organizationId: string, profileId: string) {
  try {
    return getCohortsByOrgForProfile(organizationId, profileId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list cohorts',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function listOrgCohortsPage(
  organizationId: string,
  profileId: string,
  query: TCohortListPage & TCohortListFilters
) {
  const { page, limit, ...filters } = query;
  const [items, total] = await Promise.all([
    getCohortsByOrgForProfile(organizationId, profileId, { page, limit }, filters),
    countCohortsByOrgForProfile(organizationId, profileId, filters)
  ]);

  return { items, total };
}

export async function updateCohort(cohortId: string, data: TUpdateCohort) {
  try {
    const updated = await updateCohortQuery(cohortId, data);
    if (!updated) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update cohort',
      ErrorCodes.COHORT_UPDATE_FAILED,
      500
    );
  }
}

export async function deleteCohort(cohortId: string) {
  try {
    const deleted = await deleteCohortQuery(cohortId);
    if (!deleted) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete cohort',
      ErrorCodes.COHORT_DELETE_FAILED,
      500
    );
  }
}

// ─── Cohort Members ──────────────────────────────────────────────────────────

export async function listCohortMembers(cohortId: string) {
  try {
    return getCohortMembers(cohortId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list cohort members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Records COHORT provenance grants for a STUDENT profile across a cohort's courses. Tutors and admins are skipped: staff access is role-based.
 * The caller enrolls the groupmember rows; this records why, both so People
 * views can show the cohort source and permission checks can tell cohort
 * access apart from standalone access. Idempotent via the grant upsert.
 */
export async function ensureCohortCourseGrants(
  cohortId: string,
  profileId: string,
  grantedByProfileId: string | undefined,
  dbClient: DbOrTxClient,
  courseIds: string[]
): Promise<void> {
  if (courseIds.length === 0) {
    return;
  }

  const cohortMember = await getCohortMemberByProfileId(cohortId, profileId, dbClient);

  if (!cohortMember || cohortMember.roleId !== ROLE.STUDENT) {
    return;
  }

  const { allowedCourseIds } = await filterOutPathOnlyCourseIds(courseIds, dbClient);

  if (allowedCourseIds.length === 0) {
    return;
  }

  const courseGroups = await getCourseGroupIds(allowedCourseIds, dbClient);

  for (const entry of courseGroups) {
    if (!entry.groupId) {
      continue;
    }

    const groupMember = await getGroupMemberByGroupAndProfile(entry.groupId, profileId, dbClient);

    // Grants are a STUDENT ledger: a TUTOR/ADMIN row in the course group
    // already has access through its role and must not carry a COHORT grant.
    if (groupMember?.roleId === ROLE.STUDENT) {
      await grantCourseAccess(
        {
          groupmemberId: groupMember.id,
          courseId: entry.courseId,
          profileId,
          source: 'COHORT',
          cohortId,
          grantedByProfileId
        },
        dbClient
      );
    }
  }
}

export async function listPaginatedCohortPeople(cohortId: string, query: PaginatedCohortPeopleOptions) {
  try {
    const { items, total } = await getPaginatedCohortPeople(cohortId, query);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit)
      }
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list cohort people',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function addCohortMembers(
  cohortId: string,
  data: TAddCohortMembers,
  actorProfileId: string | null = null
) {
  const { results, skippedPathOnlyCourseIds } = await addCohortMembersWithCourseGate(
    cohortId,
    data,
    'dashboard',
    actorProfileId
  );

  const added = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

  return { added, errors, skippedPathOnlyCourseIds };
}

/** One settled result per `data.members` entry, in request order. */
export async function addCohortMembersSettled(
  cohortId: string,
  data: TAddCohortMembers,
  source: TEventSource = 'dashboard',
  actorProfileId: string | null = null
) {
  const { results } = await addCohortMembersWithCourseGate(cohortId, data, source, actorProfileId);

  return results;
}

/**
 * Adds cohort members, enrolling students only in the cohort courses that are
 * not path-only, and reports the path-only courses it skipped.
 */
async function addCohortMembersWithCourseGate(
  cohortId: string,
  data: TAddCohortMembers,
  source: TEventSource,
  actorProfileId: string | null
) {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const courseGroups = await listCohortCourseGroups(cohortId);
    const { allowedCourseIds, skippedPathOnlyCourseIds } = await filterOutPathOnlyCourseIds(
      courseGroups.map((courseGroup) => courseGroup.courseId)
    );
    const allowedCourseIdSet = new Set(allowedCourseIds);
    const courseGroupIds = courseGroups.map((courseGroup) => courseGroup.groupId);
    const studentCourseGroupIds = courseGroups
      .filter((courseGroup) => allowedCourseIdSet.has(courseGroup.courseId))
      .map((courseGroup) => courseGroup.groupId);

    const results = await Promise.allSettled(
      data.members.map(async ({ profileId: providedProfileId, email, roleId }) => {
        const profile = !providedProfileId && email ? await getProfileByEmail(email) : null;
        const profileId = providedProfileId ?? profile?.id ?? null;
        const normalizedEmail = email?.toLowerCase().trim() ?? profile?.email ?? null;

        if (profileId || normalizedEmail) {
          const existing = profileId
            ? await getCohortMemberByProfileId(cohortId, profileId)
            : await getCohortMemberByEmail(cohortId, normalizedEmail!);
          if (existing) {
            throw new AppError(
              `${email ?? profileId} is already a member of this cohort`,
              ErrorCodes.MEMBER_ALREADY_IN_COHORT,
              409
            );
          }
        }

        if (!profileId && !email) {
          throw new AppError(
            'Either profileId or email must be provided for each member',
            ErrorCodes.VALIDATION_ERROR,
            400
          );
        }

        const transactionResult = await db.transaction(async (tx) => {
          let studentMilestoneNotification: StudentMilestoneNotification | null = null;
          let enrolledMembers: TGroupmember[] = [];
          let createdOrgMembers: TOrganizationmember[] = [];
          const member = await addCohortMember(
            {
              cohortId,
              profileId,
              roleId,
              email: normalizedEmail ?? undefined
            },
            tx
          );

          if (member && member.roleId === ROLE.STUDENT && member.profileId && studentCourseGroupIds.length > 0) {
            const validCourseGroupIds = studentCourseGroupIds;

            const existingOrgMemberId = await getOrganizationMemberIdByOrgAndProfile(
              cohort.organizationId,
              member.profileId,
              tx
            );
            if (!existingOrgMemberId) {
              studentMilestoneNotification = await assertStudentCapacityOrThrow(cohort.organizationId, 1, tx, {
                deferNotification: true
              });
            }

            createdOrgMembers = await insertOrganizationMembersOnConflictDoNothing(
              [
                {
                  organizationId: cohort.organizationId,
                  roleId: ROLE.STUDENT,
                  profileId: member.profileId,
                  email: normalizedEmail ?? undefined,
                  verified: true
                }
              ],
              tx
            );

            enrolledMembers = await insertGroupMembersOnConflictDoNothing(
              validCourseGroupIds.map((groupId) => ({
                groupId,
                roleId: ROLE.STUDENT,
                profileId: member.profileId,
                email: normalizedEmail ?? undefined
              })),
              tx
            );

            await ensureCohortCourseGrants(
              cohortId,
              member.profileId,
              actorProfileId ?? undefined,
              tx,
              allowedCourseIds
            );
          }

          if (member?.profileId && (member.roleId === ROLE.ADMIN || member.roleId === ROLE.TUTOR)) {
            const validCourseGroupIds = courseGroupIds.filter((groupId): groupId is string => Boolean(groupId));

            await enrollCohortStaffInCourseGroups(
              cohort.organizationId,
              validCourseGroupIds,
              [
                {
                  profileId: member.profileId,
                  email: normalizedEmail,
                  roleId: member.roleId
                }
              ],
              tx
            );
          }

          return { member, studentMilestoneNotification, enrolledMembers, createdOrgMembers };
        });

        captureLearnersEnrolled(transactionResult.enrolledMembers, 'cohort', source);

        if (transactionResult.studentMilestoneNotification) {
          notifyStudentMilestone(transactionResult.studentMilestoneNotification).catch((error) => {
            console.error('notifyStudentMilestone error:', error);
          });
        }

        for (const createdOrgMember of transactionResult.createdOrgMembers) {
          await emitOrganizationMemberWebhookEvent(
            'organization.member.added',
            cohort.organizationId,
            createdOrgMember,
            actorProfileId
          );
        }

        if (transactionResult.member) {
          await emitCohortMemberWebhookEvent(
            'cohort.member.added',
            cohort.organizationId,
            cohortId,
            transactionResult.member,
            actorProfileId
          );
        }

        return transactionResult.member;
      })
    );

    return { results, skippedPathOnlyCourseIds };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add cohort members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Removes a member from a cohort and revokes their COHORT grants in one
 * transaction, scoped to the cohort so another cohort's member 404s.
 */
export async function removeCohortMemberService(
  cohortId: string,
  memberId: string,
  actorProfileId: string | null = null
) {
  try {
    const deleted = await db.transaction(async (tx) => {
      const removed = await removeCohortMember(cohortId, memberId, tx);

      if (!removed) {
        throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
      }

      if (removed.profileId) {
        await revokeCohortGrants(removed.cohortId, removed.profileId, tx);
      }

      return removed;
    });

    const cohort = await getCohortById(cohortId);
    if (cohort) {
      await emitCohortMemberWebhookEvent(
        'cohort.member.removed',
        cohort.organizationId,
        cohortId,
        deleted,
        actorProfileId
      );
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to remove cohort member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Changes a member's role, scoped to the cohort so another cohort's member
 * 404s. Course access moves with the role in the same transaction: a member
 * promoted to cohort staff joins the cohort's course groups as staff, a
 * demoted student loses their COHORT grants, and a tutor made a student is
 * enrolled in the cohort's courses like a newly added student.
 */
export async function updateCohortMemberService(cohortId: string, memberId: string, data: TUpdateCohortMember) {
  try {
    const cohort = await getCohortById(cohortId);

    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const staffCourseGroupIds = isCohortStaffRole(data.roleId)
      ? (await listCohortCourseGroups(cohortId)).map((courseGroup) => courseGroup.groupId)
      : [];

    const result = await db.transaction(async (tx) => {
      const member = await getCohortMemberById(cohortId, memberId, tx);

      if (!member) {
        throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
      }

      if (member.roleId === data.roleId) {
        return { updated: member, enrollment: null };
      }

      // Only applies while the role is still the one read above, so grants
      // are never written from a stale role.
      const updated = await updateCohortMemberQuery(cohortId, memberId, { roleId: data.roleId }, tx, member.roleId);

      if (!updated) {
        throw new AppError(
          "This member's role changed while you were editing. Refresh and try again.",
          ErrorCodes.CONFLICT,
          409
        );
      }

      if (!updated.profileId) {
        return { updated, enrollment: null };
      }

      if (!isCohortStaffRole(member.roleId) && isCohortStaffRole(updated.roleId)) {
        await enrollCohortStaffInCourseGroups(
          cohort.organizationId,
          staffCourseGroupIds,
          [{ profileId: updated.profileId, email: updated.email, roleId: updated.roleId }],
          tx
        );
      }

      if (member.roleId === ROLE.STUDENT) {
        await revokeCohortGrants(cohortId, updated.profileId, tx);

        return { updated, enrollment: null };
      }

      if (data.roleId !== ROLE.STUDENT) {
        return { updated, enrollment: null };
      }

      const coursePairs = await getCohortCoursePairsByCohortIds([cohortId], tx);
      const courseIds = coursePairs.map((pair) => pair.courseId);
      const { allowedCourseIds } = await filterOutPathOnlyCourseIds(courseIds, tx);
      const courseGroups = await getCourseGroupIds(allowedCourseIds, tx);
      const groupIds = courseGroups
        .map((courseGroup) => courseGroup.groupId)
        .filter((groupId): groupId is string => Boolean(groupId));
      const student = { profileId: updated.profileId, email: updated.email ?? null, roleId: ROLE.STUDENT };

      const enrollment = await enrollCohortStudentsInGroups(
        cohort.organizationId,
        groupIds,
        [student],
        allowedCourseIds,
        cohortId,
        'dashboard',
        tx
      );

      return { updated, enrollment };
    });

    if (result.enrollment) {
      await announceCohortStudentEnrollment(cohort.organizationId, 'dashboard', result.enrollment);
    }

    return result.updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update cohort member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function getEnrolledCohorts(profileId: string) {
  try {
    return getEnrolledCohortsByProfile(profileId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get enrolled cohorts',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Cohort Courses ──────────────────────────────────────────────────────────

async function seesOnlyPublishedCohortCourses(cohortId: string, profileId: string) {
  const roleId = await getCohortMemberRole(cohortId, profileId);

  return roleId === ROLE.STUDENT;
}

export async function listCohortCoursesPage(cohortId: string, profileId: string, page: TCohortListPage) {
  const onlyPublished = await seesOnlyPublishedCohortCourses(cohortId, profileId);
  const [items, total] = await Promise.all([
    getCoursesByCohort(cohortId, onlyPublished, page),
    countCoursesByCohort(cohortId, onlyPublished)
  ]);

  return { items, total };
}

export async function listCohortCourses(cohortId: string, profileId: string) {
  try {
    const onlyPublished = await seesOnlyPublishedCohortCourses(cohortId, profileId);

    return getCoursesByCohort(cohortId, onlyPublished);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list cohort courses',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Pages the courses this cohort can still add, for the add-courses picker:
 * ACTIVE courses in the cohort's org that are not already in the cohort and
 * not path-only (the add rejects those). Org admins see every course; other
 * cohort team members see the courses they belong to.
 */
export async function listAddableCohortCoursesService(cohortId: string, actorId: string, query: TAddableCoursesQuery) {
  const cohort = await getCohortById(cohortId);

  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  const isOrgAdmin = await isOrgAdminByCohortId(cohortId, actorId);
  const { items, total } = await getAddableOrgCourses({
    orgId: cohort.organizationId,
    memberProfileId: isOrgAdmin ? undefined : actorId,
    excludePathOnly: true,
    excludeCohortId: cohortId,
    search: query.search,
    page: query.page,
    limit: query.limit
  });
  const totalPages = Math.ceil(total / query.limit);

  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages } };
}

export async function addCourseToCohortService(
  cohortId: string,
  data: TAddCourseToCohort,
  source: TEventSource = 'dashboard'
) {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    // Checked before the path-only gate so another org's course reads as
    // missing instead of revealing how it is configured.
    const courseOrg = await getCourseOrgInfo(data.courseId);

    if (!courseOrg || courseOrg.organizationId !== cohort.organizationId) {
      throw new AppError('Course not found in this organization', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    await assertCourseAllowsDirectStudentAdd(data.courseId);

    const { added, enrollment } = await db.transaction(async (tx) => {
      const alreadyAdded = await isCohortCourse(cohortId, data.courseId, tx);

      if (alreadyAdded) {
        throw new AppError('Course is already in this cohort', ErrorCodes.COURSE_ALREADY_IN_COHORT, 409);
      }

      const added = await addCourseToCohort(cohortId, data.courseId, tx);
      const members = await listCohortEnrollmentMembers(cohortId, tx);
      const enrollmentRows = members.flatMap((member) =>
        member.profileId ? [{ profileId: member.profileId, email: member.email, roleId: member.roleId }] : []
      );
      const staffRows = enrollmentRows.filter((member) => isCohortStaffRole(member.roleId));
      const studentRows = enrollmentRows.filter((member) => member.roleId === ROLE.STUDENT);
      const groups = (await getCourseGroupIds([data.courseId], tx))
        .map((courseGroup) => courseGroup.groupId)
        .filter((groupId): groupId is string => Boolean(groupId));

      await enrollCohortStaffInCourseGroups(cohort.organizationId, groups, staffRows, tx);

      if (studentRows.length > 0 && groups.length > 0) {
        const enrollment = await enrollCohortStudentsInGroups(
          cohort.organizationId,
          groups,
          studentRows,
          [data.courseId],
          cohortId,
          source,
          tx
        );

        return { added, enrollment };
      }

      return { added, enrollment: null };
    });

    // Announced only after commit, so a rolled-back add never emails admins.
    if (enrollment) {
      await announceCohortStudentEnrollment(cohort.organizationId, source, enrollment);
    }

    return added;
  } catch (error) {
    if (error instanceof AppError) throw error;

    // Two concurrent adds of the same course: the loser hits the unique link.
    if (isUniqueConstraintViolation(error)) {
      throw new AppError('Course is already in this cohort', ErrorCodes.COURSE_ALREADY_IN_COHORT, 409);
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add course to cohort',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Removes a course from a cohort. Existing grants and progress are kept on
 * purpose; revocation happens when a member is removed, not when a course
 * leaves the cohort.
 */
export async function removeCourseFromCohortService(cohortId: string, courseId: string) {
  try {
    const deleted = await removeCourseFromCohort(cohortId, courseId);
    if (!deleted) {
      throw new AppError('Course not found in cohort', ErrorCodes.NOT_FOUND, 404);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to remove course from cohort',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Cohort Newsfeed ─────────────────────────────────────────────────────────

export async function listCohortNewsfeed(cohortId: string, options: { cursor?: string; limit: number }) {
  try {
    return getCohortNewsfeed(cohortId, options);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list cohort newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function createCohortNewsfeedService(cohortId: string, profileId: string, data: TCreateCohortNewsfeed) {
  try {
    const member = await getCohortMemberByProfileId(cohortId, profileId);
    if (!member) {
      throw new AppError('User is not a member of this cohort', ErrorCodes.COHORT_FORBIDDEN, 403);
    }

    return createCohortNewsfeedQuery({
      cohortId,
      authorId: member.id,
      content: data.content,
      isPinned: data.isPinned ?? false
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create cohort newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateCohortNewsfeedService(cohortId: string, feedId: string, data: TUpdateCohortNewsfeed) {
  try {
    const feed = await getCohortNewsfeedById(cohortId, feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return updateCohortNewsfeedQuery(cohortId, feedId, data);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update cohort newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateCohortNewsfeedReactionService(
  cohortId: string,
  feedId: string,
  data: TUpdateCohortReaction
) {
  try {
    const feed = await getCohortNewsfeedById(cohortId, feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return updateCohortNewsfeedReaction(cohortId, feedId, data.reaction);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update cohort newsfeed reaction',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function deleteCohortNewsfeedService(cohortId: string, feedId: string) {
  try {
    const feed = await getCohortNewsfeedById(cohortId, feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return deleteCohortNewsfeedQuery(cohortId, feedId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete cohort newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Cohort Newsfeed Comments ────────────────────────────────────────────────

async function assertCohortNewsfeedExists(cohortId: string, feedId: string) {
  const feed = await getCohortNewsfeedById(cohortId, feedId);
  if (!feed) {
    throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
  }
}

export async function listCohortNewsfeedCommentsPage(cohortId: string, feedId: string, page: TCohortListPage) {
  await assertCohortNewsfeedExists(cohortId, feedId);

  const [items, total] = await Promise.all([
    getCohortNewsfeedComments(cohortId, feedId, page),
    countCohortNewsfeedComments(cohortId, feedId)
  ]);

  return { items, total };
}

export async function listCohortNewsfeedComments(cohortId: string, feedId: string) {
  try {
    await assertCohortNewsfeedExists(cohortId, feedId);

    return getCohortNewsfeedComments(cohortId, feedId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list cohort newsfeed comments',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function createCohortNewsfeedCommentService(
  cohortId: string,
  feedId: string,
  profileId: string,
  data: TCreateCohortNewsfeedComment
) {
  try {
    const feed = await getCohortNewsfeedById(cohortId, feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    const member = await getCohortMemberByProfileId(feed.cohortId!, profileId);
    if (!member) {
      throw new AppError('User is not a member of this cohort', ErrorCodes.COHORT_FORBIDDEN, 403);
    }
    return createCohortNewsfeedCommentQuery({
      cohortNewsfeedId: feedId,
      authorId: member.id,
      content: data.content
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create cohort newsfeed comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function deleteCohortNewsfeedCommentService(cohortId: string, feedId: string, commentId: number) {
  try {
    const comment = await getCohortNewsfeedCommentById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND, 404);
    }
    const feed = await getCohortNewsfeedById(cohortId, comment.cohortNewsfeedId!);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    if (feed.id !== feedId) {
      throw new AppError('Comment not found', ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND, 404);
    }
    return deleteCohortNewsfeedCommentQuery(feedId, commentId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete cohort newsfeed comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────

async function assertCohortMember(cohortId: string, profileId: string) {
  const member = await isCohortMember(cohortId, profileId);
  if (!member) {
    throw new AppError('You are not a member of this cohort', ErrorCodes.COHORT_FORBIDDEN, 403);
  }
}
