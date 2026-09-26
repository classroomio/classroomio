import {
  getCohortMemberByProfileId,
  getCohortMemberRole,
  getCohortOrganizationId,
  isCohortMember,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { getOrganizationMemberIdByOrgAndProfile, getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

export type TPublicApiPagination = { page: number; limit: number; total: number; totalPages: number };

export function toPublicApiPagination(page: number, limit: number, total: number): TPublicApiPagination {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return { page, limit, total, totalPages };
}

/** Pages an already-loaded list, for services whose dashboard query has no paging of its own. */
export function paginateInMemory<T>(items: T[], query: { page: number; limit: number }) {
  const start = (query.page - 1) * query.limit;

  return {
    items: items.slice(start, start + query.limit),
    pagination: toPublicApiPagination(query.page, query.limit, items.length)
  };
}

export function assertAutomationActor(actorId: string | null): asserts actorId is string {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }
}

export async function assertCohortBelongsToOrganization(orgId: string, cohortId: string): Promise<void> {
  const cohortOrganizationId = await getCohortOrganizationId(cohortId);
  if (!cohortOrganizationId || cohortOrganizationId !== orgId) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }
}

export async function assertCourseBelongsToOrganization(orgId: string, courseId: string): Promise<void> {
  const courseOrganizationId = await getCourseOrganizationId(courseId);
  if (!courseOrganizationId || courseOrganizationId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
}

export async function assertProfileBelongsToOrganization(orgId: string, profileId: string): Promise<void> {
  const memberId = await getOrganizationMemberIdByOrgAndProfile(orgId, profileId);
  if (!memberId) {
    throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
  }
}

/**
 * Mirrors `orgTeamMemberMiddleware` for the key's creator: the actor must be an org admin or tutor.
 * Throws 401 without an actor and 403 otherwise.
 */
export async function assertOrgTeamMember(orgId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const roleId = await getOrganizationMemberRoleId(orgId, actorId);
  if (roleId === ROLE.ADMIN || roleId === ROLE.TUTOR) {
    return;
  }

  throw new AppError(
    'Automation actor must be an organization admin or tutor',
    ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
    403
  );
}

/**
 * Mirrors `orgAdminMiddleware` for the key's creator: the actor must be an org admin.
 * Throws 401 without an actor and 403 otherwise.
 */
export async function assertOrgAdmin(orgId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const roleId = await getOrganizationMemberRoleId(orgId, actorId);
  if (roleId === ROLE.ADMIN) {
    return;
  }

  throw new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
}

/**
 * Mirrors `courseTeamMemberMiddleware` for the key's creator: the actor must be a course tutor/admin or an org admin.
 * Throws 401 without an actor and 403 otherwise.
 */
export async function assertCourseTeamMemberOrOrgAdmin(courseId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const isAllowed = await isCourseTeamMemberOrOrgAdmin(courseId, actorId);
  if (!isAllowed) {
    throw new AppError(
      'Automation actor must be a course tutor/admin or an organization admin',
      ErrorCodes.FORBIDDEN,
      403
    );
  }
}

/**
 * Mirrors `cohortMemberMiddleware` for the key's creator: the actor must be a member of the cohort or an org admin.
 * Throws 401 without an actor and 403 otherwise.
 */
export async function assertCohortMemberOrOrgAdmin(cohortId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const [isMember, isOrgAdmin] = await Promise.all([
    isCohortMember(cohortId, actorId),
    isOrgAdminByCohortId(cohortId, actorId)
  ]);

  if (isMember || isOrgAdmin) {
    return;
  }

  throw new AppError(
    'Automation actor must be a cohort member or an organization admin',
    ErrorCodes.COHORT_FORBIDDEN,
    403
  );
}

/**
 * Mirrors `cohortTeamMemberMiddleware` for the key's creator: the actor must be a cohort tutor/admin or an org admin.
 * Throws 401 without an actor and 403 otherwise.
 */
export async function assertCohortTeamMemberOrOrgAdmin(cohortId: string, actorId: string | null): Promise<void> {
  assertAutomationActor(actorId);

  const [roleId, isOrgAdmin] = await Promise.all([
    getCohortMemberRole(cohortId, actorId),
    isOrgAdminByCohortId(cohortId, actorId)
  ]);

  if (roleId === ROLE.TUTOR || roleId === ROLE.ADMIN || isOrgAdmin) {
    return;
  }

  throw new AppError(
    'Automation actor must be a cohort tutor/admin or an organization admin',
    ErrorCodes.COHORT_FORBIDDEN,
    403
  );
}

/**
 * Mirrors `cohortNewsfeedCommentAuthorOrTeamMiddleware` for the key's creator: the actor must be the comment's
 * author, a cohort tutor/admin, or an org admin. Throws 401 without an actor and 403 otherwise.
 */
export async function assertCohortNewsfeedCommentAuthorOrTeam(
  cohortId: string,
  actorId: string | null,
  commentAuthorMemberId: string | null
): Promise<void> {
  assertAutomationActor(actorId);

  const [actorMember, roleId, isOrgAdmin] = await Promise.all([
    getCohortMemberByProfileId(cohortId, actorId),
    getCohortMemberRole(cohortId, actorId),
    isOrgAdminByCohortId(cohortId, actorId)
  ]);

  const isAuthor = Boolean(actorMember && commentAuthorMemberId && actorMember.id === commentAuthorMemberId);
  if (isAuthor || roleId === ROLE.TUTOR || roleId === ROLE.ADMIN || isOrgAdmin) {
    return;
  }

  throw new AppError('Only the comment author or a cohort team member can do this', ErrorCodes.COHORT_FORBIDDEN, 403);
}
