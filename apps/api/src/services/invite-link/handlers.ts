import { AppError, ErrorCodes } from '@api/utils/errors';
import { addGroupMember, enrollUsersInCourseGroups, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { getCourseGroupIds, getCourseWithOrgData } from '@cio/db/queries/course';
import {
  addCohortMember,
  getCohortById,
  getCourseIdsByCohortIds,
  getExistingCohortMembers
} from '@cio/db/queries/cohort';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import type { TInviteLinkWithContext } from '@cio/db/queries/invite-link';
import type { TInviteLinkResourceType } from '@cio/utils/validation/invite-link';

/** What the public join page renders, discriminated on `resourceType`. */
export type InviteLinkPreview = {
  resourceType: TInviteLinkResourceType;
  /** Display name of the thing being joined — course title or cohort name. */
  resourceName: string;
  description: string | null;
  coverImage: string | null;
  /** False when the resource itself has stopped accepting joins (archived cohort, inactive course). */
  isResourceOpen: boolean;
};

type InviteLinkHandler = {
  /**
   * Resolves the owning organization for a resource id, so link creation never needs
   * the caller to pass an org and can't be pointed at another tenant's resource.
   */
  resolveOrganizationId(resourceId: string): Promise<string>;
  /** Shapes the join-page payload for this resource type. */
  preview(context: TInviteLinkWithContext): InviteLinkPreview;
  /**
   * Resource-specific enrollment. Runs *after* the generic accept has committed org
   * membership, so the profile is already a member of the org with `roleId`.
   */
  enroll(context: TInviteLinkWithContext, profileId: string, email: string): Promise<void>;
  /** Where the learner lands once they are in. */
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

/**
 * Org-branded cohort welcome, matching the audience-import path. Failures are logged
 * and swallowed: the learner is already enrolled, so a bounced email must not fail the
 * join.
 */
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
    console.error(`sendCohortWelcomeEmail enqueue error for ${email}:`, error);
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
      // A share link is an explicit staff act, so an unpublished course still accepts
      // joins through it — the same way invites already bypass self-enrollment rules.
      isResourceOpen: course.status === 'ACTIVE'
    };
  },

  async enroll(context, profileId, email) {
    const course = requireCourse(context);
    const [groupMapping] = await getCourseGroupIds([course.id]);

    if (!groupMapping?.groupId) {
      throw new AppError('This course is not available for enrollment', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const existingMemberId = await getGroupMemberIdByGroupAndProfile(groupMapping.groupId, profileId);

    if (!existingMemberId) {
      await addGroupMember({
        groupId: groupMapping.groupId,
        roleId: context.invite.roleId,
        profileId,
        email
      });
    }

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

  async enroll(context, profileId, email) {
    const cohort = requireCohort(context);
    const roleId = context.invite.roleId;

    // Composed from the query layer rather than delegating to `assignAudienceToCourses`:
    // that path filters to profiles whose *organization* role is STUDENT, which silently
    // skips anyone who is already an org ADMIN or TUTOR. Cohort role is independent of
    // org role, so a staff member joining a cohort via its link must still be enrolled.
    const existing = await getExistingCohortMembers([{ cohortId: cohort.id, profileId }]);
    const isAlreadyCohortMember = existing.has(`${cohort.id}:${profileId}`);

    if (!isAlreadyCohortMember) {
      await addCohortMember({ cohortId: cohort.id, roleId, profileId, email });
    }

    // Runs for existing members too, so re-opening the link repairs a partial join.
    const cohortCourseIds = await getCourseIdsByCohortIds([cohort.id]);

    if (cohortCourseIds.length > 0) {
      const courseGroups = await getCourseGroupIds(cohortCourseIds);
      const groupIds = courseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];

      await enrollUsersInCourseGroups(groupIds, [{ profileId, email }], roleId);
      await ensureComplianceEnrollmentRecordsForProfiles(cohortCourseIds, [profileId]);
    }

    await invalidateOrgStats(context.organization.id);

    if (!isAlreadyCohortMember && email) {
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
 * Adding a new invite-link resource type means: one entry here, one enum value in
 * `INVITE_LINK_RESOURCE_TYPE`, one nullable FK column, and thin create/toggle routes
 * on that resource's router. No new table, no new join page, no new UI.
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
