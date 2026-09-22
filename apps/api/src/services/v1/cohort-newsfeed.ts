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
import { getCohortNewsfeedCommentById } from '@cio/db/queries/cohort';
import {
  assertCohortBelongsToOrganization,
  assertCohortNewsfeedCommentAuthorOrTeam,
  assertCohortTeamMemberOrOrgAdmin
} from '@api/services/v1/shared';
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
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return createCohortNewsfeedService(params.cohortId, actorId, payload);
}

export async function updatePublicApiCohortNewsfeedService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortNewsfeedParam,
  payload: TPublicApiUpdateCohortNewsfeed
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

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

export async function deletePublicApiCohortNewsfeedService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortNewsfeedParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

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
  actorId: string | null,
  params: TPublicApiCohortNewsfeedCommentParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  const comment = await getCohortNewsfeedCommentById(params.commentId);
  if (!comment || comment.cohortNewsfeedId !== params.feedId) {
    throw new AppError('Comment not found', ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND, 404);
  }

  await assertCohortNewsfeedCommentAuthorOrTeam(params.cohortId, actorId, comment.authorId);

  return deleteCohortNewsfeedCommentService(params.cohortId, params.feedId, params.commentId);
}
