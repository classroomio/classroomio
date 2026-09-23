import {
  ZPublicApiCohortNewsfeedCommentParam,
  ZPublicApiCohortNewsfeedParam,
  ZPublicApiCohortNewsfeedQuery,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohortNewsfeed,
  ZPublicApiCreateCohortNewsfeedComment,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCohortNewsfeed,
  ZPublicApiUpdateCohortReaction
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import {
  COHORT_MEMBER_RULE,
  COHORT_TEAM_RULE,
  DESTRUCTIVE,
  PAGINATED,
  READ_ONLY,
  WRITE,
  jsonContent
} from './cohort-tool-text';

export const ZListCohortNewsfeedToolInput = ZPublicApiCohortNewsfeedQuery.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZCreateCohortNewsfeedPostToolInput = ZPublicApiCreateCohortNewsfeed.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZUpdateCohortNewsfeedPostToolInput = ZPublicApiUpdateCohortNewsfeed.safeExtend({
  cohortId: ZPublicApiCohortNewsfeedParam.shape.cohortId,
  feedId: ZPublicApiCohortNewsfeedParam.shape.feedId
});

export const ZUpdateCohortNewsfeedReactionToolInput = ZPublicApiUpdateCohortReaction.extend({
  cohortId: ZPublicApiCohortNewsfeedParam.shape.cohortId,
  feedId: ZPublicApiCohortNewsfeedParam.shape.feedId
});

export const ZDeleteCohortNewsfeedPostToolInput = ZPublicApiCohortNewsfeedParam;

export const ZListCohortNewsfeedCommentsToolInput = ZPublicApiCohortNewsfeedParam.extend(
  ZPublicApiPaginationQuery.shape
);

export const ZCreateCohortNewsfeedCommentToolInput = ZPublicApiCreateCohortNewsfeedComment.extend({
  cohortId: ZPublicApiCohortNewsfeedParam.shape.cohortId,
  feedId: ZPublicApiCohortNewsfeedParam.shape.feedId
});

export const ZDeleteCohortNewsfeedCommentToolInput = ZPublicApiCohortNewsfeedCommentParam;

const listCohortNewsfeedShape = ZListCohortNewsfeedToolInput.shape as unknown as ZodRawShapeCompat;
const createCohortNewsfeedPostShape = ZCreateCohortNewsfeedPostToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortNewsfeedPostShape = ZUpdateCohortNewsfeedPostToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortNewsfeedReactionShape = ZUpdateCohortNewsfeedReactionToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortNewsfeedPostShape = ZDeleteCohortNewsfeedPostToolInput.shape as unknown as ZodRawShapeCompat;
const listCohortNewsfeedCommentsShape = ZListCohortNewsfeedCommentsToolInput.shape as unknown as ZodRawShapeCompat;
const createCohortNewsfeedCommentShape = ZCreateCohortNewsfeedCommentToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortNewsfeedCommentShape = ZDeleteCohortNewsfeedCommentToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCohortNewsfeedTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_cohort_newsfeed',
    `List a cohort newsfeed, newest first. Cursor-paginated: pass the returned nextCursor back as cursor for the next page; limit defaults to 10, max 50. ${COHORT_MEMBER_RULE}`,
    listCohortNewsfeedShape,
    READ_ONLY,
    async (args) => {
      const { cohortId, ...query } = ZListCohortNewsfeedToolInput.parse(args);
      const result = await apiClient.listCohortNewsfeed(cohortId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort_newsfeed_post',
    `Create a post on a cohort newsfeed, authored by the API key creator. ${COHORT_TEAM_RULE} The key creator must also be a member of the cohort to author a post.`,
    createCohortNewsfeedPostShape,
    WRITE,
    async (args) => {
      const { cohortId, ...payload } = ZCreateCohortNewsfeedPostToolInput.parse(args);
      const result = await apiClient.createCohortNewsfeedPost(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_newsfeed_post',
    `Update a cohort newsfeed post's content or pinned state. Send only the fields to change. ${COHORT_TEAM_RULE}`,
    updateCohortNewsfeedPostShape,
    WRITE,
    async (args) => {
      const { cohortId, feedId, ...payload } = ZUpdateCohortNewsfeedPostToolInput.parse(args);
      const result = await apiClient.updateCohortNewsfeedPost(
        cohortId,
        feedId,
        ZPublicApiUpdateCohortNewsfeed.parse(payload)
      );
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_newsfeed_reaction',
    `Replace the reaction state on a cohort newsfeed post. The reaction field is the full desired state (arrays of cohort member ids per emoji), not a toggle of one reaction. ${COHORT_MEMBER_RULE}`,
    updateCohortNewsfeedReactionShape,
    { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async (args) => {
      const { cohortId, feedId, ...payload } = ZUpdateCohortNewsfeedReactionToolInput.parse(args);
      const result = await apiClient.updateCohortNewsfeedReaction(cohortId, feedId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_newsfeed_post',
    `Permanently delete a cohort newsfeed post and its comments. This is a hard delete and cannot be undone. ${COHORT_TEAM_RULE}`,
    deleteCohortNewsfeedPostShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId, feedId } = ZDeleteCohortNewsfeedPostToolInput.parse(args);
      const result = await apiClient.deleteCohortNewsfeedPost(cohortId, feedId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_newsfeed_comments',
    `List the comments on a cohort newsfeed post, oldest first. ${PAGINATED} ${COHORT_MEMBER_RULE}`,
    listCohortNewsfeedCommentsShape,
    READ_ONLY,
    async (args) => {
      const { cohortId, feedId, ...query } = ZListCohortNewsfeedCommentsToolInput.parse(args);
      const result = await apiClient.listCohortNewsfeedComments(cohortId, feedId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort_newsfeed_comment',
    'Add a comment to a cohort newsfeed post, authored by the API key creator. The key creator must be a member of the cohort (being an org admin is not enough), otherwise 403.',
    createCohortNewsfeedCommentShape,
    WRITE,
    async (args) => {
      const { cohortId, feedId, ...payload } = ZCreateCohortNewsfeedCommentToolInput.parse(args);
      const result = await apiClient.createCohortNewsfeedComment(cohortId, feedId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_newsfeed_comment',
    'Permanently delete a comment from a cohort newsfeed post. The API key creator must be the comment author, a cohort tutor/admin, or an org admin, otherwise 403.',
    deleteCohortNewsfeedCommentShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId, feedId, commentId } = ZDeleteCohortNewsfeedCommentToolInput.parse(args);
      const result = await apiClient.deleteCohortNewsfeedComment(cohortId, feedId, commentId);
      return jsonContent(result);
    }
  );
}
