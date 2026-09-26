import type {
  TPublicApiCohortParam,
  TPublicApiCreateCohort,
  TPublicApiPaginationQuery,
  TPublicApiUpdateCohort
} from '@cio/utils/validation/public-api';

import {
  createCohort,
  deleteCohort,
  getCohort,
  getEnrolledCohorts,
  listOrgCohortsPage,
  updateCohort
} from '@api/services/cohort/cohort';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCohortMemberOrOrgAdmin,
  assertCohortTeamMemberOrOrgAdmin,
  paginateInMemory,
  toPublicApiPagination
} from '@api/services/v1/shared';

export async function listCohortsService(orgId: string, actorId: string | null, query: TPublicApiPaginationQuery) {
  assertAutomationActor(actorId);

  const { items, total } = await listOrgCohortsPage(orgId, actorId, query);

  return { items, pagination: toPublicApiPagination(query.page, query.limit, total) };
}

export async function listPublicApiEnrolledCohortsService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiPaginationQuery
) {
  assertAutomationActor(actorId);

  const cohorts = await getEnrolledCohorts(actorId);

  return paginateInMemory(
    cohorts.filter((cohort) => cohort.organizationId === orgId),
    query
  );
}

export async function createPublicApiCohortService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateCohort
) {
  assertAutomationActor(actorId);

  return createCohort(orgId, actorId, payload);
}

export async function getPublicApiCohortService(orgId: string, actorId: string | null, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

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

export async function deletePublicApiCohortService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return deleteCohort(params.cohortId);
}
