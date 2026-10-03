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
  createCohortWithCreatorMembership,
  createCohortNewsfeed as createCohortNewsfeedQuery,
  createCohortNewsfeedComment as createCohortNewsfeedCommentQuery,
  deleteCohort as deleteCohortQuery,
  deleteCohortNewsfeed as deleteCohortNewsfeedQuery,
  deleteCohortNewsfeedComment as deleteCohortNewsfeedCommentQuery,
  getEnrolledCohortsByProfile,
  getCohortById,
  getCohortCoursePairsByCohortIds,
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
  removeCourseFromCohort,
  removeCohortMember,
  updateCohort as updateCohortQuery,
  updateCohortMember as updateCohortMemberQuery,
  updateCohortNewsfeed as updateCohortNewsfeedQuery,
  updateCohortNewsfeedReaction
} from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { grantCourseAccess, revokeCohortGrants } from '@cio/db/queries/learning-path';
import { recordDirectCourseGrantsBulk } from '@api/services/course/enrollment-grants';
import { getProfileByEmail } from '@cio/db/queries/auth';
import {
  getOrgMembersByProfileIds,
  getOrganizationMemberIdByOrgAndProfile,
  insertOrganizationMembersOnConflictDoNothing
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { assertCourseAllowsDirectStudentAdd, filterOutPathOnlyCourseIds } from '@api/services/course/path-gate';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { assertStudentCapacityOrThrow, notifyStudentMilestone } from '../organization/student-limit';
import type { StudentMilestoneNotification } from '../organization/student-limit';

type CohortMemberEnrollment = {
  profileId: string;
  email: string | null;
  roleId: number;
};

/**
 * Enrolls cohort STUDENT members into the groups of the given (non-path-only)
 * courses with COHORT grants. Inside a caller's transaction it returns the
 * student-limit milestone for the caller to send after commit.
 */
async function enrollCohortStudentsInGroups(
  organizationId: string,
  groupIds: string[],
  members: CohortMemberEnrollment[],
  courseIds: string[],
  cohortId: string,
  dbClient?: DbOrTxClient
) {
  const { allowedCourseIds } = await filterOutPathOnlyCourseIds(courseIds, dbClient ?? db);

  if (allowedCourseIds.length === 0) {
    return { enrolled: 0, milestone: null };
  }

  const studentMembers = members.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const uniqueGroupIds = [...new Set(groupIds)];

  if (studentMembers.length === 0 || uniqueGroupIds.length === 0) {
    return { enrolled: 0, milestone: null };
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

  const run = async (tx: DbOrTxClient) => {
    studentMilestoneNotification = await assertStudentCapacityOrThrow(organizationId, newStudentProfileIds.size, tx, {
      deferNotification: true
    });
    await insertOrganizationMembersOnConflictDoNothing(organizationMemberRows, tx);
    await insertGroupMembersOnConflictDoNothing(groupMemberRows, tx);
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

  // Inside a caller's transaction the milestone email is returned for the
  // caller to send after commit; standalone, it is sent here after commit.
  if (dbClient && dbClient !== db) {
    await run(dbClient);

    return {
      enrolled: groupMemberRows.length,
      milestone: studentMilestoneNotification as StudentMilestoneNotification | null
    };
  }

  await db.transaction(run);

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  return { enrolled: groupMemberRows.length, milestone: null };
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

    const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, profileId, dbClient);

    if (groupMemberId) {
      await grantCourseAccess(
        {
          groupmemberId: groupMemberId,
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

export async function addCohortMembers(cohortId: string, data: TAddCohortMembers, actorProfileId?: string) {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const cohortCourses = await getCoursesByCohort(cohortId);
    const allCourseIds = cohortCourses.map((course) => course.course.id);
    const { allowedCourseIds, skippedPathOnlyCourseIds } = await filterOutPathOnlyCourseIds(allCourseIds);
    const courseGroupIds = (await getCourseGroupIds(allowedCourseIds)).map((courseGroup) => courseGroup.groupId);

    const results = await Promise.allSettled(
      data.members.map(async ({ profileId: providedProfileId, email, roleId }) => {
        const profile = !providedProfileId && email ? await getProfileByEmail(email) : null;
        const profileId = providedProfileId ?? profile?.id ?? null;
        const normalizedEmail = email?.toLowerCase().trim() ?? profile?.email ?? null;

        if (profileId) {
          const existing = await getCohortMemberByProfileId(cohortId, profileId);
          if (existing) {
            throw new AppError(`${email} is already a member of this cohort`, ErrorCodes.MEMBER_ALREADY_IN_COHORT, 409);
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

            await ensureCohortCourseGrants(cohortId, member.profileId, actorProfileId, tx, allowedCourseIds);
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

    const added = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

    return { added, errors, skippedPathOnlyCourseIds };
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
export async function removeCohortMemberService(cohortId: string, memberId: string) {
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
 * Changes a member's role between student and tutor, scoped to the cohort so
 * another cohort's member 404s. Course access moves with the role in the same
 * transaction: a demoted student loses their COHORT grants, and a tutor made a
 * student is enrolled in the cohort's courses like a newly added student.
 */
export async function updateCohortMemberService(cohortId: string, memberId: string, data: TUpdateCohortMember) {
  try {
    const cohort = await getCohortById(cohortId);

    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const result = await db.transaction(async (tx) => {
      const member = await getCohortMemberById(cohortId, memberId, tx);

      if (!member) {
        throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
      }

      if (member.roleId === data.roleId) {
        return { updated: member, milestone: null };
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
        return { updated, milestone: null };
      }

      if (member.roleId === ROLE.STUDENT) {
        await revokeCohortGrants(cohortId, updated.profileId, tx);

        return { updated, milestone: null };
      }

      if (data.roleId !== ROLE.STUDENT) {
        return { updated, milestone: null };
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
        tx
      );

      return { updated, milestone: enrollment.milestone };
    });

    if (result.milestone) {
      notifyStudentMilestone(result.milestone).catch((error) => {
        console.error('notifyStudentMilestone error:', error);
      });
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

export async function listCohortCourses(cohortId: string, profileId: string) {
  try {
    const roleId = await getCohortMemberRole(cohortId, profileId);
    const onlyPublished = roleId === ROLE.STUDENT;

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

    await assertCourseAllowsDirectStudentAdd(data.courseId);

    const { added, milestone } = await db.transaction(async (tx) => {
      const alreadyAdded = await isCohortCourse(cohortId, data.courseId, tx);

      if (alreadyAdded) {
        throw new AppError('Course is already in this cohort', ErrorCodes.COURSE_ALREADY_IN_COHORT, 409);
      }

      const added = await addCourseToCohort(cohortId, data.courseId, tx);
      const memberRows = await getCohortMembers(cohortId, tx);
      const studentRows = memberRows
        .filter((member) => member.roleId === ROLE.STUDENT && member.profileId)
        .map((member) => ({
          profileId: member.profileId!,
          email: member.email ?? null,
          roleId: member.roleId
        }));
      const groups = (await getCourseGroupIds([data.courseId], tx))
        .map((courseGroup) => courseGroup.groupId)
        .filter((groupId): groupId is string => Boolean(groupId));

      if (studentRows.length > 0 && groups.length > 0) {
        const enrollment = await enrollCohortStudentsInGroups(
          cohort.organizationId,
          groups,
          studentRows,
          [data.courseId],
          cohortId,
          tx
        );

        return { added, milestone: enrollment.milestone };
      }

      return { added, milestone: null };
    });

    // Sent only after commit, so a rolled-back add never emails admins.
    if (milestone) {
      notifyStudentMilestone(milestone).catch((notifyError) => {
        console.error('notifyStudentMilestone error:', notifyError);
      });
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

export async function updateCohortNewsfeedService(feedId: string, data: TUpdateCohortNewsfeed) {
  try {
    const feed = await getCohortNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return updateCohortNewsfeedQuery(feedId, data);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update cohort newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateCohortNewsfeedReactionService(feedId: string, data: TUpdateCohortReaction) {
  try {
    const feed = await getCohortNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return updateCohortNewsfeedReaction(feedId, data.reaction);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update cohort newsfeed reaction',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function deleteCohortNewsfeedService(feedId: string) {
  try {
    const feed = await getCohortNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return deleteCohortNewsfeedQuery(feedId);
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

export async function listCohortNewsfeedComments(feedId: string) {
  try {
    const feed = await getCohortNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return getCohortNewsfeedComments(feedId);
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
  feedId: string,
  profileId: string,
  data: TCreateCohortNewsfeedComment
) {
  try {
    const feed = await getCohortNewsfeedById(feedId);
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

export async function deleteCohortNewsfeedCommentService(commentId: number) {
  try {
    const comment = await getCohortNewsfeedCommentById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND, 404);
    }
    const feed = await getCohortNewsfeedById(comment.cohortNewsfeedId!);
    if (!feed) {
      throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
    }
    return deleteCohortNewsfeedCommentQuery(commentId);
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
