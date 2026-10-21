import {
  ZPublicApiCourseLessonParam,
  ZPublicApiCreateVideoCheckpoint,
  ZPublicApiUpdateVideoCheckpoint,
  ZPublicApiVideoCheckpointDeleteResponse,
  ZPublicApiVideoCheckpointListResponse,
  ZPublicApiVideoCheckpointParam,
  ZPublicApiVideoCheckpointResponse,
  ZPublicApiVideoCheckpointResultsResponse
} from '@cio/utils/validation/public-api';
import {
  createPublicApiVideoCheckpointService,
  deletePublicApiVideoCheckpointService,
  exportPublicApiVideoCheckpointResultsCsvService,
  getPublicApiVideoCheckpointResultsService,
  listPublicApiVideoCheckpointsService,
  updatePublicApiVideoCheckpointService
} from '@api/services/v1/courses/lesson-checkpoints';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, checkpointForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Lesson Video Questions';
const NOT_FOUND = { description: 'Course, lesson or video question not found' };

const writeRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 300,
  message: 'Too many video question changes. Please try again later.',
  keyGenerator: (c) => `lesson_video_checkpoint_write:user:${c.get('actorId')}:${c.req.param('lessonId')}`
});

const resultsRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many video question result requests. Please try again later.',
  keyGenerator: (c) => `lesson_video_checkpoint_results:user:${c.get('actorId')}:${c.req.param('lessonId')}`
});

export const v1CourseLessonCheckpointsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the questions that pause a lesson's uploaded videos, with their answer keys; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Questions returned, ordered by time in the video',
          itemResponse(ZPublicApiVideoCheckpointListResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: checkpointForbiddenResponses.read,
        404: NOT_FOUND,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    async (c) => {
      try {
        const data = await listPublicApiVideoCheckpointsService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param')
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list video questions');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Add a question that pauses an uploaded lesson video; ${COURSE_TEAM_RULE}, and the organization must be on a paid plan.`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Question created', itemResponse(ZPublicApiVideoCheckpointResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: checkpointForbiddenResponses.write,
        404: NOT_FOUND,
        409: { description: 'Another question on this video is within 2 seconds of this time' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('json', ZPublicApiCreateVideoCheckpoint),
    writeRateLimit,
    async (c) => {
      try {
        const data = await createPublicApiVideoCheckpointService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create video question');
      }
    }
  )
  .get(
    '/results',
    describeRoute({
      description: `Read how learners answered a lesson's video questions, per question and per learner; ${COURSE_TEAM_RULE}, and the organization must be on a paid plan.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Results returned. Answers are formative and never appear as exercise submissions.',
          itemResponse(ZPublicApiVideoCheckpointResultsResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: checkpointForbiddenResponses.results,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    resultsRateLimit,
    async (c) => {
      try {
        const data = await getPublicApiVideoCheckpointResultsService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param')
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to read video question results');
      }
    }
  )
  .get(
    '/results/csv',
    describeRoute({
      description: `Download every learner answer to a lesson's video questions as a CSV file; ${COURSE_TEAM_RULE}, and the organization must be on a paid plan.`,
      tags: [TAG],
      responses: {
        200: {
          description: 'The CSV file, one row per learner answer',
          content: { 'text/csv': { schema: { type: 'string' as const } } }
        },
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: checkpointForbiddenResponses.results,
        404: { description: 'Course or lesson not found, or the lesson has no video questions' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    resultsRateLimit,
    async (c) => {
      try {
        const csv = await exportPublicApiVideoCheckpointResultsCsvService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param')
        );

        c.header('Content-Type', 'text/csv; charset=utf-8');
        c.header('Content-Disposition', 'attachment; filename="video-question-results.csv"');

        return c.body(csv, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to export video question results');
      }
    }
  )
  .put(
    '/:checkpointId',
    describeRoute({
      description: `Replace a video question; editing it clears the answers learners already gave, and ${COURSE_TEAM_RULE}, with the organization on a paid plan.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Question saved', itemResponse(ZPublicApiVideoCheckpointResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: checkpointForbiddenResponses.write,
        404: NOT_FOUND,
        409: { description: 'Another question on this video is within 2 seconds of this time' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiVideoCheckpointParam),
    validator('json', ZPublicApiUpdateVideoCheckpoint),
    writeRateLimit,
    async (c) => {
      try {
        const data = await updatePublicApiVideoCheckpointService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update video question');
      }
    }
  )
  .delete(
    '/:checkpointId',
    describeRoute({
      description: `Delete a video question and the answers learners gave it; ${COURSE_TEAM_RULE}, and it stays allowed after a downgrade to the free plan.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Question deleted', itemResponse(ZPublicApiVideoCheckpointDeleteResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: checkpointForbiddenResponses.delete,
        404: NOT_FOUND,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiVideoCheckpointParam),
    writeRateLimit,
    async (c) => {
      try {
        const data = await deletePublicApiVideoCheckpointService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param')
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete video question');
      }
    }
  );
