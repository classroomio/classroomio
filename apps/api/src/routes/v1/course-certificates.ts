import {
  ZPublicApiCourseParam,
  ZPublicApiListCourseCertificatesQuery,
  ZPublicApiUpdateCourseCertificate
} from '@cio/utils/validation/public-api';
import {
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { mcpToolUsageMiddleware } from '@api/middlewares/mcp-tool-usage';
import {
  COURSE_MEMBER_RULE,
  COURSE_TEAM_RULE,
  CertificateSettingsResponse,
  IssuedCertificatesResponse,
  PAGINATION_NOTE,
  courseForbiddenResponses,
  mcpRateLimitedResponse
} from './course-certificate-route-docs';

const TAG = 'Public API Course Certificates';

export const v1CourseCertificateRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get a course's certificate settings and design (template, accent colour, signatories, subtitle, ID format, download and email settings, completion rules). ${COURSE_MEMBER_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Certificate settings returned successfully', CertificateSettingsResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.member,
        404: { description: 'Course not found' },
        429: mcpRateLimitedResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    mcpToolUsageMiddleware('get_course_certificate'),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const certificate = await getPublicApiCourseCertificateService(orgId, actorId, params);

        return c.json({ success: true, data: certificate }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course certificate');
      }
    }
  )
  .put(
    '/',
    describeRoute({
      description: `Update a course's certificate settings and design. Omitted fields keep their stored values; design replaces the whole design object. Sending design without theme sets theme to design.templateId, as the dashboard editor does. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Certificate settings updated successfully', CertificateSettingsResponse),
        400: {
          description:
            'Invalid path or body, an empty body, a requiredExerciseId from another course, or a published compliance course left without a deadline'
        },
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.team,
        404: { description: 'Course not found' },
        429: mcpRateLimitedResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourseCertificate),
    mcpToolUsageMiddleware('update_course_certificate'),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const certificate = await updatePublicApiCourseCertificateService(orgId, actorId, params, payload);

        return c.json({ success: true, data: certificate }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course certificate');
      }
    }
  );

export const v1CourseCertificatesRouter = new Hono().get(
  '/',
  describeRoute({
    description: `List the students of a course who have earned its certificate, with when it was earned and when the certificate email was sent. Optional search matches name or email. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
    tags: [TAG],
    responses: {
      200: jsonResponse('Issued certificates returned successfully', IssuedCertificatesResponse),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: courseForbiddenResponses.team,
      404: { description: 'Course not found' },
      429: mcpRateLimitedResponse
    }
  }),
  validator('param', ZPublicApiCourseParam),
  validator('query', ZPublicApiListCourseCertificatesQuery),
  mcpToolUsageMiddleware('list_course_certificates'),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const params = c.req.valid('param');
      const query = c.req.valid('query');
      const result = await listPublicApiCourseCertificatesService(orgId, actorId, params, query);

      return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to list issued course certificates');
    }
  }
);
