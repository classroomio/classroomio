import {
  ZPublicApiCourseLessonCommentParam,
  ZPublicApiCourseLessonCommentResponse,
  ZPublicApiCourseLessonCommentsQuery,
  ZPublicApiCourseLessonCommentsResponse,
  ZPublicApiCourseLessonParam,
  ZPublicApiCreateCourseLessonComment,
  ZPublicApiUpdateCourseLessonComment
} from '@cio/utils/validation/public-api';
import {
  createPublicApiCourseLessonCommentService,
  deletePublicApiCourseLessonCommentService,
  listPublicApiCourseLessonCommentsService,
  updatePublicApiCourseLessonCommentService
} from '@api/services/v1/courses/lesson-comments';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, contentForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Lesson Comments';
const CommentResponse = itemResponse(ZPublicApiCourseLessonCommentResponse);

export const v1CourseLessonCommentsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a lesson's comments, newest first; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Comments returned successfully', itemResponse(ZPublicApiCourseLessonCommentsResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.comments,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('query', ZPublicApiCourseLessonCommentsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const page = await listPublicApiCourseLessonCommentsService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: page }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list lesson comments');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Post a comment on a lesson as the key creator; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse(
          'Comment created; an org admin who is not in the course is added to it as an admin first, as in the dashboard',
          CommentResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.commentWrite,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('json', ZPublicApiCreateCourseLessonComment),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const comment = await createPublicApiCourseLessonCommentService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: comment }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create lesson comment');
      }
    }
  )
  .put(
    '/:commentId',
    describeRoute({
      description: `Edit a comment the key creator wrote; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Comment updated successfully', CommentResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.commentEdit,
        404: { description: 'Course, lesson or comment not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonCommentParam),
    validator('json', ZPublicApiUpdateCourseLessonComment),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const comment = await updatePublicApiCourseLessonCommentService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson comment');
      }
    }
  )
  .delete(
    '/:commentId',
    describeRoute({
      description: `Permanently delete a comment on a lesson; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Comment deleted successfully', CommentResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.commentEdit,
        404: { description: 'Course, lesson or comment not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonCommentParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const comment = await deletePublicApiCourseLessonCommentService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete lesson comment');
      }
    }
  );
