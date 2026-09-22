import {
  ZPublicApiCohortNewsfeedCommentParam,
  ZPublicApiCohortNewsfeedParam,
  ZPublicApiCohortNewsfeedQuery,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohortNewsfeed,
  ZPublicApiCreateCohortNewsfeedComment,
  ZPublicApiUpdateCohortNewsfeed,
  ZPublicApiUpdateCohortReaction
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

export const ZListCohortNewsfeedToolInput = ZPublicApiCohortNewsfeedQuery.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZCreateCohortNewsfeedPostToolInput = ZPublicApiCreateCohortNewsfeed.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZUpdateCohortNewsfeedPostToolInput = ZPublicApiUpdateCohortNewsfeed.extend({
  cohortId: ZPublicApiCohortNewsfeedParam.shape.cohortId,
  feedId: ZPublicApiCohortNewsfeedParam.shape.feedId
});

export const ZUpdateCohortNewsfeedReactionToolInput = ZPublicApiUpdateCohortReaction.extend({
  cohortId: ZPublicApiCohortNewsfeedParam.shape.cohortId,
  feedId: ZPublicApiCohortNewsfeedParam.shape.feedId
});

export const ZDeleteCohortNewsfeedPostToolInput = ZPublicApiCohortNewsfeedParam;

export const ZListCohortNewsfeedCommentsToolInput = ZPublicApiCohortNewsfeedParam;

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
    'List a cohort newsfeed, newest first. Supports cursor pagination.',
    listCohortNewsfeedShape,
    async (args) => {
      const { cohortId, ...query } = ZListCohortNewsfeedToolInput.parse(args);
      const result = await apiClient.listCohortNewsfeed(cohortId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort_newsfeed_post',
    'Create a post on a cohort newsfeed. The automation actor must already be a member of the cohort, or this fails with a 403.',
    createCohortNewsfeedPostShape,
    async (args) => {
      const { cohortId, ...payload } = ZCreateCohortNewsfeedPostToolInput.parse(args);
      const result = await apiClient.createCohortNewsfeedPost(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_newsfeed_post',
    'Update a cohort newsfeed post.',
    updateCohortNewsfeedPostShape,
    async (args) => {
      const { cohortId, feedId, ...payload } = ZUpdateCohortNewsfeedPostToolInput.parse(args);
      const result = await apiClient.updateCohortNewsfeedPost(cohortId, feedId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_newsfeed_reaction',
    'Replace the reaction state on a cohort newsfeed post. The reaction field is the full desired state (arrays of cohort member ids per emoji), not a toggle of one reaction.',
    updateCohortNewsfeedReactionShape,
    async (args) => {
      const { cohortId, feedId, ...payload } = ZUpdateCohortNewsfeedReactionToolInput.parse(args);
      const result = await apiClient.updateCohortNewsfeedReaction(cohortId, feedId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_newsfeed_post',
    'Delete a cohort newsfeed post.',
    deleteCohortNewsfeedPostShape,
    async (args) => {
      const { cohortId, feedId } = ZDeleteCohortNewsfeedPostToolInput.parse(args);
      const result = await apiClient.deleteCohortNewsfeedPost(cohortId, feedId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_newsfeed_comments',
    'List the comments on a cohort newsfeed post.',
    listCohortNewsfeedCommentsShape,
    async (args) => {
      const { cohortId, feedId } = ZListCohortNewsfeedCommentsToolInput.parse(args);
      const result = await apiClient.listCohortNewsfeedComments(cohortId, feedId);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort_newsfeed_comment',
    'Add a comment to a cohort newsfeed post. The automation actor must already be a member of the cohort, or this fails with a 403.',
    createCohortNewsfeedCommentShape,
    async (args) => {
      const { cohortId, feedId, ...payload } = ZCreateCohortNewsfeedCommentToolInput.parse(args);
      const result = await apiClient.createCohortNewsfeedComment(cohortId, feedId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_newsfeed_comment',
    'Delete a comment from a cohort newsfeed post. Any automation key scoped to the organization may delete any comment; there is no per-author restriction for automation.',
    deleteCohortNewsfeedCommentShape,
    async (args) => {
      const { cohortId, feedId, commentId } = ZDeleteCohortNewsfeedCommentToolInput.parse(args);
      const result = await apiClient.deleteCohortNewsfeedComment(cohortId, feedId, commentId);
      return jsonContent(result);
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
