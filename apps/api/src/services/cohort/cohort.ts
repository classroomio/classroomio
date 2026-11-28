import { emitCohortMemberWebhookEvent, emitOrganizationMemberWebhookEvent } from '@cio/core/services/webhook/emit';
import { getInvitedPersonStatus, type TInvitedPersonStatus } from '@cio/utils/functions/invite-metadata';
import type { TOrganizationmember } from '@cio/db/types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { pageJoinedThenInvited } from '@api/utils/joined-then-invited-page';
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
import type { TCohortPeopleMembership } from '@cio/utils/validation/cohort';
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
  insertCohortMemberIfAbsent,
  isCohortCourse,
  isCohortMember,
  isOrgAdminByCohortId,
  listCohortEnrollmentMembers,
  removeCourseFromCohort,
  removeCohortMember,
  updateCohort as updateCohortQuery,
  updateCohortMember as updateCohortMemberQuery,
  updateCohortNewsfeed as updateCohortNewsfeedQuery,
  updateCohortNewsfeedReaction,
  getPaginatedCohortPeople,
  getPaginatedInvitedCohortPeople,
  type PaginatedCohortPeopleOptions,
  type TInvitedCohortPersonRow,
  type TCohortListFilters,
  type TCohortListPage
} from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { getProfileById } from '@cio/db/queries/auth';
import {
  getOrgMembersByProfileIds,
  getOrganizationMembersByNormalizedEmails,
  insertOrganizationMembersOnConflictDoNothing,
  listActiveOrganizationRoles
} from '@cio/db/queries/organization';
import type { AudienceImportRowResult } from '@cio/utils/validation/organization';
import { importAudienceMembers } from '../organization/audience';
import { ROLE } from '@cio/utils/constants';
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

async function enrollCohortStudentsInGroups(
  organizationId: string,
  groupIds: string[],
  members: CohortMemberEnrollment[],
  source: TEventSource
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
  let createdOrganizationMembers: TOrganizationmember[] = [];

  const enrolledMembers = await db.transaction(async (tx) => {
    studentMilestoneNotification = await assertStudentCapacityOrThrow(organizationId, newStudentProfileIds.size, tx, {
      deferNotification: true
    });
    createdOrganizationMembers = await insertOrganizationMembersOnConflictDoNothing(organizationMemberRows, tx);

    return insertGroupMembersOnConflictDoNothing(groupMemberRows, tx);
  });

  captureLearnersEnrolled(enrolledMembers, 'cohort', source);

  for (const createdMember of createdOrganizationMembers) {
    await emitOrganizationMemberWebhookEvent('organization.member.added', organizationId, createdMember);
  }

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  return groupMemberRows.length;
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

type TCohortPersonInvitation = {
  kind: TInvitedCohortPersonRow['kind'];
  status: TInvitedPersonStatus;
  cohortMemberId: string | null;
  orgInviteId: string | null;
  expiresAt: string | null;
  courseIds: string[];
  cohortIds: string[];
};

function toInvitedCohortPerson(row: TInvitedCohortPersonRow, cohortId: string) {
  const createdAt = row.memberCreatedAt ?? row.inviteCreatedAt ?? '';
  const status = getInvitedPersonStatus(row.inviteExpiresAt);
  const invitation: TCohortPersonInvitation = {
    kind: row.kind,
    status,
    cohortMemberId: row.cohortMemberId,
    orgInviteId: row.orgInviteId,
    expiresAt: row.inviteExpiresAt,
    courseIds: row.courseIds,
    cohortIds: row.cohortIds
  };

  return {
    id: row.cohortMemberId ?? `invited:${row.kind}:${(row.email ?? '').toLowerCase()}`,
    cohortId,
    profileId: null,
    roleId: row.roleId ?? ROLE.STUDENT,
    email: row.email,
    createdAt,
    profile: null,
    lastLoginAt: null,
    membership: 'invited' as TCohortPeopleMembership,
    invitation: invitation as TCohortPersonInvitation | null
  };
}

function toJoinedCohortPeople(items: Awaited<ReturnType<typeof getPaginatedCohortPeople>>['items']) {
  return items.map((person) => ({
    ...person,
    membership: (person.profileId ? 'joined' : 'invited') as TCohortPeopleMembership,
    invitation: null as TCohortPersonInvitation | null
  }));
}

async function getCohortPeoplePage(cohortId: string, query: PaginatedCohortPeopleOptions) {
  if (query.membership === 'invited') {
    const { items, total } = await getPaginatedInvitedCohortPeople(cohortId, query);

    return { items: items.map((row) => toInvitedCohortPerson(row, cohortId)), total };
  }

  if (!query.membership && !query.lastLoginBefore) {
    const page = await pageJoinedThenInvited({
      page: query.page,
      limit: query.limit,
      fetchJoined: (offset, limit) =>
        getPaginatedCohortPeople(cohortId, { ...query, membership: 'joined', offset, limit }),
      fetchInvited: (offset, limit) =>
        getPaginatedInvitedCohortPeople(cohortId, {
          page: 1,
          limit,
          offset,
          search: query.search,
          roleId: query.roleId
        })
    });
    const joinedPeople = toJoinedCohortPeople(page.joined);
    const invitedPeople = page.invited.map((row) => toInvitedCohortPerson(row, cohortId));

    return { items: [...joinedPeople, ...invitedPeople], total: page.total };
  }

  const { items, total } = await getPaginatedCohortPeople(cohortId, query);

  return { items: toJoinedCohortPeople(items), total };
}

/**
 * One page of cohort people. `membership: 'invited'` lists pending organization members whose invite carries the
 * cohort plus legacy email-only rows, each with the invitation the row actions resend or revoke. With no membership
 * filter, invited people follow the joined members unless `lastLoginBefore` is set. Scope the query with
 * `scopeCohortPeopleQueryToViewer` before listing for someone who may not be on the cohort team.
 */
export async function listPaginatedCohortPeople(cohortId: string, query: PaginatedCohortPeopleOptions) {
  try {
    const { items, total } = await getCohortPeoplePage(cohortId, query);

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
  const results = await addCohortMembersSettled(cohortId, data, 'dashboard', actorProfileId);
  const outcomes = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
  const added = outcomes.flatMap((outcome) => (outcome.kind === 'added' ? [outcome.member] : []));
  const invited = outcomes.flatMap((outcome) =>
    outcome.kind === 'invited' ? [{ email: outcome.email, status: outcome.status, inviteId: outcome.inviteId }] : []
  );
  const errors = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason?.message || 'Unknown error'] : []
  );

  return { added, invited, errors };
}

type TCohortMemberInput = TAddCohortMembers['members'][number];

type TCohortMemberPlan =
  | { kind: 'direct'; profileId: string | null; email: string | null; roleId: number }
  | { kind: 'invite'; email: string };

export type TCohortInviteStatus = 'invited' | 'already_invited' | 'enrolled' | 'already_enrolled';

export type TCohortMemberAddOutcome =
  | { kind: 'added'; member: Awaited<ReturnType<typeof addCohortMember>> }
  | { kind: 'invited'; email: string; status: TCohortInviteStatus; inviteId: string | null };

/**
 * Decides how one entry joins the cohort. Staff entries and students who already joined the organization are added
 * directly; every other student is invited through their organization invite, so nobody joins the organization or
 * gets an email-only student row without accepting. An entry whose `profileId` and `email` name different people, or
 * a student entry for an organization admin or tutor, is refused.
 */
async function planCohortMember(
  cohortId: string,
  organizationId: string,
  member: TCohortMemberInput
): Promise<TCohortMemberPlan> {
  const profileEmail = member.profileId ? ((await getProfileById(member.profileId))?.email ?? null) : null;
  const normalizedEmail = (member.email ?? profileEmail)?.trim().toLowerCase() || null;
  if (!member.profileId && !normalizedEmail) {
    throw new AppError('Either profileId or email must be provided for each member', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const normalizedProfileEmail = profileEmail?.trim().toLowerCase() ?? null;
  if (member.profileId && member.email && normalizedProfileEmail && normalizedProfileEmail !== normalizedEmail) {
    throw new AppError('profileId and email identify different people', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  const [organizationMember] = normalizedEmail
    ? await getOrganizationMembersByNormalizedEmails(organizationId, [normalizedEmail])
    : [];
  const profileId = member.profileId ?? organizationMember?.profileId ?? null;
  const existing = profileId
    ? await getCohortMemberByProfileId(cohortId, profileId)
    : await getCohortMemberByEmail(cohortId, normalizedEmail!);
  if (existing) {
    throw new AppError(
      `${member.email ?? member.profileId} is already a member of this cohort`,
      ErrorCodes.MEMBER_ALREADY_IN_COHORT,
      409
    );
  }

  if (member.roleId !== ROLE.STUDENT) {
    return { kind: 'direct', profileId, email: normalizedEmail, roleId: member.roleId };
  }

  if (organizationMember?.status === 'ARCHIVED') {
    throw new AppError(
      'This email belongs to an archived organization member. Restore them before adding them',
      ErrorCodes.ORG_MEMBER_ARCHIVED,
      409
    );
  }

  if (organizationMember && organizationMember.roleId !== ROLE.STUDENT) {
    throw new AppError('This email belongs to an admin or tutor', ErrorCodes.STAFF_CANNOT_ENROLL, 409);
  }

  if (organizationMember?.profileId) {
    return { kind: 'direct', profileId: organizationMember.profileId, email: normalizedEmail, roleId: ROLE.STUDENT };
  }

  if (!normalizedEmail) {
    throw new AppError('This profile has no email to invite', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return { kind: 'invite', email: normalizedEmail };
}

async function addDirectCohortMember(
  cohortId: string,
  organizationId: string,
  courseGroupIds: string[],
  plan: Extract<TCohortMemberPlan, { kind: 'direct' }>,
  source: TEventSource,
  actorProfileId: string | null
) {
  const { member, enrolledMembers } = await db.transaction(async (tx) => {
    let enrolledMembers: TGroupmember[] = [];
    const member = await addCohortMember(
      { cohortId, profileId: plan.profileId, roleId: plan.roleId, email: plan.email ?? undefined },
      tx
    );

    if (member?.profileId && member.roleId === ROLE.STUDENT && courseGroupIds.length > 0) {
      enrolledMembers = await insertGroupMembersOnConflictDoNothing(
        courseGroupIds.map((groupId) => ({
          groupId,
          roleId: ROLE.STUDENT,
          profileId: member.profileId,
          email: plan.email ?? undefined
        })),
        tx
      );
    }

    if (member?.profileId && (member.roleId === ROLE.ADMIN || member.roleId === ROLE.TUTOR)) {
      await enrollCohortStaffInCourseGroups(
        organizationId,
        courseGroupIds,
        [{ profileId: member.profileId, email: plan.email, roleId: member.roleId }],
        tx
      );
    }

    return { member, enrolledMembers };
  });

  captureLearnersEnrolled(enrolledMembers, 'cohort', source);

  if (member) {
    await emitCohortMemberWebhookEvent('cohort.member.added', organizationId, cohortId, member, actorProfileId);
  }

  return member;
}

function toCohortInviteOutcome(email: string, row: AudienceImportRowResult | undefined): TCohortMemberAddOutcome {
  switch (row?.status) {
    case 'ready':
    case 'invite_resent':
      return { kind: 'invited', email, status: 'invited', inviteId: row.inviteId ?? null };
    case 'already_invited':
      return { kind: 'invited', email, status: 'already_invited', inviteId: row.inviteId ?? null };
    case 'already_member':
      return {
        kind: 'invited',
        email,
        status: row.enrollment === 'already_enrolled' ? 'already_enrolled' : 'enrolled',
        inviteId: null
      };
    case 'is_staff':
      throw new AppError('This email belongs to an admin or tutor', ErrorCodes.STAFF_CANNOT_ENROLL, 409);
    case 'archived':
      throw new AppError('This email belongs to an archived organization member', ErrorCodes.ORG_MEMBER_ARCHIVED, 409);
    case 'over_seat_limit':
      throw new AppError('Your plan has no student seats left', ErrorCodes.UPGRADE_REQUIRED, 403);
    default:
      throw new AppError('Failed to invite this person', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/** One settled result per `data.members` entry, in request order. */
export async function addCohortMembersSettled(
  cohortId: string,
  data: TAddCohortMembers,
  source: TEventSource = 'dashboard',
  actorProfileId: string | null = null
): Promise<PromiseSettledResult<TCohortMemberAddOutcome>[]> {
  try {
    const cohort = await getCohortById(cohortId);
    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const courseGroups = await listCohortCourseGroups(cohortId);
    const courseGroupIds = courseGroups
      .map((courseGroup) => courseGroup.groupId)
      .filter((groupId): groupId is string => Boolean(groupId));

    const plans = await Promise.allSettled(
      data.members.map((member) => planCohortMember(cohortId, cohort.organizationId, member))
    );
    const inviteEmails = [
      ...new Set(
        plans.flatMap((plan) => (plan.status === 'fulfilled' && plan.value.kind === 'invite' ? [plan.value.email] : []))
      )
    ];

    let inviteRows = new Map<string, AudienceImportRowResult>();
    let inviteError: unknown = null;
    if (inviteEmails.length > 0 && actorProfileId) {
      try {
        const imported = await importAudienceMembers(
          cohort.organizationId,
          {
            recipients: inviteEmails.map((email) => ({ email })),
            cohortIds: [cohortId],
            allCourses: false,
            allCohorts: false,
            sendEmail: true
          },
          actorProfileId,
          source,
          { reissue: 'when-changed', inviteSource: 'COHORT_ADD' }
        );
        inviteRows = new Map(imported.rows.map((row) => [row.email, row]));
      } catch (error) {
        inviteError = error;
      }
    }

    return await Promise.allSettled(
      plans.map(async (plan): Promise<TCohortMemberAddOutcome> => {
        if (plan.status === 'rejected') throw plan.reason;

        if (plan.value.kind === 'invite') {
          if (!actorProfileId) {
            throw new AppError('Only a signed-in user can invite new students', ErrorCodes.VALIDATION_ERROR, 400);
          }
          if (inviteError) throw inviteError;

          return toCohortInviteOutcome(plan.value.email, inviteRows.get(plan.value.email));
        }

        const member = await addDirectCohortMember(
          cohortId,
          cohort.organizationId,
          courseGroupIds,
          plan.value,
          source,
          actorProfileId
        );

        return { kind: 'added', member };
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

export async function removeCohortMemberService(
  cohortId: string,
  memberId: string,
  actorProfileId: string | null = null
) {
  try {
    const deleted = await removeCohortMember(cohortId, memberId);
    if (!deleted) {
      throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
    }

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

export async function updateCohortMemberService(cohortId: string, memberId: string, data: TUpdateCohortMember) {
  try {
    const existing = await getCohortMemberById(cohortId, memberId);
    if (!existing) {
      throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
    }

    const wasStaff = isCohortStaffRole(existing.roleId);
    const willBeStaff = isCohortStaffRole(data.roleId);
    const promotingToStaff = Boolean(existing.profileId) && !wasStaff && willBeStaff;
    const cohort = promotingToStaff ? await getCohortById(cohortId) : null;
    if (promotingToStaff && !cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    const courseGroups = promotingToStaff ? await listCohortCourseGroups(cohortId) : [];

    const updated = await db.transaction(async (tx) => {
      const member = await updateCohortMemberQuery(cohortId, memberId, { roleId: data.roleId }, tx);
      if (!member) {
        throw new AppError('Cohort member not found', ErrorCodes.COHORT_MEMBER_NOT_FOUND, 404);
      }

      if (cohort && existing.profileId && !wasStaff && willBeStaff) {
        await enrollCohortStaffInCourseGroups(
          cohort.organizationId,
          courseGroups.map((group) => group.groupId),
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

    const alreadyAdded = await isCohortCourse(cohortId, data.courseId);
    if (alreadyAdded) {
      throw new AppError('Course is already in this cohort', ErrorCodes.COURSE_ALREADY_IN_COHORT, 409);
    }

    const courseGroupIds = (await getCourseGroupIds([data.courseId]))
      .map((courseGroup) => courseGroup.groupId)
      .filter((groupId): groupId is string => Boolean(groupId));

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

      await enrollCohortStaffInCourseGroups(cohort.organizationId, courseGroupIds, staff, tx);

      return { result: linked, students: enrolledStudents };
    });

    if (students.length > 0 && courseGroupIds.length > 0) {
      await enrollCohortStudentsInGroups(cohort.organizationId, courseGroupIds, students, source);
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

/**
 * The cohort member row that authors content for `profileId`. An org admin who has not
 * joined the cohort yet is added to it as an admin, mirroring how course feeds treat them.
 */
async function ensureCohortAuthorMemberId(cohortId: string, profileId: string): Promise<string> {
  const existingMember = await getCohortMemberByProfileId(cohortId, profileId);
  if (existingMember) {
    return existingMember.id;
  }

  const isOrgAdmin = await isOrgAdminByCohortId(cohortId, profileId);
  if (!isOrgAdmin) {
    throw new AppError('User is not a member of this cohort', ErrorCodes.COHORT_FORBIDDEN, 403);
  }

  await insertCohortMemberIfAbsent({ cohortId, profileId, roleId: ROLE.ADMIN });

  const addedMember = await getCohortMemberByProfileId(cohortId, profileId);
  if (!addedMember) {
    throw new AppError('Failed to add you to this cohort', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return addedMember.id;
}

export async function createCohortNewsfeedService(cohortId: string, profileId: string, data: TCreateCohortNewsfeed) {
  try {
    const authorMemberId = await ensureCohortAuthorMemberId(cohortId, profileId);

    return createCohortNewsfeedQuery({
      cohortId,
      authorId: authorMemberId,
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
