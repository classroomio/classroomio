import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { listAnalyticsScopeCourseIds } from '@cio/db/queries/analytics';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { ROLE } from '@cio/utils/constants';
import type { TAnalyticsScopeType } from '@cio/utils/constants/analytics';
import type { TAnalyticsScope } from '@cio/utils/validation/analytics';

import { AppError, ErrorCodes } from '@api/utils/errors';
import type { AuthorizedAnalyticsScope, AnalyticsActor } from './types';

type ScopeAssertion = (actor: AnalyticsActor, scopeId: string, isOrgAdmin: boolean) => Promise<void>;

function scopeNotFound(): AppError {
  return new AppError('Analytics scope not found', ErrorCodes.ANALYTICS_SCOPE_NOT_FOUND, 404);
}

function scopeForbidden(): AppError {
  return new AppError('You do not have access to these analytics', ErrorCodes.ANALYTICS_SCOPE_FORBIDDEN, 403);
}

async function assertOrgScope(actor: AnalyticsActor, orgId: string, isOrgAdmin: boolean): Promise<void> {
  if (orgId !== actor.orgId) throw scopeNotFound();

  if (!isOrgAdmin) throw scopeForbidden();
}

async function assertCohortScope(actor: AnalyticsActor, cohortId: string, isOrgAdmin: boolean): Promise<void> {
  const cohortOrgId = await getCohortOrganizationId(cohortId);
  if (cohortOrgId !== actor.orgId) throw scopeNotFound();

  if (isOrgAdmin) return;

  const cohortRoleId = await getCohortMemberRole(cohortId, actor.profileId);
  if (cohortRoleId !== ROLE.ADMIN && cohortRoleId !== ROLE.TUTOR) throw scopeForbidden();
}

async function assertCourseScope(actor: AnalyticsActor, courseId: string): Promise<void> {
  const courseOrgId = await getCourseOrganizationId(courseId);
  if (courseOrgId !== actor.orgId) throw scopeNotFound();

  const isCourseTeam = await isCourseTeamMemberOrOrgAdmin(courseId, actor.profileId);
  if (!isCourseTeam) throw scopeForbidden();
}

const SCOPE_ASSERTIONS: Record<TAnalyticsScopeType, ScopeAssertion> = {
  org: assertOrgScope,
  cohort: assertCohortScope,
  course: assertCourseScope
};

/**
 * Checks the actor may read the scope in their verified org, then returns it with its course ids.
 * Throws 404 for a scope in another org and 403 for a scope the actor cannot see.
 */
export async function resolveAuthorizedScope(
  actor: AnalyticsActor,
  scope: TAnalyticsScope
): Promise<AuthorizedAnalyticsScope> {
  const isOrgAdmin = actor.orgRoles[actor.orgId] === ROLE.ADMIN;
  await SCOPE_ASSERTIONS[scope.type](actor, scope.id, isOrgAdmin);

  const scopeRef = { orgId: actor.orgId, type: scope.type, id: scope.id };
  const courseIds = await listAnalyticsScopeCourseIds(scopeRef);

  return { ...scopeRef, courseIds };
}
