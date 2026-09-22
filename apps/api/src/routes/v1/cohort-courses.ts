import {
  ZPublicApiAddCourseToCohort,
  ZPublicApiCohortCourseParam,
  ZPublicApiCohortParam
} from '@cio/utils/validation/public-api';
import {
  addPublicApiCohortCourseService,
  listPublicApiCohortCoursesService,
  removePublicApiCohortCourseService
} from '@api/services/v1/cohort-course';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const CourseResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const CourseListResponse = {
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

export const v1CohortCoursesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List the courses linked to a cohort',
      tags: ['Public API Cohort Courses'],
      responses: {
        200: jsonResponse('Cohort courses returned successfully', CourseListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const courses = await listPublicApiCohortCoursesService(orgId, params);

        return c.json({ success: true, data: courses }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort courses');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Link a course to a cohort',
      tags: ['Public API Cohort Courses'],
      responses: {
        201: jsonResponse('Course added to cohort', CourseResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or course not found' },
        409: { description: 'Course is already in this cohort' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiAddCourseToCohort),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await addPublicApiCohortCourseService(orgId, actorId, params, payload);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to add course to cohort');
      }
    }
  )
  .delete(
    '/:courseId',
    describeRoute({
      description: 'Unlink a course from a cohort',
      tags: ['Public API Cohort Courses'],
      responses: {
        200: jsonResponse('Course removed from cohort', CourseResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or course not found' }
      }
    }),
    validator('param', ZPublicApiCohortCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await removePublicApiCohortCourseService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove course from cohort');
      }
    }
  );
