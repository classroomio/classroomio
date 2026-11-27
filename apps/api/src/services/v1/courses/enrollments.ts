import { ROLE } from '@cio/utils/constants';
import {
  getLiveStudentOrgInviteForEmail,
  getOrganizationMembersByNormalizedEmails,
  hasOrganizationInviteEmailBeenSent
} from '@cio/db/queries/organization';
import { parseCourseIdsFromInviteMetadata } from '@cio/utils/functions/invite-metadata';
import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import type { TEventSource } from '@cio/core/services/posthog';
import type { TPublicApiCourseParam, TPublicApiEnrollCourseStudent } from '@cio/utils/validation/public-api';

import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { inviteStudentsToCourseByEmail, type TCourseEmailInviteRecipient } from '@api/services/course/invite';
import { reserveCourseInviteCreation } from '@api/services/course/invite-rate-limit';
import { addCourseMemberService } from './members';
import { assertAutomationActor, assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '../shared';

type TInviteToCourseResult = {
  recipient: TCourseEmailInviteRecipient;
  emailFailed: boolean;
};

/**
 * Enrolls `email` as a student. A student who already joined the organization is added directly; anyone else gets
 * the course on their single organization invite (a new email becomes a pending member and takes a seat). Repeating
 * the call changes nothing and reports `already_enrolled` or `already_invited`; with email sending requested, an
 * invite whose email was never queued is sent again instead. A new invite spends the actor's course invite budget,
 * which is given back when nothing is created. Staff and archived members are refused.
 */
export async function enrollCourseStudentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiEnrollCourseStudent,
  principal: TAutomationPrincipal,
  source: TEventSource = 'public_api'
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  const email = payload.email.trim().toLowerCase();
  const [organizationMember] = await getOrganizationMembersByNormalizedEmails(orgId, [email]);

  if (organizationMember && organizationMember.roleId !== ROLE.STUDENT) {
    throw staffRefusal();
  }

  if (organizationMember && organizationMember.status !== 'ACTIVE') {
    throw archivedRefusal();
  }

  const existingMemberId = await getCourseMemberIdByEmail(params.courseId, email);

  if (existingMemberId) {
    return {
      status: 'already_enrolled' as const,
      memberId: existingMemberId,
      inviteId: null,
      inviteKind: null,
      inviteLink: null,
      email
    };
  }

  if (organizationMember?.profileId) {
    const member = await addCourseMemberService(
      orgId,
      actorId,
      params,
      { email, roleId: ROLE.STUDENT, sendEmail: payload.sendEmail },
      source,
      principal.automationKey.id,
      principal.oauthClientId
    );

    return {
      status: 'enrolled' as const,
      memberId: member.id,
      inviteId: null,
      inviteKind: null,
      inviteLink: null,
      email
    };
  }

  const releaseInviteBudget = await reserveInviteBudgetUnlessInvited(orgId, actorId, params.courseId, email);
  let invited: TInviteToCourseResult;
  try {
    invited = await inviteToCourse(params.courseId, actorId, email, payload.sendEmail, source, 'when-changed');

    if (invited.recipient.status === 'already_invited' && payload.sendEmail && invited.recipient.inviteId) {
      const emailQueued = await hasOrganizationInviteEmailBeenSent(invited.recipient.inviteId);
      if (!emailQueued) {
        invited = await inviteToCourse(params.courseId, actorId, email, true, source, 'always');
      }
    }
  } catch (error) {
    await releaseInviteBudget();
    throw error;
  }

  const { recipient } = invited;
  if (recipient.status !== 'invited') {
    await releaseInviteBudget();
  }

  if (invited.emailFailed) {
    throw new AppError('Failed to send the course invitation email', ErrorCodes.INTERNAL_ERROR, 500, 'email');
  }

  if (recipient.status === 'enrolled' || recipient.status === 'already_enrolled') {
    const memberId = await getCourseMemberIdByEmail(params.courseId, email);

    return {
      status: recipient.status,
      memberId,
      inviteId: null,
      inviteKind: null,
      inviteLink: null,
      email
    };
  }

  return toEnrollmentResult(recipient, email);
}

/**
 * Reserves the actor's course invite budget unless `email`'s live invite already carries the course, so a repeat
 * call that only reports `already_invited` is never refused for being over the limit.
 * @returns A function that gives the reservation back (a no-op when nothing was reserved)
 */
async function reserveInviteBudgetUnlessInvited(
  orgId: string,
  actorId: string,
  courseId: string,
  email: string
): Promise<() => Promise<void>> {
  const liveInvite = await getLiveStudentOrgInviteForEmail(orgId, email);
  const invitedCourseIds = liveInvite ? parseCourseIdsFromInviteMetadata(liveInvite.metadata) : [];
  if (invitedCourseIds.includes(courseId)) return async () => {};

  return reserveCourseInviteCreation(actorId, courseId);
}

function staffRefusal(): AppError {
  return new AppError(
    'This email belongs to an admin or tutor. Add them to the course from the dashboard',
    ErrorCodes.STAFF_CANNOT_ENROLL,
    409,
    'email'
  );
}

function archivedRefusal(): AppError {
  return new AppError(
    'This email belongs to an archived organization member. Restore them in the dashboard before enrolling',
    ErrorCodes.ORG_MEMBER_ARCHIVED,
    409,
    'email'
  );
}

async function inviteToCourse(
  courseId: string,
  actorId: string,
  email: string,
  sendEmail: boolean,
  source: TEventSource,
  reissue: 'always' | 'when-changed'
): Promise<TInviteToCourseResult> {
  const { recipients, emailsFailed } = await inviteStudentsToCourseByEmail(courseId, actorId, [email], {
    sendEmail,
    reissue,
    includeInviteLinks: true,
    source,
    inviteSource: 'V1_ENROLLMENT'
  });
  const [recipient] = recipients;
  if (!recipient) {
    throw new AppError('Failed to invite this student', ErrorCodes.INTERNAL_ERROR, 500, 'email');
  }

  return { recipient, emailFailed: sendEmail && emailsFailed > 0 };
}

function toEnrollmentResult(recipient: TCourseEmailInviteRecipient, email: string) {
  switch (recipient.status) {
    case 'invited':
    case 'already_invited':
      return {
        status: recipient.status,
        memberId: null,
        inviteId: recipient.inviteId,
        inviteKind: 'organization' as const,
        inviteLink: recipient.inviteLink,
        email
      };
    case 'is_staff':
      throw staffRefusal();
    case 'archived':
      throw archivedRefusal();
    case 'over_seat_limit':
      throw new AppError('Your plan has no student seats left', ErrorCodes.UPGRADE_REQUIRED, 403);
    default:
      throw new AppError('Failed to invite this student', ErrorCodes.INTERNAL_ERROR, 500, 'email');
  }
}
