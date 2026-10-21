import { AppError, ErrorCodes } from '@api/utils/errors';
import { addGroupMember, enrollUsersInCourseGroups, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { getCourseGroupIds, getCourseWithOrgData, lockCourseStatusForAccept } from '@cio/db/queries/course';
import {
  getCohortById,
  getCourseIdsByCohortIds,
  insertCohortMemberIfAbsent,
  lockCohortStatusForAccept
} from '@cio/db/queries/cohort';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TInviteLinkWithContext } from '@cio/db/queries/invite-link';
import type { TInviteLinkResourceType } from '@cio/utils/validation/invite-link';

/** What the public join page renders. */
export type InviteLinkPreview = {
  resourceType: TInviteLinkResourceType;
  resourceName: string;
  description: string | null;
  coverImage: string | null;
  /** False when the resource has stopped accepting joins. */
  isResourceOpen: boolean;
};

export type InviteLinkEnrollResult = {
  isFreshJoin: boolean;
};

type InviteLinkHandler = {
  resolveOrganizationId(resourceId: string): Promise<string>;
  preview(context: TInviteLinkWithContext): InviteLinkPreview;
  /**
   * Runs inside the accept transaction, after org membership is written. Re-locks and
   * re-validates the resource so a concurrent close/archive can't slip past this
   * accept, then performs the durable membership write. Throws if no longer open.
   */
  enrollMembership(
    tx: DbOrTxClient,
    context: TInviteLinkWithContext,
    profileId: string,
    email: string
  ): Promise<InviteLinkEnrollResult>;
  /** Runs after the transaction commits. Best-effort: compliance backfill, cache invalidation, email. */
  afterCommit(
    context: TInviteLinkWithContext,
    profileId: string,
    email: string,
    result: InviteLinkEnrollResult
  ): Promise<void>;
  redirectTo(context: TInviteLinkWithContext): string;
};

function requireCourse(context: TInviteLinkWithContext) {
  if (!context.course) {
    throw new AppError('This invite link is no longer valid', ErrorCodes.NOT_FOUND, 404);
  }

  return context.course;
}

function requireCohort(context: TInviteLinkWithContext) {
  if (!context.cohort) {
    throw new AppError('This invite link is no longer valid', ErrorCodes.NOT_FOUND, 404);
  }

  return context.cohort;
}

/** Failures are swallowed: the learner is already enrolled, so a bad email must not fail the join. */
async function sendCohortWelcomeEmail(input: {
  organization: TInviteLinkWithContext['organization'];
  cohortId: string;
  cohortName: string;
  profileId: string;
  email: string;
}): Promise<void> {
  const { organization, cohortId, cohortName, profileId, email } = input;
  const loginUrl = getDashboardBaseUrl(organization);
  const branding = buildEmailBranding(organization);

  try {
    await enqueueTransactionalEmail('studentCohortWelcome', {
      to: email,
      fields: {
        orgName: organization.name,
        cohortName: cohortName || 'Cohort',
        loginUrl,
        branding
      },
      from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
      idempotencyKey: `invite-link-cohort-welcome:${cohortId}:${profileId}`,
      preference: { organizationId: organization.id, recipientProfileId: profileId }
    });
  } catch (error) {
    console.error('sendCohortWelcomeEmail enqueue error', { cohortId, profileId }, error);
  }
}

const courseHandler: InviteLinkHandler = {
  async resolveOrganizationId(courseId) {
    const courseOrgData = await getCourseWithOrgData(courseId);

    if (!courseOrgData?.orgId) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    return courseOrgData.orgId;
  },

  preview(context) {
    const course = requireCourse(context);

    return {
      resourceType: 'COURSE',
      resourceName: course.title,
      description: course.description,
      coverImage: null,
      // Unpublished courses still accept link joins, like invites bypass self-enrollment.
      isResourceOpen: course.status === 'ACTIVE'
    };
  },

  async enrollMembership(tx, context, profileId, email) {
    const course = requireCourse(context);
    const locked = await lockCourseStatusForAccept(tx, course.id);

    if (!locked || locked.status !== 'ACTIVE') {
      throw new AppError('This invite is no longer accepting new members', ErrorCodes.VALIDATION_ERROR, 403);
    }

    if (!locked.groupId) {
      throw new AppError('This course is not available for enrollment', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const existingMemberId = await getGroupMemberIdByGroupAndProfile(locked.groupId, profileId, tx);
    const isFreshJoin = !existingMemberId;

    if (isFreshJoin) {
      await addGroupMember(
        {
          groupId: locked.groupId,
          roleId: context.invite.roleId,
          profileId,
          email
        },
        tx
      );
    }

    return { isFreshJoin };
  },

  async afterCommit(context, profileId) {
    const course = requireCourse(context);

    await ensureComplianceEnrollmentRecordsForProfiles([course.id], [profileId]);
    await invalidateOrgStats(context.organization.id);
  },

  redirectTo() {
    return '/lms';
  }
};

const cohortHandler: InviteLinkHandler = {
  async resolveOrganizationId(cohortId) {
    const cohort = await getCohortById(cohortId);

    if (!cohort) {
      throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
    }

    return cohort.organizationId;
  },

  preview(context) {
    const cohort = requireCohort(context);

    return {
      resourceType: 'COHORT',
      resourceName: cohort.name,
      description: cohort.description,
      coverImage: cohort.coverImage,
      isResourceOpen: cohort.status === 'ACTIVE'
    };
  },

  async enrollMembership(tx, context, profileId, email) {
    const cohort = requireCohort(context);
    const locked = await lockCohortStatusForAccept(tx, cohort.id);

    if (!locked || locked.status !== 'ACTIVE') {
      throw new AppError('This invite is no longer accepting new members', ErrorCodes.VALIDATION_ERROR, 403);
    }

    const roleId = context.invite.roleId;

    // Not `assignAudienceToCourses`: it filters to org-role STUDENT, silently skipping
    // org admins/tutors. Cohort role is independent of org role.
    const createdMember = await insertCohortMemberIfAbsent({ cohortId: cohort.id, roleId, profileId, email }, tx);
    const isFreshJoin = createdMember !== null;

    // Runs for existing members too, so re-opening the link repairs a partial join.
    const cohortCourseIds = await getCourseIdsByCohortIds([cohort.id], tx);

    if (cohortCourseIds.length > 0) {
      const courseGroups = await getCourseGroupIds(cohortCourseIds, tx);
      const groupIds = courseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];

      await enrollUsersInCourseGroups(groupIds, [{ profileId, email }], roleId, tx);
    }

    return { isFreshJoin };
  },

  async afterCommit(context, profileId, email, { isFreshJoin }) {
    const cohort = requireCohort(context);
    const cohortCourseIds = await getCourseIdsByCohortIds([cohort.id]);

    if (cohortCourseIds.length > 0) {
      await ensureComplianceEnrollmentRecordsForProfiles(cohortCourseIds, [profileId]);
    }

    await invalidateOrgStats(context.organization.id);

    if (isFreshJoin && email) {
      await sendCohortWelcomeEmail({
        organization: context.organization,
        cohortId: cohort.id,
        cohortName: cohort.name,
        profileId,
        email
      });
    }
  },

  redirectTo() {
    return '/lms';
  }
};

/**
 * A new resource type needs: one entry here, one `INVITE_LINK_RESOURCE_TYPE` value,
 * one nullable FK column, and create/toggle routes on that resource's router.
 */
export const INVITE_LINK_HANDLERS: Record<TInviteLinkResourceType, InviteLinkHandler> = {
  COURSE: courseHandler,
  COHORT: cohortHandler
};

export function getInviteLinkHandler(resourceType: string): InviteLinkHandler {
  const handler = INVITE_LINK_HANDLERS[resourceType as TInviteLinkResourceType];

  if (!handler) {
    throw new AppError('Unsupported invite link type', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return handler;
}
