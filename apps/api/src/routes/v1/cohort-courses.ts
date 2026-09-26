import {
  ZPublicApiAddCourseToCohort,
  ZPublicApiCohortCourseListItemResponse,
  ZPublicApiCohortCourseParam,
  ZPublicApiCohortCourseResponse,
  ZPublicApiCohortParam,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import {
  addPublicApiCohortCourseService,
  listPublicApiCohortCoursesService,
  removePublicApiCohortCourseService
} from '@api/services/v1/cohort-course';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, PAGINATION_NOTE, cohortForbiddenResponses } from './cohort-route-docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const CohortCourseResponse = itemResponse(ZPublicApiCohortCourseResponse);

export const v1CohortCoursesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the courses linked to a cohort. If the automation actor is a student in the cohort, only published courses are returned. ${PAGINATION_NOTE} ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Courses'],
      responses: {
        200: jsonResponse(
          'Cohort courses returned successfully',
          paginatedResponse(ZPublicApiCohortCourseListItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCohortCoursesService(orgId, actorId, params, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort courses');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Link a course from your organization to a cohort. Existing cohort students are enrolled in the course. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Courses'],
      responses: {
        201: jsonResponse('Course added to cohort', CohortCourseResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
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
      description: `Unlink a course from a cohort. The course itself is not deleted. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Courses'],
      responses: {
        200: jsonResponse('Course removed from cohort', CohortCourseResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
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
