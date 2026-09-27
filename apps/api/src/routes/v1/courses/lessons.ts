import {
  ZPublicApiCourseParam,
  ZPublicApiCreateLesson,
  ZPublicApiLessonParam,
  ZPublicApiLessonResponse,
  ZPublicApiUpdateLesson
} from '@cio/utils/validation/public-api';

import { createPublicApiLessonService, updatePublicApiLessonService } from '@api/services/v1/lessons/lesson';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';

const LessonResponse = itemResponse(ZPublicApiLessonResponse);

const VIDEO_NOTE =
  'Attach an uploaded video with `{ "type": "upload", "assetId": "…" }`, using an assetId from POST /assets whose bytes you have already uploaded. Attaching it completes the upload and queues thumbnailing, transcription and adaptive-bitrate encoding. External videos use `{ "type": "youtube" | "vimeo" | "generic", "link": "…" }` and are embedded rather than fetched.';

export const v1CourseLessonsRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: `Create a lesson in a course. ${VIDEO_NOTE}`,
      tags: ['Public API Lessons'],
      responses: {
        201: jsonResponse('Lesson created', LessonResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        404: { description: 'Course not found, or a referenced asset does not exist' },
        409: { description: 'A referenced asset has no uploaded file yet' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCreateLesson),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await createPublicApiLessonService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: lesson }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create lesson');
      }
    }
  )
  .put(
    '/:lessonId',
    describeRoute({
      description: `Update a lesson. Omitted fields are left unchanged; a supplied \`videos\` array replaces the lesson's videos entirely. ${VIDEO_NOTE}`,
      tags: ['Public API Lessons'],
      responses: {
        200: jsonResponse('Lesson updated', LessonResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        404: { description: 'Course or lesson not found, or a referenced asset does not exist' },
        409: { description: 'A referenced asset has no uploaded file yet' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    validator('json', ZPublicApiUpdateLesson),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await updatePublicApiLessonService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson');
      }
    }
  );
