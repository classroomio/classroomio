import {
  getCohortMemberByProfileId,
  getCohortMemberRole,
  getCohortOrganizationId,
  isCohortMember,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

export type TPublicApiPagination = { page: number; limit: number; total: number; totalPages: number };

export function toPublicApiPagination(page: number, limit: number, total: number): TPublicApiPagination {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return { page, limit, total, totalPages };
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

export async function assertProfileBelongsToOrganization(orgId: string, profileId: string): Promise<void> {
  const memberId = await getOrganizationMemberIdByOrgAndProfile(orgId, profileId);
  if (!memberId) {
    throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
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
