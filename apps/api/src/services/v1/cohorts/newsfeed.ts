import {
  PUBLIC_API_COHORT_REACTION_TYPES,
  type TPublicApiCohortNewsfeedCommentParam,
  type TPublicApiCohortNewsfeedParam,
  type TPublicApiCohortNewsfeedQuery,
  type TPublicApiCohortParam,
  type TPublicApiCohortReactionType,
  type TPublicApiCreateCohortNewsfeed,
  type TPublicApiCreateCohortNewsfeedComment,
  type TPublicApiPaginationQuery,
  type TPublicApiSetCohortReaction,
  type TPublicApiUpdateCohortNewsfeed
} from '@cio/utils/validation/public-api';
import type { TUpdateCohortReaction } from '@cio/utils/validation/cohort';

import {
  createCohortNewsfeedCommentService,
  createCohortNewsfeedService,
  deleteCohortNewsfeedCommentService,
  deleteCohortNewsfeedService,
  listCohortNewsfeed,
  listCohortNewsfeedCommentsPage,
  updateCohortNewsfeedService
} from '@api/services/cohort/cohort';
import {
  getCohortMemberByProfileId,
  getCohortNewsfeedById,
  getCohortNewsfeedCommentById,
  updateCohortNewsfeedReactionLocked
} from '@cio/db/queries/cohort';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCohortMemberOrOrgAdmin,
  assertCohortNewsfeedCommentAuthorOrTeam,
  assertCohortTeamMemberOrOrgAdmin,
  toPublicApiPagination
} from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

type TCohortReactionRecord = TUpdateCohortReaction['reaction'];

export async function listPublicApiCohortNewsfeedService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  query: TPublicApiCohortNewsfeedQuery
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

  return listCohortNewsfeed(params.cohortId, query);
}

export async function createPublicApiCohortNewsfeedService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiCreateCohortNewsfeed
) {
  assertAutomationActor(actorId);
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

export function setMemberReaction(
  reaction: Partial<TCohortReactionRecord> | null | undefined,
  memberId: string,
  reactionType: TPublicApiCohortReactionType | null
): TCohortReactionRecord {
  const next = {} as TCohortReactionRecord;
  for (const type of PUBLIC_API_COHORT_REACTION_TYPES) {
    next[type] = (reaction?.[type] ?? []).filter((id) => id !== memberId);
  }
  if (reactionType) {
    next[reactionType].push(memberId);
  }
  return next;
}

export async function setPublicApiCohortNewsfeedReactionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortNewsfeedParam,
  payload: TPublicApiSetCohortReaction
) {
  assertAutomationActor(actorId);
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  const member = await getCohortMemberByProfileId(params.cohortId, actorId);
  if (!member) {
    throw new AppError('Only cohort members can react to posts', ErrorCodes.COHORT_FORBIDDEN, 403);
  }

  const feed = await updateCohortNewsfeedReactionLocked(params.cohortId, params.feedId, (current) =>
    setMemberReaction(current, member.id, payload.reaction)
  );
  if (!feed) {
    throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
  }

  return feed;
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
  actorId: string | null,
  params: TPublicApiCohortNewsfeedParam,
  query: TPublicApiPaginationQuery
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

  const { items, total } = await listCohortNewsfeedCommentsPage(params.cohortId, params.feedId, query);

  return { items, pagination: toPublicApiPagination(query.page, query.limit, total) };
}

export async function createPublicApiCohortNewsfeedCommentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortNewsfeedParam,
  payload: TPublicApiCreateCohortNewsfeedComment
) {
  assertAutomationActor(actorId);
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

  return createCohortNewsfeedCommentService(params.cohortId, params.feedId, actorId, payload);
}

export async function deletePublicApiCohortNewsfeedCommentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortNewsfeedCommentParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  const feed = await getCohortNewsfeedById(params.cohortId, params.feedId);
  if (!feed) {
    throw new AppError('Cohort newsfeed item not found', ErrorCodes.COHORT_NEWSFEED_NOT_FOUND, 404);
  }

  const comment = await getCohortNewsfeedCommentById(params.commentId);
  if (!comment || comment.cohortNewsfeedId !== params.feedId) {
    throw new AppError('Comment not found', ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND, 404);
  }

  await assertCohortNewsfeedCommentAuthorOrTeam(params.cohortId, actorId, comment.authorId);

  return deleteCohortNewsfeedCommentService(params.cohortId, params.feedId, params.commentId);
}
