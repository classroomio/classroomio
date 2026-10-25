import {
  ZPublicApiCourseParam,
  ZPublicApiCourseResponse,
  ZPublicApiCourseTemplateListItemResponse,
  ZPublicApiCourseTemplateParam,
  ZPublicApiCourseTemplateResponse,
  ZPublicApiCourseTemplatesQuery,
  ZPublicApiCreateCourseFromTemplate,
  ZPublicApiSaveCourseTemplate
} from '@cio/utils/validation/public-api';
import {
  createCourseFromTemplateService,
  getCourseTemplateService,
  listCourseTemplatesService,
  saveCourseAsTemplateService
} from '@api/services/v1/courses/templates';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { ORG_ADMIN_RULE, ORG_TEAM_RULE, TAG, forbiddenResponses, mcpRateLimitResponse } from './docs';

const templateNotFound = { description: 'Template not found, or it belongs to another organization' };

export const v1CourseTemplateRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the course templates the organization can use: its own templates first, then the curated global ones; ${ORG_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          "Templates returned; pass a template's id to POST /course-templates/{templateId}/courses",
          paginatedResponse(ZPublicApiCourseTemplateListItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponses.read,
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiCourseTemplatesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await listCourseTemplatesService(orgId, actorId, c.req.valid('query'));

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course templates');
      }
    }
  )
  .get(
    '/:templateId',
    describeRoute({
      description: `Get a course template with its outline, item counts and the settings a new course starts with; ${ORG_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Template returned successfully', itemResponse(ZPublicApiCourseTemplateResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponses.read,
        404: templateNotFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseTemplateParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const template = await getCourseTemplateService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: template }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course template');
      }
    }
  )
  .post(
    '/:templateId/courses',
    describeRoute({
      description: `Create an unpublished course from a template, copying its content and settings; ${ORG_ADMIN_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse(
          'Course created; the key creator is added to it as a tutor',
          itemResponse(ZPublicApiCourseResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponses.create,
        404: templateNotFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseTemplateParam),
    validator('json', ZPublicApiCreateCourseFromTemplate),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const course = await createCourseFromTemplateService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: course }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create course from template');
      }
    }
  );

export const v1CourseSaveTemplateRouter = new Hono().post(
  '/',
  describeRoute({
    description: `Save a copy of a course as a new template, leaving the course itself unchanged; ${ORG_ADMIN_RULE}, and the organization must have a template left on its plan.`,
    tags: [TAG],
    responses: {
      201: jsonResponse(
        'Template created unpublished; the key creator is added to it as a tutor',
        itemResponse(ZPublicApiCourseResponse)
      ),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: forbiddenResponses.save,
      404: { description: 'Course not found, deleted, or it belongs to another organization' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseParam),
  validator('json', ZPublicApiSaveCourseTemplate),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const template = await saveCourseAsTemplateService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

      return c.json({ success: true, data: template }, 201);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to save course as template');
    }
  }
);
