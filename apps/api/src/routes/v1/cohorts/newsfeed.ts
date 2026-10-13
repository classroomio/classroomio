import {
  ZPublicApiCohortNewsfeedCommentParam,
  ZPublicApiCohortNewsfeedParam,
  ZPublicApiCohortNewsfeedQuery,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohortNewsfeed,
  ZPublicApiCreateCohortNewsfeedComment,
  ZPublicApiCohortNewsfeedCommentListItemResponse,
  ZPublicApiCohortNewsfeedCommentResponse,
  ZPublicApiCohortNewsfeedPageResponse,
  ZPublicApiCohortNewsfeedResponse,
  ZPublicApiPaginationQuery,
  ZPublicApiSetCohortReaction,
  ZPublicApiUpdateCohortNewsfeed
} from '@cio/utils/validation/public-api';
import {
  createPublicApiCohortNewsfeedCommentService,
  createPublicApiCohortNewsfeedService,
  deletePublicApiCohortNewsfeedCommentService,
  deletePublicApiCohortNewsfeedService,
  listPublicApiCohortNewsfeedCommentsService,
  listPublicApiCohortNewsfeedService,
  setPublicApiCohortNewsfeedReactionService,
  updatePublicApiCohortNewsfeedService
} from '@api/services/v1/cohorts/newsfeed';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, cohortForbiddenResponses } from './docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const FeedResponse = itemResponse(ZPublicApiCohortNewsfeedResponse);
const CommentResponse = itemResponse(ZPublicApiCohortNewsfeedCommentResponse);

export const v1CohortNewsfeedRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a cohort's newsfeed posts, newest first; ${COHORT_MEMBER_RULE}.`,
      tags: ['Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed returned successfully', itemResponse(ZPublicApiCohortNewsfeedPageResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiCohortNewsfeedQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCohortNewsfeedService(orgId, actorId, params, query);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort newsfeed');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description:
        'Create a cohort newsfeed post authored by the key creator; the key creator must be a cohort tutor/admin, or an org admin who is a member of the cohort.',
      tags: ['Cohort Newsfeed'],
      responses: {
        201: jsonResponse('Newsfeed post created successfully', FeedResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description:
            'The key lacks the public_api:* or cohort:read/write scope, or the actor is not a cohort tutor/admin and cohort member'
        },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiCreateCohortNewsfeed),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const feed = await createPublicApiCohortNewsfeedService(orgId, actorId, params, payload);

        return c.json({ success: true, data: feed }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create cohort newsfeed post');
      }
    }
  )
  .put(
    '/:feedId',
    describeRoute({
      description: `Update a cohort newsfeed post's content or pinned state; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed post updated successfully', FeedResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('json', ZPublicApiUpdateCohortNewsfeed),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const feed = await updatePublicApiCohortNewsfeedService(orgId, actorId, params, payload);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort newsfeed post');
      }
    }
  )
  .put(
    '/:feedId/react',
    describeRoute({
      description:
        "Set or remove the key creator's own reaction on a cohort newsfeed post; the key creator must be a cohort member (being an org admin is not enough).",
      tags: ['Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Reaction set successfully', FeedResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description:
            'The key lacks the public_api:* or cohort:read/write scope, or the actor is not a member of the cohort'
        },
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('json', ZPublicApiSetCohortReaction),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const feed = await setPublicApiCohortNewsfeedReactionService(orgId, actorId, params, payload);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort newsfeed reaction');
      }
    }
  )
  .delete(
    '/:feedId',
    describeRoute({
      description: `Permanently delete a cohort newsfeed post and its comments; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed post deleted successfully', FeedResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const feed = await deletePublicApiCohortNewsfeedService(orgId, actorId, params);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort newsfeed post');
      }
    }
  )
  .get(
    '/:feedId/comments',
    describeRoute({
      description: `List the comments on a cohort newsfeed post, oldest first; ${COHORT_MEMBER_RULE}.`,
      tags: ['Cohort Newsfeed Comments'],
      responses: {
        200: jsonResponse(
          'Comments returned successfully',
          paginatedResponse(ZPublicApiCohortNewsfeedCommentListItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCohortNewsfeedCommentsService(orgId, actorId, params, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort newsfeed comments');
      }
    }
  )
  .post(
    '/:feedId/comment',
    describeRoute({
      description:
        'Add a comment authored by the key creator to a cohort newsfeed post; the key creator must be a cohort member (being an org admin is not enough).',
      tags: ['Cohort Newsfeed Comments'],
      responses: {
        201: jsonResponse('Comment created successfully', CommentResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('json', ZPublicApiCreateCohortNewsfeedComment),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const comment = await createPublicApiCohortNewsfeedCommentService(orgId, actorId, params, payload);

        return c.json({ success: true, data: comment }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create cohort newsfeed comment');
      }
    }
  )
  .delete(
    '/:feedId/comment/:commentId',
    describeRoute({
      description:
        "Permanently delete a comment from a cohort newsfeed post; the key creator must be the comment's author, a cohort tutor/admin, or an org admin.",
      tags: ['Cohort Newsfeed Comments'],
      responses: {
        200: jsonResponse('Comment deleted successfully', CommentResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description:
            'The key lacks the public_api:* or cohort:read/write scope, or the actor is not the author or a cohort team member'
        },
        404: { description: 'Cohort, newsfeed post, or comment not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedCommentParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const comment = await deletePublicApiCohortNewsfeedCommentService(orgId, actorId, params);

        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort newsfeed comment');
      }
    }
  );
