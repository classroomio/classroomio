import { type DbOrTxClient } from '@cio/db/drizzle';
import type { TOrganizationmember } from '@cio/db/types';
import { claimEmailOnlyCohortMembers, claimEmailOnlyProgramMembers } from '@cio/db/queries/cohort';
import {
  claimPendingOrganizationInvite,
  createOrganizationMember,
  deleteOrganizationMemberById,
  hasLapsedStudentInvite,
  listLiveStudentOrgInvitesForEmail,
  lockOrganizationMemberEmail,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  selectOrganizationMemberByOrgAndProfile,
  updateOrganizationMemberById
} from '@cio/db/queries/organization';
import { getOrganizationAuthPolicy } from '@cio/db/queries/organization/sso';
import { fulfillCourseInvite, listLiveEmailBoundCourseInvitesInOrg } from '@cio/db/queries/course/invite';
import { getCoursesByGroupIds } from '@cio/db/queries/course';
import { claimEmailOnlyGroupMembers } from '@cio/db/queries/group';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import { ROLE } from '@cio/utils/constants';
import {
  parseCohortIdsFromInviteMetadata,
  parseCourseIdsFromInviteMetadata
} from '@cio/utils/functions/invite-metadata';

import {
  enrollOrganizationInviteUserCore,
  type TInviteEnrollment,
  type TInviteEnrollmentDeps
} from './invite-enrollment';
import { checkStudentCapacity, StudentCapacityError, type StudentCapacityCheck } from './student-capacity';

export type TBindTrigger =
  | 'org-invite'
  | 'course-invite'
  | 'invite-link'
  | 'self-enroll'
  | 'join-academy'
  | 'sso'
  | 'token-auth'
  | 'self-hosted';

export type TBindProfileToOrgEmailParams = {
  orgId: string;
  profileId: string;
  email: string;
  trigger: TBindTrigger;
  /** True for an email-bound token, a verified email, or an IdP-asserted email. Public links pass false. */
  identityProven: boolean;
  roleForNewMember?: number;
  /** Role granted by the invite being accepted; applied to the member before fulfilment is decided. */
  inviteRoleId?: number;
  /** Invites the caller handles itself (the triggering invite); fulfilment skips them. */
  skipInviteIds?: string[];
};

export type TFulfilledOrgInvite = {
  inviteId: string;
  courseIds: string[];
  cohortIds: string[];
  enrollment: TInviteEnrollment;
};

export type TFulfilledCourseInvite = { inviteId: string; courseId: string; enrollment: TInviteEnrollment };

export type TBindFulfilled = {
  orgInvites: TFulfilledOrgInvite[];
  courseInvites: TFulfilledCourseInvite[];
  courseIds: string[];
  cohortIds: string[];
  skippedCourseInviteIds: string[];
};

export type TBindClaimed = {
  groups: number;
  cohorts: number;
  programs: number;
  removedDuplicates: number;
  courseIds: string[];
  cohortIds: string[];
};

export type TBindResult = {
  member: TOrganizationmember;
  createdMember: boolean;
  linkedPendingMember: boolean;
  claimed: TBindClaimed;
  /** Cohort-course enrolments and compliance records created for claimed email-only rows. */
  claimEnrollment: TInviteEnrollment;
  fulfilled: TBindFulfilled;
  enrollment: TInviteEnrollment;
  seatCheck: StudentCapacityCheck | null;
};

const EMPTY_CLAIM: TBindClaimed = {
  groups: 0,
  cohorts: 0,
  programs: 0,
  removedDuplicates: 0,
  courseIds: [],
  cohortIds: []
};

function emptyFulfilment(): { fulfilled: TBindFulfilled; enrollment: TInviteEnrollment } {
  return {
    fulfilled: { orgInvites: [], courseInvites: [], courseIds: [], cohortIds: [], skippedCourseInviteIds: [] },
    enrollment: { enrolledMembers: [], complianceRecords: [], cohortMembers: [] }
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function assertSeatForNewStudent(orgId: string, tx: DbOrTxClient): Promise<StudentCapacityCheck | null> {
  try {
    return await checkStudentCapacity(orgId, 1, tx);
  } catch (error) {
    if (error instanceof StudentCapacityError) {
      throw new AppError(error.message, ErrorCodes.UPGRADE_REQUIRED, 403);
    }

    throw error;
  }
}

async function resolveRoleForNewMember(
  orgId: string,
  roleForNewMember: number | undefined,
  tx: DbOrTxClient
): Promise<number> {
  if (roleForNewMember !== undefined) return roleForNewMember;

  const policy = await getOrganizationAuthPolicy(orgId, tx);

  return policy?.defaultRoleId ?? ROLE.STUDENT;
}

type TResolvedMember = {
  member: TOrganizationmember;
  createdMember: boolean;
  linkedPendingMember: boolean;
  seatCheck: StudentCapacityCheck | null;
};

async function resolveOrganizationMember(
  tx: DbOrTxClient,
  params: TBindProfileToOrgEmailParams,
  email: string
): Promise<TResolvedMember> {
  const { orgId, profileId } = params;
  const [byProfile, byEmail] = await Promise.all([
    selectOrganizationMemberByOrgAndProfile(tx, orgId, profileId),
    selectOrganizationMemberByOrgAndNormalizedEmail(tx, orgId, email)
  ]);

  if (byEmail?.profileId && byEmail.profileId !== profileId) {
    throw new AppError(
      'This email is already linked to another account in this organization',
      ErrorCodes.ORG_MEMBER_EMAIL_LINKED_TO_OTHER_ACCOUNT,
      409,
      'email'
    );
  }

  if (byProfile) {
    if (byEmail && byEmail.id !== byProfile.id) {
      await deleteOrganizationMemberById(tx, byEmail.id);
    }

    return { member: byProfile, createdMember: false, linkedPendingMember: false, seatCheck: null };
  }

  if (byEmail) {
    const finalRoleId = params.inviteRoleId ?? Number(byEmail.roleId);
    const needsSeat = finalRoleId === ROLE.STUDENT && (await hasLapsedStudentInvite(orgId, byEmail.id, tx));
    const seatCheck = needsSeat ? await assertSeatForNewStudent(orgId, tx) : null;
    const linked = await updateOrganizationMemberById(tx, byEmail.id, { profileId, verified: true });
    if (!linked) throw new AppError('Failed to link organization membership', ErrorCodes.INTERNAL_ERROR, 500);

    return { member: linked, createdMember: false, linkedPendingMember: true, seatCheck };
  }

  const roleId = await resolveRoleForNewMember(orgId, params.roleForNewMember, tx);
  const seatCheck = roleId === ROLE.STUDENT ? await assertSeatForNewStudent(orgId, tx) : null;
  const created = await createOrganizationMember(
    { organizationId: orgId, profileId, email, roleId, verified: true },
    tx
  );
  if (!created) throw new AppError('Failed to create organization membership', ErrorCodes.INTERNAL_ERROR, 500);

  return { member: created, createdMember: true, linkedPendingMember: false, seatCheck };
}

async function applyInviteRole(
  tx: DbOrTxClient,
  member: TOrganizationmember,
  inviteRoleId: number | undefined,
  email: string
): Promise<TOrganizationmember> {
  const roleMatches = inviteRoleId === undefined || Number(member.roleId) === Number(inviteRoleId);
  const emailMatches = (member.email ?? '').trim().toLowerCase() === email;
  if (roleMatches && emailMatches) return member;

  const updated = await updateOrganizationMemberById(tx, member.id, {
    ...(inviteRoleId === undefined ? {} : { roleId: inviteRoleId }),
    email,
    verified: true
  });

  return updated ?? member;
}

export type TEmailOnlyClaim = { claimed: TBindClaimed; enrollment: TInviteEnrollment };

/**
 * Links the email-only course, cohort and program rows in the org to `profileId`, then enrols the profile in the
 * courses of every claimed cohort and creates compliance records for the claimed and cohort courses. Nothing here
 * fulfils an invitation, so it needs no proof of identity beyond an active membership.
 */
export async function claimEmailOnlyMemberships(
  tx: DbOrTxClient,
  params: { orgId: string; email: string; profileId: string },
  deps: TInviteEnrollmentDeps = {}
): Promise<TEmailOnlyClaim> {
  const email = normalizeEmail(params.email);
  const groupClaim = await claimEmailOnlyGroupMembers(params.orgId, email, params.profileId, tx);
  const cohortClaim = await claimEmailOnlyCohortMembers(params.orgId, email, params.profileId, tx);
  const programClaim = await claimEmailOnlyProgramMembers(params.orgId, email, params.profileId, tx);
  const claimedCourses = await getCoursesByGroupIds(groupClaim.claimedGroupIds, tx);
  const claimed: TBindClaimed = {
    groups: groupClaim.claimed,
    cohorts: cohortClaim.claimed,
    programs: programClaim.claimed,
    removedDuplicates: groupClaim.removedDuplicates + cohortClaim.removedDuplicates + programClaim.removedDuplicates,
    courseIds: claimedCourses.map((course) => course.courseId),
    cohortIds: cohortClaim.claimedCohortIds
  };

  const hasClaims = claimed.courseIds.length > 0 || claimed.cohortIds.length > 0;
  const enrollment = hasClaims
    ? await enrollOrganizationInviteUserCore(
        tx,
        {
          courseIds: claimed.courseIds,
          cohortIds: claimed.cohortIds,
          profileId: params.profileId,
          email,
          roleId: ROLE.STUDENT
        },
        deps
      )
    : { enrolledMembers: [], complianceRecords: [], cohortMembers: [] };

  return { claimed, enrollment };
}

function addUnique(target: string[], values: string[]) {
  for (const value of values) {
    if (!target.includes(value)) target.push(value);
  }
}

function mergeEnrollment(target: TInviteEnrollment, source: TInviteEnrollment) {
  target.enrolledMembers.push(...source.enrolledMembers);
  target.complianceRecords.push(...source.complianceRecords);
  target.cohortMembers.push(...source.cohortMembers);
}

async function fulfilSameOrgStudentInvites(
  tx: DbOrTxClient,
  params: TBindProfileToOrgEmailParams,
  email: string,
  deps: TInviteEnrollmentDeps
): Promise<{ fulfilled: TBindFulfilled; enrollment: TInviteEnrollment }> {
  const { orgId, profileId } = params;
  const skip = new Set(params.skipInviteIds ?? []);
  const { fulfilled, enrollment } = emptyFulfilment();

  const orgInvites = await listLiveStudentOrgInvitesForEmail(orgId, email, tx);
  for (const invite of orgInvites) {
    if (skip.has(invite.id)) continue;

    const claimedInvite = await claimPendingOrganizationInvite(tx, invite.id, profileId);
    if (!claimedInvite) continue;

    const courseIds = parseCourseIdsFromInviteMetadata(invite.metadata);
    const cohortIds = parseCohortIdsFromInviteMetadata(invite.metadata);
    const inviteEnrollment = await enrollOrganizationInviteUserCore(
      tx,
      { courseIds, cohortIds, profileId, email, roleId: ROLE.STUDENT },
      deps
    );

    fulfilled.orgInvites.push({ inviteId: invite.id, courseIds, cohortIds, enrollment: inviteEnrollment });
    addUnique(fulfilled.courseIds, courseIds);
    addUnique(fulfilled.cohortIds, cohortIds);
    mergeEnrollment(enrollment, inviteEnrollment);
  }

  const courseInvites = await listLiveEmailBoundCourseInvitesInOrg(orgId, email, tx);
  for (const invite of courseInvites) {
    if (skip.has(invite.id)) continue;

    const consumed = await fulfillCourseInvite(invite.id, invite.usedCount, tx);
    if (!consumed) {
      fulfilled.skippedCourseInviteIds.push(invite.id);
      continue;
    }

    const inviteEnrollment = await enrollOrganizationInviteUserCore(
      tx,
      { courseIds: [invite.courseId], cohortIds: [], profileId, email, roleId: ROLE.STUDENT },
      deps
    );

    fulfilled.courseInvites.push({ inviteId: invite.id, courseId: invite.courseId, enrollment: inviteEnrollment });
    addUnique(fulfilled.courseIds, [invite.courseId]);
    mergeEnrollment(enrollment, inviteEnrollment);
  }

  return { fulfilled, enrollment };
}

/**
 * Binds a profile to an email in an organization inside `tx`: links or creates the org membership, applies the
 * accepted invite's role, links email-only course/cohort/program rows, and, when identity is proven and the member is
 * an active student, accepts every other live same-org student invitation for that email. Writes only; the caller
 * runs audits, webhooks and stats after commit. Throws 409 when the email belongs to another account and 403 when a
 * new student seat is not available.
 */
export async function bindProfileToOrgEmail(
  tx: DbOrTxClient,
  params: TBindProfileToOrgEmailParams,
  deps: TInviteEnrollmentDeps = {}
): Promise<TBindResult> {
  const email = normalizeEmail(params.email);
  if (!params.orgId || !params.profileId || !email) {
    throw new AppError('Organization, profile and email are required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await lockOrganizationMemberEmail(tx, params.orgId, email);

  const resolved = await resolveOrganizationMember(tx, params, email);
  const member = await applyInviteRole(tx, resolved.member, params.inviteRoleId, email);
  const isActive = member.status === 'ACTIVE';
  const claim = isActive
    ? await claimEmailOnlyMemberships(tx, { orgId: params.orgId, email, profileId: params.profileId }, deps)
    : null;
  const mayFulfil = params.identityProven && isActive && Number(member.roleId) === ROLE.STUDENT;
  const { fulfilled, enrollment } = mayFulfil
    ? await fulfilSameOrgStudentInvites(tx, params, email, deps)
    : emptyFulfilment();

  return {
    member,
    createdMember: resolved.createdMember,
    linkedPendingMember: resolved.linkedPendingMember,
    claimed: claim?.claimed ?? EMPTY_CLAIM,
    claimEnrollment: claim?.enrollment ?? { enrolledMembers: [], complianceRecords: [], cohortMembers: [] },
    fulfilled,
    enrollment,
    seatCheck: resolved.seatCheck
  };
}
