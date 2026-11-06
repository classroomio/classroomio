import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { listInsightsScopeCourseIds } from '@cio/db/queries/insights';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { ROLE } from '@cio/utils/constants';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';
import type { TInsightsScope } from '@cio/utils/validation/insights';

import { AppError, ErrorCodes } from '@api/utils/errors';
import type { AuthorizedInsightsScope, InsightsActor } from './types';

type ScopeAssertion = (actor: InsightsActor, scopeId: string, isOrgAdmin: boolean) => Promise<void>;

function scopeNotFound(): AppError {
  return new AppError('Analytics scope not found', ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, 404);
}

function scopeForbidden(): AppError {
  return new AppError('You do not have access to these analytics', ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, 403);
}

async function assertOrgScope(actor: InsightsActor, orgId: string, isOrgAdmin: boolean): Promise<void> {
  if (orgId !== actor.orgId) throw scopeNotFound();

  if (!isOrgAdmin) throw scopeForbidden();
}

async function assertCohortScope(actor: InsightsActor, cohortId: string, isOrgAdmin: boolean): Promise<void> {
  const cohortOrgId = await getCohortOrganizationId(cohortId);
  if (cohortOrgId !== actor.orgId) throw scopeNotFound();

  if (isOrgAdmin) return;

  const cohortRoleId = await getCohortMemberRole(cohortId, actor.profileId);
  if (cohortRoleId !== ROLE.ADMIN && cohortRoleId !== ROLE.TUTOR) throw scopeForbidden();
}

async function assertCourseScope(actor: InsightsActor, courseId: string): Promise<void> {
  const courseOrgId = await getCourseOrganizationId(courseId);
  if (courseOrgId !== actor.orgId) throw scopeNotFound();

  const isCourseTeam = await isCourseTeamMemberOrOrgAdmin(courseId, actor.profileId);
  if (!isCourseTeam) throw scopeForbidden();
}

const SCOPE_ASSERTIONS: Record<TInsightsScopeType, ScopeAssertion> = {
  org: assertOrgScope,
  cohort: assertCohortScope,
  course: assertCourseScope
};

/**
 * Checks the actor may read the scope in their verified org, then returns it with its course ids.
 * Throws 404 for a scope in another org and 403 for a scope the actor cannot see.
 */
export async function resolveAuthorizedScope(
  actor: InsightsActor,
  scope: TInsightsScope
): Promise<AuthorizedInsightsScope> {
  const isOrgAdmin = actor.orgRoles[actor.orgId] === ROLE.ADMIN;
  await SCOPE_ASSERTIONS[scope.type](actor, scope.id, isOrgAdmin);

  const scopeRef = { orgId: actor.orgId, type: scope.type, id: scope.id };
  const courseIds = await listInsightsScopeCourseIds(scopeRef);

  return { ...scopeRef, courseIds };
}
