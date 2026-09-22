import type {
  TPublicApiCohortParam,
  TPublicApiCreateCohort,
  TPublicApiUpdateCohort
} from '@cio/utils/validation/public-api';

import { createCohort, deleteCohort, getCohort, updateCohort } from '@api/services/cohort/cohort';
import { getCohortsByOrg } from '@cio/db/queries/cohort';
import { assertCohortBelongsToOrganization, assertCohortTeamMemberOrOrgAdmin } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listCohortsService(orgId: string) {
  return getCohortsByOrg(orgId);
}

export async function createPublicApiCohortService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateCohort
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  return createCohort(orgId, actorId, payload);
}

export async function getPublicApiCohortService(orgId: string, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return getCohort(params.cohortId);
}

export async function updatePublicApiCohortService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiUpdateCohort
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return updateCohort(params.cohortId, payload);
}

export async function deletePublicApiCohortService(orgId: string, actorId: string | null, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return deleteCohort(params.cohortId);
}
