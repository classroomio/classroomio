import type {
  TPublicApiCohortGoalParam,
  TPublicApiCohortParam,
  TPublicApiCreateCohortGoal,
  TPublicApiPaginationQuery,
  TPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';

import { archiveGoal, createGoal, getGoal, listGoalsPage, removeGoal, updateGoal } from '@api/services/cohort/goal';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCohortMemberOrOrgAdmin,
  assertCohortTeamMemberOrOrgAdmin,
  toPublicApiPagination
} from '@api/services/v1/shared';

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

export async function deletePublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortGoalParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return removeGoal(params.cohortId, params.goalId);
}
