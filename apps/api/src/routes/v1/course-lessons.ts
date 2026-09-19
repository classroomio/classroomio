import {
  ZPublicApiCourseParam,
  ZPublicApiCreateLesson,
  ZPublicApiCreateLessonTranslation,
  ZPublicApiLessonHistoryQuery,
  ZPublicApiLessonParam,
  ZPublicApiLessonsQuery,
  ZPublicApiLessonTranslationParam,
  ZPublicApiReorderLessons,
  ZPublicApiUpdateLesson,
  ZPublicApiUpdateLessonTranslation
} from '@cio/utils/validation/public-api';
import {
  createPublicApiLessonService,
  createPublicApiLessonTranslationService,
  deletePublicApiLessonService,
  getPublicApiLessonHistoryService,
  getPublicApiLessonService,
  getPublicApiLessonTranslationService,
  listPublicApiLessonsService,
  listPublicApiLessonTranslationsService,
  reorderPublicApiLessonsService,
  updatePublicApiLessonService,
  updatePublicApiLessonTranslationService
} from '@api/services/v1/course-lesson';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const ObjectResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const ListResponse = {
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

export const v1CourseLessonsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List the lessons of a course, optionally filtered by section',
      tags: ['Public API Lessons'],
      responses: {
        200: jsonResponse('Lessons returned successfully', ListResponse),
        400: { description: 'Invalid query' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiLessonsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const lessons = await listPublicApiLessonsService(orgId, params, query);

        return c.json({ success: true, data: lessons }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list lessons');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create a lesson in a course',
      tags: ['Public API Lessons'],
      responses: {
        201: jsonResponse('Lesson created successfully', ObjectResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or section not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCreateLesson),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const lesson = await createPublicApiLessonService(orgId, params, payload);

        return c.json({ success: true, data: lesson }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create lesson');
      }
    }
  )
  .post(
    '/reorder',
    describeRoute({
      description: 'Set the order of lessons, and optionally move them between sections',
      tags: ['Public API Lessons'],
      responses: {
        200: jsonResponse('Lessons reordered successfully', ListResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course, lesson or section not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiReorderLessons),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const lessons = await reorderPublicApiLessonsService(orgId, params, payload);

        return c.json({ success: true, data: lessons }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to reorder lessons');
      }
    }
  )
  .get(
    '/:lessonId/translations',
    describeRoute({
      description: 'List the translations of a lesson',
      tags: ['Public API Lesson Translations'],
      responses: {
        200: jsonResponse('Lesson translations returned successfully', ListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or lesson not found' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const translations = await listPublicApiLessonTranslationsService(orgId, params);

        return c.json({ success: true, data: translations }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list lesson translations');
      }
    }
  )
  .post(
    '/:lessonId/translations',
    describeRoute({
      description: 'Create a lesson translation, or replace the one for that locale',
      tags: ['Public API Lesson Translations'],
      responses: {
        201: jsonResponse('Lesson translation saved successfully', ObjectResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or lesson not found' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    validator('json', ZPublicApiCreateLessonTranslation),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const translation = await createPublicApiLessonTranslationService(orgId, actorId, params, payload);

        return c.json({ success: true, data: translation }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to save lesson translation');
      }
    }
  )
  .get(
    '/:lessonId/translations/:locale',
    describeRoute({
      description: 'Get one translation of a lesson',
      tags: ['Public API Lesson Translations'],
      responses: {
        200: jsonResponse('Lesson translation returned successfully', ObjectResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course, lesson or translation not found' }
      }
    }),
    validator('param', ZPublicApiLessonTranslationParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const translation = await getPublicApiLessonTranslationService(orgId, params);

        return c.json({ success: true, data: translation }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch lesson translation');
      }
    }
  )
  .put(
    '/:lessonId/translations/:locale',
    describeRoute({
      description: 'Update the translation of a lesson for one locale',
      tags: ['Public API Lesson Translations'],
      responses: {
        200: jsonResponse('Lesson translation updated successfully', ObjectResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course, lesson or translation not found' }
      }
    }),
    validator('param', ZPublicApiLessonTranslationParam),
    validator('json', ZPublicApiUpdateLessonTranslation),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const translation = await updatePublicApiLessonTranslationService(orgId, actorId, params, payload);

        return c.json({ success: true, data: translation }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson translation');
      }
    }
  )
  .get(
    '/:lessonId/history',
    describeRoute({
      description: 'List the saved versions of a lesson translation, newest first',
      tags: ['Public API Lesson Translations'],
      responses: {
        200: jsonResponse('Lesson history returned successfully', ObjectResponse),
        400: { description: 'Invalid query' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or lesson not found' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    validator('query', ZPublicApiLessonHistoryQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const history = await getPublicApiLessonHistoryService(orgId, params, query);

        return c.json({ success: true, data: history }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch lesson history');
      }
    }
  )
  .get(
    '/:lessonId',
    describeRoute({
      description: 'Get a lesson',
      tags: ['Public API Lessons'],
      responses: {
        200: jsonResponse('Lesson returned successfully', ObjectResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or lesson not found' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const lesson = await getPublicApiLessonService(orgId, params);

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch lesson');
      }
    }
  )
  .put(
    '/:lessonId',
    describeRoute({
      description: 'Update a lesson, including its slides link and video links',
      tags: ['Public API Lessons'],
      responses: {
        200: jsonResponse('Lesson updated successfully', ObjectResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course, lesson or section not found' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    validator('json', ZPublicApiUpdateLesson),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const lesson = await updatePublicApiLessonService(orgId, params, payload);

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson');
      }
    }
  )
  .delete(
    '/:lessonId',
    describeRoute({
      description: 'Delete a lesson',
      tags: ['Public API Lessons'],
      responses: {
        200: jsonResponse('Lesson deleted successfully', ObjectResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or lesson not found' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const lesson = await deletePublicApiLessonService(orgId, params);

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete lesson');
      }
    }
  );
