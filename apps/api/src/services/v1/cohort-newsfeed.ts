import type {
  TPublicApiCohortNewsfeedCommentParam,
  TPublicApiCohortNewsfeedParam,
  TPublicApiCohortNewsfeedQuery,
  TPublicApiCohortParam,
  TPublicApiCreateCohortNewsfeed,
  TPublicApiCreateCohortNewsfeedComment,
  TPublicApiUpdateCohortNewsfeed,
  TPublicApiUpdateCohortReaction
} from '@cio/utils/validation/public-api';

import {
  createCohortNewsfeedCommentService,
  createCohortNewsfeedService,
  deleteCohortNewsfeedCommentService,
  deleteCohortNewsfeedService,
  listCohortNewsfeed,
  listCohortNewsfeedComments,
  updateCohortNewsfeedReactionService,
  updateCohortNewsfeedService
} from '@api/services/cohort/cohort';
import { assertCohortBelongsToOrganization } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listPublicApiCohortNewsfeedService(
  orgId: string,
  params: TPublicApiCohortParam,
  query: TPublicApiCohortNewsfeedQuery
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return listCohortNewsfeed(params.cohortId, query);
}

export async function createPublicApiCohortNewsfeedService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiCreateCohortNewsfeed
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return createCohortNewsfeedService(params.cohortId, actorId, payload);
}

export async function updatePublicApiCohortNewsfeedService(
  orgId: string,
  params: TPublicApiCohortNewsfeedParam,
  payload: TPublicApiUpdateCohortNewsfeed
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return updateCohortNewsfeedService(params.cohortId, params.feedId, payload);
}

export async function updatePublicApiCohortNewsfeedReactionService(
  orgId: string,
  params: TPublicApiCohortNewsfeedParam,
  payload: TPublicApiUpdateCohortReaction
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return updateCohortNewsfeedReactionService(params.cohortId, params.feedId, payload);
}

export async function deletePublicApiCohortNewsfeedService(orgId: string, params: TPublicApiCohortNewsfeedParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return deleteCohortNewsfeedService(params.cohortId, params.feedId);
}

export async function listPublicApiCohortNewsfeedCommentsService(
  orgId: string,
  params: TPublicApiCohortNewsfeedParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return listCohortNewsfeedComments(params.cohortId, params.feedId);
}

export async function createPublicApiCohortNewsfeedCommentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortNewsfeedParam,
  payload: TPublicApiCreateCohortNewsfeedComment
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return createCohortNewsfeedCommentService(params.cohortId, params.feedId, actorId, payload);
}

export async function deletePublicApiCohortNewsfeedCommentService(
  orgId: string,
  params: TPublicApiCohortNewsfeedCommentParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return deleteCohortNewsfeedCommentService(params.cohortId, params.feedId, params.commentId);
}
