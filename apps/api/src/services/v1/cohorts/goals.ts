import type {
  TPublicApiCohortGoalParam,
  TPublicApiCohortParam,
  TPublicApiCreateCohortGoal,
  TPublicApiPaginationQuery,
  TPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';

import {
  archiveGoal,
  createGoal,
  evaluateCohortGoals,
  evaluateGoal,
  getGoal,
  getMyGoals,
  getOrgGoalsOverview,
  listGoalsPage,
  removeGoal,
  updateGoal
} from '@api/services/cohort/goal';
import { getEnrolledCohorts } from '@api/services/cohort/cohort';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCohortMemberOrOrgAdmin,
  assertCohortTeamMemberOrOrgAdmin,
  assertOrgTeamMember,
  paginateInMemory,
  toPublicApiPagination
} from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listPublicApiCohortGoalsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  query: TPublicApiPaginationQuery
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

  const { items, total } = await listGoalsPage(params.cohortId, query);

  return { items, pagination: toPublicApiPagination(query.page, query.limit, total) };
}

export async function createPublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiCreateCohortGoal
) {
  assertAutomationActor(actorId);
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return createGoal(params.cohortId, actorId, payload);
}

export async function getPublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortGoalParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

  return getGoal(params.cohortId, params.goalId);
}

export async function updatePublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortGoalParam,
  payload: TPublicApiUpdateCohortGoal
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return updateGoal(params.cohortId, params.goalId, payload);
}

export async function archivePublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortGoalParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return archiveGoal(params.cohortId, params.goalId);
}

export async function evaluatePublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortGoalParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  const goal = await getGoal(params.cohortId, params.goalId);
  if (goal.status === 'archived') {
    throw new AppError('Archived goals are not evaluated', ErrorCodes.CONFLICT, 409);
  }

  return evaluateGoal(goal.id);
}

export async function evaluateAllPublicApiCohortGoalsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return evaluateCohortGoals(params.cohortId);
}

export async function getPublicApiOrgGoalsOverviewService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiPaginationQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  const { goals } = await getOrgGoalsOverview(orgId);

  return paginateInMemory(goals, query);
}

export async function listPublicApiMyCohortGoalsService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiPaginationQuery
) {
  assertAutomationActor(actorId);

  const [cohorts, goals] = await Promise.all([getEnrolledCohorts(actorId), getMyGoals(actorId)]);
  const orgCohortIds = new Set(cohorts.filter((cohort) => cohort.organizationId === orgId).map((cohort) => cohort.id));

  return paginateInMemory(
    goals.filter((goal) => orgCohortIds.has(goal.cohortId)),
    query
  );
}

export async function deletePublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortGoalParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return removeGoal(params.cohortId, params.goalId);
}
