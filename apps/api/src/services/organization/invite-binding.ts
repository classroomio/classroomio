import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TGroupmember } from '@cio/db/types';
import { getCoursesByGroupIds, getCourseTitlesByIds } from '@cio/db/queries/course';
import { getCohortsByOrg } from '@cio/db/queries/cohort';
import { createCourseInviteAudit } from '@cio/db/queries/course/invite';
import {
  bindProfileToOrgEmail,
  type TBindProfileToOrgEmailParams,
  type TBindResult,
  type TBindTrigger
} from '@cio/core/services/organization/identity-binding';
import type { TInviteEnrollment } from '@cio/core/services/organization/invite-enrollment';
import {
  buildMemberSource,
  emitCohortMemberWebhookEvent,
  emitCourseMemberAddedWebhookEvent,
  emitCourseWebhookEvent,
  emitOrganizationMemberWebhookEvent
} from '@cio/core/services/webhook/emit';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';

import { emitComplianceEnrollmentEvents, ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { captureLearnersEnrolled } from '../product-events';
import { recordOrganizationInviteAudits } from './invite-audit';
import { buildStudentMilestoneNotification, notifyStudentMilestone } from './student-limit';

export type TBindRequestContext = { ipAddress?: string | null; userAgent?: string | null };

export type TInviteFulfilment = {
  courses: { id: string; title: string | null }[];
  cohorts: { id: string; name: string | null }[];
};

/**
 * Runs `bindProfileToOrgEmail` on `tx` with compliance records created inside the transaction.
 */
export function bindProfileInOrg(tx: DbOrTxClient, params: TBindProfileToOrgEmailParams): Promise<TBindResult> {
  return bindProfileToOrgEmail(tx, params, {
    ensureComplianceEnrollmentRecords: (courseIds, profileIds, dbClient) =>
      ensureComplianceEnrollmentRecordsForProfiles(courseIds, profileIds, dbClient ?? tx)
  });
}

/**
 * Emits cohort member webhooks and compliance events for an enrolment written inside a committed transaction.
 */
export async function emitInviteEnrollmentEvents(
  organizationId: string,
  actorProfileId: string,
  enrollment: TInviteEnrollment
): Promise<void> {
  await emitComplianceEnrollmentEvents(enrollment.complianceRecords);

  for (const cohortMember of enrollment.cohortMembers) {
    await emitCohortMemberWebhookEvent(
      'cohort.member.added',
      organizationId,
      cohortMember.cohortId,
      cohortMember,
      actorProfileId
    );
  }
}

/**
 * Emits `course.member.added` for each new course membership: attributed to the invite that granted it, or to the
 * cohort enrolment when `inviteId` is `cohort`.
 */
export async function emitCourseMembersAdded(
  members: TGroupmember[],
  source: { inviteId: string | 'cohort' | null; actorProfileId: string }
): Promise<void> {
  if (members.length === 0) return;

  const courses = await getCoursesByGroupIds([...new Set(members.map((member) => member.groupId))]);
  const courseIdByGroupId = new Map(courses.map((course) => [course.groupId, course.courseId]));
  const memberSource =
    source.inviteId === 'cohort'
      ? buildMemberSource('cohort')
      : buildMemberSource('invite', { inviteId: source.inviteId });

  for (const member of members) {
    const courseId = courseIdByGroupId.get(member.groupId);
    if (!courseId) continue;

    await emitCourseMemberAddedWebhookEvent(courseId, member, {
      source: memberSource,
      actorProfileId: source.actorProfileId
    });
  }
}

/**
 * Audit row and `course.invite.accepted` webhook for course access accepted from an invitation. `inviteId` is the
 * course invite id, or the organization invite id when the course was carried on an org invite.
 */
export async function recordCourseInviteAccepted(input: {
  inviteId: string;
  courseId: string;
  profileId: string;
  email: string;
  metadata: Record<string, unknown>;
  courseInviteRow: boolean;
}): Promise<void> {
  if (input.courseInviteRow) {
    await createCourseInviteAudit({
      inviteId: input.inviteId,
      courseId: input.courseId,
      eventType: 'ACCEPTED',
      actorProfileId: input.profileId,
      targetEmail: input.email,
      metadata: input.metadata
    });
  }

  await emitCourseWebhookEvent(input.courseId, 'course.invite.accepted', {
    inviteId: input.inviteId,
    inviteLinkId: null,
    email: input.email,
    actorProfileId: input.profileId
  });
}

async function runLogged(label: string, task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    console.error(`${label} error:`, error);
  }
}

/**
 * Post-commit effects of a binding: audits and webhooks for every auto-accepted invite, course and cohort member
 * webhooks, compliance records for linked courses, stats, analytics, the new-member webhook and the seat milestone
 * email. Each effect logs its own failure and never throws.
 */
export async function runBindingSideEffects(
  result: TBindResult,
  input: { orgId: string; profileId: string; email: string; trigger: TBindTrigger; context?: TBindRequestContext }
): Promise<void> {
  const { orgId, profileId, email, trigger } = input;
  const metadata = { autoFulfilled: true, trigger };

  if (result.createdMember) {
    await runLogged('binding organization.member.added', () =>
      emitOrganizationMemberWebhookEvent('organization.member.added', orgId, result.member, profileId)
    );
  }

  for (const orgInvite of result.fulfilled.orgInvites) {
    await runLogged('binding org invite accepted', async () => {
      await recordOrganizationInviteAudits([
        {
          inviteId: orgInvite.inviteId,
          organizationId: orgId,
          eventType: 'ACCEPTED',
          actorProfileId: profileId,
          targetEmail: email,
          ipAddress: input.context?.ipAddress ?? null,
          userAgent: input.context?.userAgent ?? null,
          metadata
        }
      ]);
      for (const courseId of orgInvite.courseIds) {
        await recordCourseInviteAccepted({
          inviteId: orgInvite.inviteId,
          courseId,
          profileId,
          email,
          metadata,
          courseInviteRow: false
        });
      }
      await emitCourseMembersAdded(orgInvite.enrollment.enrolledMembers, {
        inviteId: orgInvite.inviteId,
        actorProfileId: profileId
      });
      await emitInviteEnrollmentEvents(orgId, profileId, orgInvite.enrollment);
    });
  }

  for (const courseInvite of result.fulfilled.courseInvites) {
    await runLogged('binding course invite accepted', async () => {
      await recordCourseInviteAccepted({
        inviteId: courseInvite.inviteId,
        courseId: courseInvite.courseId,
        profileId,
        email,
        metadata,
        courseInviteRow: true
      });
      await emitCourseMembersAdded(courseInvite.enrollment.enrolledMembers, {
        inviteId: courseInvite.inviteId,
        actorProfileId: profileId
      });
      await emitInviteEnrollmentEvents(orgId, profileId, courseInvite.enrollment);
    });
  }

  await runLogged('binding claimed memberships', async () => {
    await emitCourseMembersAdded(result.claimEnrollment.enrolledMembers, {
      inviteId: 'cohort',
      actorProfileId: profileId
    });
    await emitComplianceEnrollmentEvents(result.claimEnrollment.complianceRecords);
  });

  const enrolledMembers = [...result.enrollment.enrolledMembers, ...result.claimEnrollment.enrolledMembers];
  if (enrolledMembers.length > 0 || result.claimed.groups > 0 || result.createdMember || result.linkedPendingMember) {
    await runLogged('binding invalidateOrgStats', () => invalidateOrgStats(orgId));
  }

  if (enrolledMembers.length > 0) {
    captureLearnersEnrolled(enrolledMembers, 'org_invite');
  }

  const milestone = buildStudentMilestoneNotification(orgId, result.seatCheck);
  if (milestone) {
    notifyStudentMilestone(milestone).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }
}

/**
 * Titles of the courses and names of the cohorts a binding auto-accepted, for the additive `fulfilled` field of an
 * accept response. `excludeCourseIds` drops courses the caller reports separately.
 */
export async function buildFulfilledSummary(
  orgId: string,
  result: TBindResult,
  excludeCourseIds: string[] = []
): Promise<TInviteFulfilment> {
  const courseIds = result.fulfilled.courseIds.filter((id) => !excludeCourseIds.includes(id));
  const cohortIds = result.fulfilled.cohortIds;
  const [courseTitles, cohorts] = await Promise.all([
    courseIds.length > 0 ? getCourseTitlesByIds(courseIds) : new Map<string, string | null>(),
    cohortIds.length > 0 ? getCohortsByOrg(orgId, cohortIds) : []
  ]);

  return {
    courses: courseIds.map((id) => ({ id, title: courseTitles.get(id) ?? null })),
    cohorts: cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name ?? null }))
  };
}
