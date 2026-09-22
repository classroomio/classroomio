import type {
  TPublicApiCohortGoalParam,
  TPublicApiCohortParam,
  TPublicApiCreateCohortGoal,
  TPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';

import { archiveGoal, createGoal, getGoal, listGoals, removeGoal, updateGoal } from '@api/services/cohort/goal';
import { assertCohortBelongsToOrganization } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listPublicApiCohortGoalsService(orgId: string, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return listGoals(params.cohortId);
}

export async function createPublicApiCohortGoalService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiCreateCohortGoal
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return createGoal(params.cohortId, actorId, payload);
}

export async function getPublicApiCohortGoalService(orgId: string, params: TPublicApiCohortGoalParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return getGoal(params.cohortId, params.goalId);
}

export async function updatePublicApiCohortGoalService(
  orgId: string,
  params: TPublicApiCohortGoalParam,
  payload: TPublicApiUpdateCohortGoal
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return updateGoal(params.cohortId, params.goalId, payload);
}

export async function archivePublicApiCohortGoalService(orgId: string, params: TPublicApiCohortGoalParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return archiveGoal(params.cohortId, params.goalId);
}

export async function deletePublicApiCohortGoalService(orgId: string, params: TPublicApiCohortGoalParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return removeGoal(params.cohortId, params.goalId);
}
