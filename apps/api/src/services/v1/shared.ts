import {
  getCohortMemberByProfileId,
  getCohortMemberRole,
  getCohortOrganizationId,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function assertCohortBelongsToOrganization(orgId: string, cohortId: string): Promise<void> {
  const cohortOrganizationId = await getCohortOrganizationId(cohortId);
  if (!cohortOrganizationId || cohortOrganizationId !== orgId) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }
}

/**
 * Mirrors `cohortTeamMemberMiddleware`'s rule for the session route: the
 * acting profile must be a cohort tutor/admin, or an org admin. Automation
 * keys are org-scoped, not personally tied to a cohort role, so this checks
 * the key's creator (actorId) the same way a session checks the logged-in
 * user.
 */
export async function assertCohortTeamMemberOrOrgAdmin(cohortId: string, actorId: string | null): Promise<void> {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

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
 * Mirrors `cohortNewsfeedCommentAuthorOrTeamMiddleware`: the acting profile
 * must be the comment's own author, a cohort tutor/admin, or an org admin.
 */
export async function assertCohortNewsfeedCommentAuthorOrTeam(
  cohortId: string,
  actorId: string | null,
  commentAuthorMemberId: string | null
): Promise<void> {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

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
