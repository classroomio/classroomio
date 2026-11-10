import { ROLE } from '@cio/utils/constants';
import { revokeCourseInvite } from '@cio/db/queries/course/invite';
import { getOrganizationMembersByNormalizedEmails } from '@cio/db/queries/organization';
import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import { findActiveCourseInviteIdForEmail } from '@cio/db/queries/course/invite';
import type { TEventSource } from '@cio/core/services/posthog';
import type { TPublicApiCourseParam, TPublicApiEnrollCourseStudent } from '@cio/utils/validation/public-api';

import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { createEmailInviteAndSend, resolveCourseInviteContext } from '@api/services/course/invite';
import type { TCreateEmailInviteResult } from '@api/services/course/invite';
import { reserveCourseInviteCreation } from '@api/services/course/invite-rate-limit';
import { captureLearnerInvited } from '@api/services/product-events';
import { addCourseMemberService } from './members';
import { assertAutomationActor, assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '../shared';

const ENROLLMENT_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Enrolls `email` as a student: an existing organization student is added directly, someone new gets a single-use
 * invite. Repeating the call changes nothing and reports `already_enrolled` or `already_invited`. A new invite
 * spends the actor's course invite budget: it is reserved first so over-limit callers are rejected before any
 * reads, and every path that creates nothing gives it back. Archived organization members are refused instead of
 * gaining a course seat they cannot use. When the invitation email cannot be queued, the fresh invite is revoked
 * and the call fails, so a retry sends a new email instead of reporting `already_invited`.
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
  const existingMemberId = await getCourseMemberIdByEmail(params.courseId, email);

  if (existingMemberId) {
    return { status: 'already_enrolled' as const, memberId: existingMemberId, inviteId: null, email };
  }

  const [organizationMember] = await getOrganizationMembersByNormalizedEmails(orgId, [email]);

  if (organizationMember && organizationMember.roleId !== ROLE.STUDENT) {
    throw new AppError(
      'This email belongs to an admin or tutor. Add them to the course from the dashboard',
      ErrorCodes.STAFF_CANNOT_ENROLL,
      409,
      'email'
    );
  }

  if (organizationMember && organizationMember.status !== 'ACTIVE') {
    throw new AppError(
      'This email belongs to an archived organization member. Restore them in the dashboard before enrolling',
      ErrorCodes.ORG_MEMBER_ARCHIVED,
      409,
      'email'
    );
  }

  if (organizationMember) {
    const member = await addCourseMemberService(
      orgId,
      actorId,
      params,
      { email, roleId: ROLE.STUDENT, sendEmail: payload.sendEmail },
      source,
      principal.automationKey.id,
      principal.oauthClientId
    );

    return { status: 'enrolled' as const, memberId: member.id, inviteId: null, email };
  }

  const activeInviteId = await findActiveCourseInviteIdForEmail(params.courseId, email);

  if (activeInviteId) {
    return { status: 'already_invited' as const, memberId: null, inviteId: activeInviteId, email };
  }

  const releaseInviteBudget = await reserveCourseInviteCreation(actorId, params.courseId);
  let budgetReleased = false;
  const releaseBudgetOnce = async () => {
    if (budgetReleased) return;
    budgetReleased = true;
    await releaseInviteBudget();
  };

  try {
    const context = await resolveCourseInviteContext(params.courseId);
    const expiresAt = new Date(Date.now() + ENROLLMENT_INVITE_TTL_MS).toISOString();
    const invite: TCreateEmailInviteResult = await createEmailInviteAndSend({
      courseId: params.courseId,
      createdByProfileId: actorId,
      recipientEmail: email,
      policy: { expiresAt, maxUses: 1 },
      orgName: context.orgName,
      organizationId: context.organizationId,
      courseName: context.courseName,
      courseSlug: context.courseSlug,
      org: context.org,
      branding: context.branding,
      shouldSend: payload.sendEmail,
      reuseActiveInvite: true
    });

    if (!invite.created) {
      await releaseBudgetOnce();

      return { status: 'already_invited' as const, memberId: null, inviteId: invite.inviteId, email };
    }

    if (payload.sendEmail && invite.error) {
      try {
        await revokeCourseInvite(params.courseId, invite.inviteId, actorId);
      } catch (revokeError) {
        console.error('Enrollment invite cleanup failed:', { inviteId: invite.inviteId, error: revokeError });
      }

      await releaseBudgetOnce();
      throw new AppError('Failed to send the course invitation email', ErrorCodes.INTERNAL_ERROR, 500, 'email');
    }

    captureLearnerInvited({
      profileId: actorId,
      orgId,
      target: 'course',
      inviteType: 'email',
      count: 1,
      courseId: params.courseId,
      source
    });

    return { status: 'invited' as const, memberId: null, inviteId: invite.inviteId, email };
  } catch (error) {
    await releaseBudgetOnce();
    throw error;
  }
}
