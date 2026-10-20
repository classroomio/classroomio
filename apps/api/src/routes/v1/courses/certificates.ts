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
} from '@api/services/v1/courses/certificates';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { slugifyForFilename } from '@api/utils/certificate';
import {
  COURSE_MEMBER_RULE,
  COURSE_TEAM_RULE,
  CertificateFileResponse,
  CertificateSettingsResponse,
  IssuedCertificatesResponse,
  courseForbiddenResponses,
  mcpRateLimitResponse
} from './docs';

const TAG = 'Course Certificates';

const CONTENT_TYPES = { pdf: 'application/pdf', png: 'image/png' } as const;

export const v1CourseCertificateRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get a course's certificate settings and design; ${COURSE_MEMBER_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Effective certificate settings: stored values, with defaults filled in where nothing is stored',
          CertificateSettingsResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.member,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
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
      description: `Partially update a course's certificate settings and design; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Certificate settings updated; returns the effective settings. Sending the same body twice gives the same result.',
          CertificateSettingsResponse
        ),
        400: {
          description:
            'Invalid path or body (including a deadline that is not an ISO 8601 datetime with a timezone), an empty body, or a published compliance course left without a deadline'
        },
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.teamWrite,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourseCertificate),
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
      description: `List the students who earned a course's certificate, with when they earned it and when its email was sent; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Issued certificates returned; compliance cycle and recertification history is not included',
          IssuedCertificatesResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.team,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiListCourseCertificatesQuery),
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
      description: `Download the certificate a student earned as a PDF or PNG, rendered with the course's current design; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: CertificateFileResponse,
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: courseForbiddenResponses.team,
        404: {
          description: 'Course not found, or the member is not a student of the course who earned the certificate'
        },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseCertificateMemberParam),
    validator('query', ZPublicApiDownloadCourseCertificateQuery),
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
