import { AppError, ErrorCodes } from '@api/utils/errors';
import { addGroupMember, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { getCourseGroupIds, getCourseWithOrgData } from '@cio/db/queries/course';
import { getCohortById } from '@cio/db/queries/cohort';
import { assignAudienceToCourses } from '@api/services/organization/audience';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
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

  async enroll(context, profileId) {
    const cohort = requireCohort(context);

    // Reuses the shared audience path, which creates the cohort_member row, enrols the
    // profile in every course attached to the cohort, writes compliance records, sends
    // the cohort welcome email and invalidates org stats. Idempotent on re-run.
    await assignAudienceToCourses(context.organization.id, {
      profileIds: [profileId],
      cohortIds: [cohort.id],
      sendEmail: true
    });
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
