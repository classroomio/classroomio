import {
  ZPublicApiCourseCertificateMemberParam,
  ZPublicApiCourseParam,
  ZPublicApiDownloadCourseCertificateQuery,
  ZPublicApiListCourseCertificatesQuery,
  ZPublicApiUpdateCourseCertificate
} from '@cio/utils/validation/public-api';
import {
  downloadPublicApiCourseCertificateService,
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { automationKeyAnyScopeMiddleware } from '@api/middlewares/automation-key-scopes';
import { mcpToolUsageMiddleware } from '@api/middlewares/mcp-tool-usage';
import { slugifyForFilename } from '@api/utils/certificate';
import {
  CERTIFICATE_DOWNLOAD_DESCRIPTION,
  CERTIFICATE_UPDATE_DESCRIPTION,
  COURSE_MEMBER_RULE,
  COURSE_TEAM_RULE,
  CertificateFileResponse,
  CertificateSettingsResponse,
  EFFECTIVE_SETTINGS_NOTE,
  IssuedCertificatesResponse,
  PAGINATION_NOTE,
  courseForbiddenResponses,
  mcpRateLimitedResponse
} from './course-certificate-route-docs';

const TAG = 'Public API Course Certificates';

const CONTENT_TYPES = { pdf: 'application/pdf', png: 'image/png' } as const;

const certificateReadScope = automationKeyAnyScopeMiddleware(['public_api:*', 'course:certificate:read']);
const certificateWriteScope = automationKeyAnyScopeMiddleware(['public_api:*', 'course:certificate:write']);

export const v1CourseCertificateRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get a course's certificate settings and design (template, accent colour, signatories, subtitle, ID format, download and email settings, completion rules). ${EFFECTIVE_SETTINGS_NOTE} ${COURSE_MEMBER_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Effective certificate settings returned successfully', CertificateSettingsResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.member,
        404: { description: 'Course not found' },
        429: mcpRateLimitedResponse
      }
    }),
    certificateReadScope,
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
  .patch(
    '/',
    describeRoute({
      description: `${CERTIFICATE_UPDATE_DESCRIPTION} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Certificate settings updated; returns the effective settings', CertificateSettingsResponse),
        400: {
          description:
            'Invalid path or body (including a deadline that is not an ISO 8601 datetime with a timezone), an empty body, a requiredExerciseId from another course, or a published compliance course left without a deadline'
        },
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.teamWrite,
        404: { description: 'Course not found' },
        429: mcpRateLimitedResponse
      }
    }),
    certificateWriteScope,
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

export const v1CourseCertificatesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the students who earned a course's certificate, when they earned it, and when the certificate email was sent. Compliance cycle and recertification history is not included. Optional search matches name or email. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
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
    certificateReadScope,
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
  )
  .get(
    '/:memberId/download',
    describeRoute({
      description: `${CERTIFICATE_DOWNLOAD_DESCRIPTION} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: CertificateFileResponse,
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.team,
        404: {
          description: 'Course not found, or the member is not a student of the course who earned the certificate'
        },
        429: mcpRateLimitedResponse
      }
    }),
    certificateReadScope,
    validator('param', ZPublicApiCourseCertificateMemberParam),
    validator('query', ZPublicApiDownloadCourseCertificateQuery),
    mcpToolUsageMiddleware('download_course_certificate'),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const { file, format, courseName } = await downloadPublicApiCourseCertificateService(
          orgId,
          actorId,
          params,
          query
        );

        c.header('Content-Type', CONTENT_TYPES[format]);
        c.header(
          'Content-Disposition',
          `attachment; filename="certificate-${slugifyForFilename(courseName)}.${format}"`
        );

        return c.body(
          new ReadableStream({
            start(controller) {
              controller.enqueue(file);
              controller.close();
            }
          }),
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to download course certificate');
      }
    }
  );
