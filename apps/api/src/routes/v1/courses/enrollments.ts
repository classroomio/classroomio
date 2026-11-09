import {
  ZPublicApiCourseParam,
  ZPublicApiEnrollCourseStudent,
  ZPublicApiEnrollCourseStudentResponse
} from '@cio/utils/validation/public-api';
import { describeRoute, validator } from 'hono-openapi';

import { enrollCourseStudentService } from '@api/services/v1/courses/enrollments';
import { toAutomationPrincipal } from '@api/utils/automation-principal';
import { getEventSource } from '@api/utils/event-source';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, mcpRateLimitResponse } from './docs';

export const v1CourseEnrollmentsRouter = new Hono().post(
  '/',
  describeRoute({
    description: `Enroll a student by email, inviting them first when they are new, and change nothing on repeat calls; ${COURSE_TEAM_RULE}.`,
    tags: ['Course Members'],
    responses: {
      200: jsonResponse(
        'status says whether the student was enrolled, invited, or already was',
        itemResponse(ZPublicApiEnrollCourseStudentResponse)
      ),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: { description: 'The token lacks the course:member:write scope, or the actor cannot manage this course' },
      404: { description: 'Course not found' },
      409: { description: 'The email belongs to an admin or tutor (code STAFF_CANNOT_ENROLL)' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseParam),
  validator('json', ZPublicApiEnrollCourseStudent),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const params = c.req.valid('param');
      const payload = c.req.valid('json');
      const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
      const enrollment = await enrollCourseStudentService(
        orgId,
        actorId,
        params,
        payload,
        principal,
        getEventSource(c)
      );

      return c.json({ success: true, data: enrollment }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to enroll student');
    }
  }
);
