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

const TAG = 'Course Lessons';
const CommentResponse = itemResponse(ZPublicApiCourseLessonCommentResponse);
const COMMENTS_OFF = 'Fails with 403 COMMENTS_DISABLED when comments are off for the organization, course or lesson.';

export const v1CourseLessonCommentsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a lesson's comments, newest first. Cursor-paginated: pass data.nextCursor back as cursor; limit defaults to 10, max 50. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
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
      description: `Post a comment as the key creator. An org admin who is not in the course is added to it as an admin first, as in the dashboard. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Comment created successfully', CommentResponse),
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
      description: `Edit a comment. Only its author (the key creator) can edit it, else 403. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Comment updated successfully', CommentResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.commentWrite,
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
      description: `Permanently delete a comment. Its author, a course tutor/admin or an org admin can delete it. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Comment deleted successfully', CommentResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.commentWrite,
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
