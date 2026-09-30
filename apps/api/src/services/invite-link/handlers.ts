import { AppError, ErrorCodes } from '@api/utils/errors';
import { addGroupMember, enrollUsersInCourseGroups, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import {
  getCourseById,
  getCourseGroupIds,
  getCourseWithOrgData,
  lockCourseStatusForAccept
} from '@cio/db/queries/course';
import {
  getCohortById,
  getCourseIdsByCohortIds,
  insertCohortMemberIfAbsent,
  lockCohortStatusForAccept
} from '@cio/db/queries/cohort';
import { ROLE } from '@cio/utils/constants';
import {
  enrollProfileInLearningPath,
  scheduleLearningPathProgressSync,
  sendLearningPathWelcomeEmail
} from '@api/services/learning-path';
import { ensureCohortCourseGrants } from '@api/services/cohort/cohort';
import {
  getCourseIdsInPath,
  getLearningPathById,
  getLearningPathOrgId,
  getMemberByPathAndProfile,
  lockLearningPathStatusForAccept
} from '@cio/db/queries/learning-path';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { recordDirectCourseGrant } from '@api/services/course/enrollment-grants';
import { assertCourseAllowsDirectStudentAdd, assertCourseNotPathGated } from '@api/services/course/path-gate';
import { trackServerEvent, SERVER_EVENTS } from '@cio/analytics';
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
  /**
   * Throws when the resource may not have an enabled share link. Checked when
   * a link is created or re-enabled; viewing and disabling stay allowed.
   */
  assertCanEnableLink?(resourceId: string): Promise<void>;
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

function requireLearningPath(context: TInviteLinkWithContext) {
  if (!context.learningPath) {
    throw new AppError('This invite link is no longer valid', ErrorCodes.NOT_FOUND, 404);
  }

  return context.learningPath;
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

async function sendCourseWelcomeEmail(input: {
  organization: TInviteLinkWithContext['organization'];
  course: NonNullable<TInviteLinkWithContext['course']>;
  profileId: string;
  email: string;
}): Promise<void> {
  const { organization, course, profileId, email } = input;
  const loginUrl = getDashboardBaseUrl(organization);
  const branding = buildEmailBranding(organization);

  try {
    await enqueueTransactionalEmail('studentCourseWelcome', {
      to: email,
      fields: {
        orgName: organization.name,
        courseName: course.title || 'Course',
        loginUrl,
        customMessage: course.welcomeEmailMessage ?? undefined,
        branding
      },
      from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
      idempotencyKey: `invite-link-course-welcome:${course.id}:${profileId}`,
      preference: { organizationId: organization.id, recipientProfileId: profileId }
    });
  } catch (error) {
    console.error('sendCourseWelcomeEmail enqueue error', { courseId: course.id, profileId }, error);
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

  // Path-only courses are joined through their learning path, never a course link.
  async assertCanEnableLink(courseId) {
    await assertCourseAllowsDirectStudentAdd(courseId);
  },

  preview(context) {
    const course = requireCourse(context);

    return {
      resourceType: 'COURSE',
      resourceName: course.title,
      description: course.description,
      coverImage: null,
      // Unpublished courses still accept link joins, like invites bypass self-enrollment.
      // A link made before the course became path-only reads as closed.
      isResourceOpen: course.status === 'ACTIVE' && !course.requiresLearningPath
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

    const [courseRow] = await getCourseById(course.id, tx);

    assertCourseNotPathGated(courseRow);

    const existingMemberId = await getGroupMemberIdByGroupAndProfile(locked.groupId, profileId, tx);
    const isFreshJoin = !existingMemberId;

    if (isFreshJoin) {
      const [createdMember] = await addGroupMember(
        {
          groupId: locked.groupId,
          roleId: context.invite.roleId,
          profileId,
          email
        },
        tx
      );

      if (createdMember) {
        // Team joins are role-based and intentionally grant-less (the ledger
        // models learner access only); only students record provenance.
        if (context.invite.roleId === ROLE.STUDENT) {
          await recordDirectCourseGrant(
            { groupmemberId: createdMember.id, courseId: course.id, profileId },
            { source: 'INVITE' },
            tx
          );
        }
      }
    }

    return { isFreshJoin };
  },

  async afterCommit(context, profileId, email, { isFreshJoin }) {
    const course = requireCourse(context);

    await ensureComplianceEnrollmentRecordsForProfiles([course.id], [profileId]);
    await invalidateOrgStats(context.organization.id);

    if (isFreshJoin && email && context.invite.roleId === ROLE.STUDENT) {
      await sendCourseWelcomeEmail({
        organization: context.organization,
        course,
        profileId,
        email
      });
    }
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
      await ensureCohortCourseGrants(cohort.id, profileId, profileId, tx, cohortCourseIds);
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

const learningPathHandler: InviteLinkHandler = {
  async resolveOrganizationId(learningPathId) {
    const orgId = await getLearningPathOrgId(learningPathId);

    if (!orgId) {
      throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
    }

    return orgId;
  },

  preview(context) {
    const learningPath = requireLearningPath(context);

    return {
      resourceType: 'LEARNING_PATH',
      resourceName: learningPath.name,
      description: learningPath.description,
      coverImage: learningPath.coverImage,
      isResourceOpen: learningPath.status === 'ACTIVE'
    };
  },

  async enrollMembership(tx, context, profileId, email) {
    const learningPath = requireLearningPath(context);
    const locked = await lockLearningPathStatusForAccept(learningPath.id, tx);

    if (!locked || locked.status !== 'ACTIVE') {
      throw new AppError('This invite is no longer accepting new members', ErrorCodes.VALIDATION_ERROR, 403);
    }

    const path = await getLearningPathById(learningPath.id, tx);

    if (!path) {
      throw new AppError('This invite link is no longer valid', ErrorCodes.NOT_FOUND, 404);
    }

    const existing = await getMemberByPathAndProfile(learningPath.id, profileId, tx);
    const isFreshJoin = !existing;

    await enrollProfileInLearningPath(
      path,
      {
        profileId,
        email,
        roleId: existing?.roleId ?? context.invite.roleId,
        grantedByProfileId: profileId
      },
      tx
    );

    return { isFreshJoin };
  },

  async afterCommit(context, profileId, email, { isFreshJoin }) {
    const learningPath = requireLearningPath(context);
    const pathCourseIds = await getCourseIdsInPath(learningPath.id);

    if (pathCourseIds.length > 0) {
      await ensureComplianceEnrollmentRecordsForProfiles(pathCourseIds, [profileId]);
    }

    await invalidateOrgStats(context.organization.id);

    if (isFreshJoin && email && context.invite.roleId === ROLE.STUDENT) {
      trackServerEvent({
        eventType: SERVER_EVENTS.ENROLLMENT_COMPLETED,
        orgId: context.organization.id,
        userId: profileId,
        props: { path: 'learning-path', learningPathId: learningPath.id, source: 'invite-link' }
      });

      await sendLearningPathWelcomeEmail({
        organization: context.organization,
        learningPath,
        profileId,
        email,
        idempotencyKey: `invite-link-learning-path-welcome:${learningPath.id}:${profileId}`
      });
    }

    if (context.invite.roleId === ROLE.STUDENT) {
      // Prior work in the path's courses counts, so an effectively finished path completes now.
      scheduleLearningPathProgressSync({ pathId: learningPath.id, profileIds: [profileId] });
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
  COHORT: cohortHandler,
  LEARNING_PATH: learningPathHandler
};

export function getInviteLinkHandler(resourceType: string): InviteLinkHandler {
  const handler = INVITE_LINK_HANDLERS[resourceType as TInviteLinkResourceType];

  if (!handler) {
    throw new AppError('Unsupported invite link type', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return handler;
}
