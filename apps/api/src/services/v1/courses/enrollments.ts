import { ROLE } from '@cio/utils/constants';
import { getOrganizationMembersByNormalizedEmails } from '@cio/db/queries/organization';
import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import { findActiveCourseInviteIdForEmail } from '@cio/db/queries/course/invite';
import type { TEventSource } from '@cio/core/services/posthog';
import type { TPublicApiCourseParam, TPublicApiEnrollCourseStudent } from '@cio/utils/validation/public-api';

import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { createEmailInviteAndSend, resolveCourseInviteContext } from '@api/services/course/invite';
import { reserveCourseInviteCreation } from '@api/services/course/invite-rate-limit';
import { captureLearnerInvited } from '@api/services/product-events';
import { addCourseMemberService } from './members';
import { assertAutomationActor, assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '../shared';

const ENROLLMENT_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Enrolls `email` as a student: an existing organization student is added directly, someone new gets a single-use
 * invite. Repeating the call changes nothing and reports `already_enrolled` or `already_invited`. A new invite
 * spends the actor's course invite budget, which repeats do not.
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
  const context = await resolveCourseInviteContext(params.courseId);
  const expiresAt = new Date(Date.now() + ENROLLMENT_INVITE_TTL_MS).toISOString();
  const invite = await createEmailInviteAndSend({
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
    await releaseInviteBudget();
  }

  if (invite.created) {
    captureLearnerInvited({
      profileId: actorId,
      orgId,
      target: 'course',
      inviteType: 'email',
      count: 1,
      courseId: params.courseId,
      source
    });
  }

  if (invite.created && payload.sendEmail && invite.error) {
    console.error('Enrollment invite email failed:', { inviteId: invite.inviteId, error: invite.error });
  }

  return {
    status: invite.created ? ('invited' as const) : ('already_invited' as const),
    memberId: null,
    inviteId: invite.inviteId,
    email
  };
}
