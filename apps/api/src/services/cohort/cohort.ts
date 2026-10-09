import { AppError, ErrorCodes } from '@api/utils/errors';
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
  countCohortMembers,
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
  deleteCohortCourseStaffGrants,
  deleteCohortGrantedGroupMembers,
  insertCohortCourseStaffGrants,
  insertCohortGrantedGroupMembers,
  listCohortCourseStaffGrantsForPairs,
  listCohortGrantedGroupMembers,
  removeCourseFromCohort,
  removeCohortMember,
  updateCohort as updateCohortQuery,
  updateCohortMember as updateCohortMemberQuery,
  updateCohortNewsfeed as updateCohortNewsfeedQuery,
  updateCohortNewsfeedReaction,
  getPaginatedCohortPeople,
  type PaginatedCohortPeopleOptions,
  type TCohortListPage
} from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import {
  deleteStaffGroupMembers,
  insertGroupMembersOnConflictDoNothing,
  insertGroupMembersOnConflictReturning,
  listGroupMemberRoles
} from '@cio/db/queries/group';
import { getProfileByEmail } from '@cio/db/queries/auth';
import {
  getOrgMembersByProfileIds,
  getOrganizationMemberIdByOrgAndProfile,
  insertOrganizationMembersOnConflictDoNothing
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { assertStudentCapacityOrThrow, notifyStudentMilestone } from '../organization/student-limit';
import type { StudentMilestoneNotification } from '../organization/student-limit';

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

function uniqueCourseProfilePairs(grants: Array<{ courseId: string; profileId: string }>) {
  const pairs = new Map<string, { courseId: string; profileId: string }>();
  for (const grant of grants) {
    pairs.set(`${grant.courseId}:${grant.profileId}`, {
      courseId: grant.courseId,
      profileId: grant.profileId
    });
  }

  return [...pairs.values()];
}

/**
 * Drops cohort staff grants in scope. Course roles created by that enrollment
 * are removed once no cohort still grants them. Independent course roles and
 * student rows stay.
 */
async function revokeCohortStaffCourseAccess(
  scope: { cohortId: string; profileId?: string; courseId?: string },
  dbClient: DbOrTxClient
) {
  const removedGrants = await deleteCohortCourseStaffGrants(scope, dbClient);
  const endedPairs = uniqueCourseProfilePairs(removedGrants);
  if (endedPairs.length === 0) return;

  const remainingGrants = await listCohortCourseStaffGrantsForPairs(endedPairs, dbClient);
  const remainingKeys = new Set(remainingGrants.map((grant) => `${grant.courseId}:${grant.profileId}`));
  const finishedPairs = endedPairs.filter((pair) => !remainingKeys.has(`${pair.courseId}:${pair.profileId}`));
  if (finishedPairs.length === 0) return;

  const courseGroups = await getCourseGroupIds(
    finishedPairs.map((pair) => pair.courseId),
    dbClient
  );
  const groupIdByCourseId = new Map(
    courseGroups.flatMap((row) => (row.groupId ? [[row.courseId, row.groupId] as const] : []))
  );
  const membershipPairs = finishedPairs.flatMap((pair) => {
    const groupId = groupIdByCourseId.get(pair.courseId);
    if (!groupId) return [];

    return [{ groupId, profileId: pair.profileId }];
  });
  const markers = await listCohortGrantedGroupMembers(membershipPairs, dbClient);
  const markerKeys = new Set(markers.map((marker) => `${marker.groupId}:${marker.profileId}`));
  const markedPairs = membershipPairs.filter((pair) => markerKeys.has(`${pair.groupId}:${pair.profileId}`));
  if (markedPairs.length === 0) return;

  const roles = await listGroupMemberRoles(markedPairs, dbClient);
  const staffKeys = new Set(
    roles.filter((role) => isCohortStaffRole(role.roleId)).map((role) => `${role.groupId}:${role.profileId}`)
  );
  const staffPairs = markedPairs.filter((pair) => staffKeys.has(`${pair.groupId}:${pair.profileId}`));

  await deleteStaffGroupMembers(staffPairs, dbClient);
  await deleteCohortGrantedGroupMembers(markedPairs, dbClient);
}

async function enrollCohortStudentsInGroups(
  organizationId: string,
  groupIds: string[],
  members: CohortMemberEnrollment[]
) {
  const studentMembers = members.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const uniqueGroupIds = [...new Set(groupIds)];

  if (studentMembers.length === 0 || uniqueGroupIds.length === 0) {
    return 0;
  }

  const studentProfileIds = studentMembers
    .map((member) => member.profileId)
    .filter((profileId): profileId is string => Boolean(profileId));
  const existingMembers = await getOrgMembersByProfileIds(organizationId, studentProfileIds);
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

  await db.transaction(async (tx) => {
    studentMilestoneNotification = await assertStudentCapacityOrThrow(organizationId, newStudentProfileIds.size, tx, {
      deferNotification: true
    });
    await insertOrganizationMembersOnConflictDoNothing(organizationMemberRows, tx);
    await insertGroupMembersOnConflictDoNothing(groupMemberRows, tx);
  });

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  return groupMemberRows.length;
}

async function enrollCohortStaffInCourseGroups(
  cohortId: string,
  courseGroups: CohortCourseGroup[],
  members: CohortMemberEnrollment[],
  dbClient: DbOrTxClient
): Promise<number> {
  const staff = members.filter((member) => member.profileId && isCohortStaffRole(member.roleId));
  const uniqueGroups = [...new Map(courseGroups.map((group) => [group.courseId, group])).values()];

  if (uniqueGroups.length === 0 || staff.length === 0) {
    return 0;
  }

  const membershipRows = uniqueGroups.flatMap((group) =>
    staff.map((member) => ({
      groupId: group.groupId,
      roleId: member.roleId,
      profileId: member.profileId,
      email: member.email ?? undefined
    }))
  );
  const createdMemberships = await insertGroupMembersOnConflictReturning(membershipRows, dbClient);
  const grants = uniqueGroups.flatMap((group) =>
    staff.map((member) => ({
      cohortId,
      courseId: group.courseId,
      profileId: member.profileId
    }))
  );

  await insertCohortGrantedGroupMembers(createdMemberships, dbClient);
  await insertCohortCourseStaffGrants(grants, dbClient);

  return createdMemberships.length;
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

export async function listOrgCohortsPage(organizationId: string, profileId: string, page: TCohortListPage) {
  const [items, total] = await Promise.all([
    getCohortsByOrgForProfile(organizationId, profileId, page),
    countCohortsByOrgForProfile(organizationId, profileId)
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
    const deleted = await db.transaction(async (tx) => {
      await revokeCohortStaffCourseAccess({ cohortId }, tx);
      const removed = await deleteCohortQuery(cohortId, tx);
      if (!removed) {
        throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
      }

      return removed;
    });

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

export async function listCohortMembersPage(cohortId: string, page: TCohortListPage) {
  const [items, total] = await Promise.all([getCohortMembers(cohortId, page), countCohortMembers(cohortId)]);

  return { items, total };
}

export async function addCohortMembers(cohortId: string, data: TAddCohortMembers) {
  const results = await addCohortMembersSettled(cohortId, data);

  const added = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

  return { added, errors };
}

/** One settled result per `data.members` entry, in request order. */
export async function addCohortMembersSettled(cohortId: string, data: TAddCohortMembers) {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const courseGroups = await listCohortCourseGroups(cohortId);
    const courseGroupIds = courseGroups.map((courseGroup) => courseGroup.groupId);

    return await Promise.allSettled(
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
          const member = await addCohortMember(
            {
              cohortId,
              profileId,
              roleId,
              email: normalizedEmail ?? undefined
            },
            tx
          );

          if (member && member.roleId === ROLE.STUDENT && member.profileId && courseGroupIds.length > 0) {
            const validCourseGroupIds = courseGroupIds.filter((groupId): groupId is string => Boolean(groupId));

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

            await insertOrganizationMembersOnConflictDoNothing(
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

            await insertGroupMembersOnConflictDoNothing(
              validCourseGroupIds.map((groupId) => ({
                groupId,
                roleId: ROLE.STUDENT,
                profileId: member.profileId,
                email: normalizedEmail ?? undefined
              })),
              tx
            );
          }

          if (member?.profileId && (member.roleId === ROLE.ADMIN || member.roleId === ROLE.TUTOR)) {
            const validCourseGroupIds = courseGroupIds.filter((groupId): groupId is string => Boolean(groupId));

            await enrollCohortStaffInCourseGroups(
              cohortId,
              courseGroups.filter((group) => validCourseGroupIds.includes(group.groupId)),
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

          return { member, studentMilestoneNotification };
        });

        if (transactionResult.studentMilestoneNotification) {
          notifyStudentMilestone(transactionResult.studentMilestoneNotification).catch((error) => {
            console.error('notifyStudentMilestone error:', error);
          });
        }

        return transactionResult.member;
      })
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add cohort members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function removeCohortMemberService(cohortId: string, memberId: string) {
  try {
    const existing = await getCohortMemberById(cohortId, memberId);
    if (!existing) {
      throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
    }

    const deleted = await db.transaction(async (tx) => {
      if (existing.profileId && isCohortStaffRole(existing.roleId)) {
        await revokeCohortStaffCourseAccess({ cohortId, profileId: existing.profileId }, tx);
      }

      const removed = await removeCohortMember(cohortId, memberId, tx);
      if (!removed) {
        throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
      }

      return removed;
    });

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

export async function updateCohortMemberService(cohortId: string, memberId: string, data: TUpdateCohortMember) {
  try {
    const existing = await getCohortMemberById(cohortId, memberId);
    if (!existing) {
      throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
    }

    const wasStaff = isCohortStaffRole(existing.roleId);
    const willBeStaff = isCohortStaffRole(data.roleId);
    const courseGroups = existing.profileId && !wasStaff && willBeStaff ? await listCohortCourseGroups(cohortId) : [];

    const updated = await db.transaction(async (tx) => {
      const member = await updateCohortMemberQuery(cohortId, memberId, { roleId: data.roleId }, tx);
      if (!member) {
        throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
      }

      if (existing.profileId && wasStaff && !willBeStaff) {
        await revokeCohortStaffCourseAccess({ cohortId, profileId: existing.profileId }, tx);
      }

      if (existing.profileId && !wasStaff && willBeStaff) {
        await enrollCohortStaffInCourseGroups(
          cohortId,
          courseGroups,
          [
            {
              profileId: existing.profileId,
              email: existing.email,
              roleId: member.roleId
            }
          ],
          tx
        );
      }

      return member;
    });

    return updated;
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

export async function addCourseToCohortService(cohortId: string, data: TAddCourseToCohort) {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const alreadyAdded = await isCohortCourse(cohortId, data.courseId);
    if (alreadyAdded) {
      throw new AppError('Course is already in this cohort', ErrorCodes.COURSE_ALREADY_IN_COHORT, 409);
    }

    const courseGroupIds = (await getCourseGroupIds([data.courseId]))
      .map((courseGroup) => courseGroup.groupId)
      .filter((groupId): groupId is string => Boolean(groupId));
    const courseGroups = courseGroupIds.map((groupId) => ({ courseId: data.courseId, groupId }));

    const { result, students } = await db.transaction(async (tx) => {
      const linked = await addCourseToCohort(cohortId, data.courseId, tx);
      const members = await listCohortEnrollmentMembers(cohortId, tx);
      const staff = members.flatMap((member) => {
        if (!member.profileId || (member.roleId !== ROLE.ADMIN && member.roleId !== ROLE.TUTOR)) {
          return [];
        }

        return [
          {
            profileId: member.profileId,
            email: member.email,
            roleId: member.roleId
          }
        ];
      });
      const enrolledStudents = members.flatMap((member) => {
        if (!member.profileId || member.roleId !== ROLE.STUDENT) {
          return [];
        }

        return [
          {
            profileId: member.profileId,
            email: member.email,
            roleId: member.roleId
          }
        ];
      });

      await enrollCohortStaffInCourseGroups(cohortId, courseGroups, staff, tx);

      return { result: linked, students: enrolledStudents };
    });

    if (students.length > 0 && courseGroupIds.length > 0) {
      await enrollCohortStudentsInGroups(cohort.organizationId, courseGroupIds, students);
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add course to cohort',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function removeCourseFromCohortService(cohortId: string, courseId: string) {
  try {
    const deleted = await db.transaction(async (tx) => {
      await revokeCohortStaffCourseAccess({ cohortId, courseId }, tx);
      const removed = await removeCourseFromCohort(cohortId, courseId, tx);
      if (!removed) {
        throw new AppError('Course not found in cohort', ErrorCodes.NOT_FOUND, 404);
      }

      return removed;
    });

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
