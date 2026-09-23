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
import {
  createPublicApiCohortNewsfeedCommentService,
  createPublicApiCohortNewsfeedService,
  deletePublicApiCohortNewsfeedCommentService,
  deletePublicApiCohortNewsfeedService,
  listPublicApiCohortNewsfeedCommentsService,
  listPublicApiCohortNewsfeedService,
  updatePublicApiCohortNewsfeedReactionService,
  updatePublicApiCohortNewsfeedService
} from '@api/services/v1/cohort-newsfeed';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import {
  COHORT_MEMBER_RULE,
  COHORT_TEAM_RULE,
  NewsfeedPageResponse,
  PAGINATION_NOTE,
  cohortForbiddenResponses
} from './cohort-route-docs';
import { ItemResponse, PaginatedListResponse, errorResponses, jsonResponse } from '@api/utils/openapi/responses';

export const v1CohortNewsfeedRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a cohort newsfeed, newest first. Cursor-paginated: pass data.nextCursor back as cursor to get the next page; limit defaults to 10, max 50. ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed returned successfully', NewsfeedPageResponse),
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
      description: `Create a cohort newsfeed post, authored by the automation actor. ${COHORT_TEAM_RULE} The actor must also be a member of the cohort to author a post; an org admin who is not a member gets 403.`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        201: jsonResponse('Newsfeed post created successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description:
            'The key lacks the public_api:* scope, or the actor is not a cohort tutor/admin and cohort member'
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
      description: `Update a cohort newsfeed post's content or pinned state. Send only the fields to change. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed post updated successfully', ItemResponse),
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
      description: `Replace the reaction state on a cohort newsfeed post. The payload is the full desired reaction object (arrays of cohort member ids per emoji), not a toggle. ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Reaction updated successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('json', ZPublicApiUpdateCohortReaction),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const feed = await updatePublicApiCohortNewsfeedReactionService(orgId, actorId, params, payload);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort newsfeed reaction');
      }
    }
  )
  .delete(
    '/:feedId',
    describeRoute({
      description: `Permanently delete a cohort newsfeed post and its comments. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed post deleted successfully', ItemResponse),
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
      description: `List the comments on a cohort newsfeed post, oldest first. ${PAGINATION_NOTE} ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Comments returned successfully', PaginatedListResponse),
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
      description: `Add a comment to a cohort newsfeed post, authored by the automation actor. The automation actor (the key creator) must be a member of the cohort, or this fails with 403; being an org admin is not enough.`,
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        201: jsonResponse('Comment created successfully', ItemResponse),
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
        'Permanently delete a comment from a cohort newsfeed post. The automation actor (the key creator) must be the comment author, a cohort tutor/admin, or an org admin, or this fails with 403.',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Comment deleted successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description: 'The key lacks the public_api:* scope, or the actor is not the author or a cohort team member'
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
