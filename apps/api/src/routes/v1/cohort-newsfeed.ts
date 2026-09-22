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

const NewsfeedResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const NewsfeedListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const CommentListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } }
  },
  required: ['success', 'data']
};

const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } }
});

export const v1CohortNewsfeedRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List a cohort newsfeed, newest first, cursor-paginated',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed returned successfully', NewsfeedListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiCohortNewsfeedQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCohortNewsfeedService(orgId, params, query);

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
        'Create a cohort newsfeed post. The automation actor must already be a member of the cohort, or this fails with 403',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        201: jsonResponse('Newsfeed post created successfully', NewsfeedResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden, or the automation actor is not a member of this cohort' },
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
      description: 'Update a cohort newsfeed post',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed post updated successfully', NewsfeedResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('json', ZPublicApiUpdateCohortNewsfeed),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const feed = await updatePublicApiCohortNewsfeedService(orgId, params, payload);

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
        'Replace the reaction state on a cohort newsfeed post. The payload is the full desired reaction object (arrays of cohort member ids per emoji), not a toggle',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Reaction updated successfully', NewsfeedResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    validator('json', ZPublicApiUpdateCohortReaction),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const feed = await updatePublicApiCohortNewsfeedReactionService(orgId, params, payload);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort newsfeed reaction');
      }
    }
  )
  .delete(
    '/:feedId',
    describeRoute({
      description: 'Delete a cohort newsfeed post',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Newsfeed post deleted successfully', NewsfeedResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const feed = await deletePublicApiCohortNewsfeedService(orgId, params);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort newsfeed post');
      }
    }
  )
  .get(
    '/:feedId/comments',
    describeRoute({
      description: 'List the comments on a cohort newsfeed post',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Comments returned successfully', CommentListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or newsfeed post not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const comments = await listPublicApiCohortNewsfeedCommentsService(orgId, params);

        return c.json({ success: true, data: comments }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort newsfeed comments');
      }
    }
  )
  .post(
    '/:feedId/comment',
    describeRoute({
      description:
        'Add a comment to a cohort newsfeed post. The automation actor must already be a member of the cohort, or this fails with 403',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        201: jsonResponse('Comment created successfully', NewsfeedResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden, or the automation actor is not a member of this cohort' },
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
        'Delete a comment from a cohort newsfeed post. Any automation key scoped to this organization may delete any comment; there is no per-author restriction for automation',
      tags: ['Public API Cohort Newsfeed'],
      responses: {
        200: jsonResponse('Comment deleted successfully', NewsfeedResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort, newsfeed post, or comment not found' }
      }
    }),
    validator('param', ZPublicApiCohortNewsfeedCommentParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const comment = await deletePublicApiCohortNewsfeedCommentService(orgId, params);

        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort newsfeed comment');
      }
    }
  );
