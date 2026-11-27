import {
  ZPublicApiCourseParam,
  ZPublicApiCourseSettingsResponse,
  ZPublicApiUpdateCourseSettings
} from '@cio/utils/validation/public-api';
import {
  getPublicApiCourseSettingsService,
  updatePublicApiCourseSettingsService
} from '@api/services/v1/courses/settings';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, contentForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Course Settings';

const SettingsItemResponse = itemResponse(ZPublicApiCourseSettingsResponse);
const GetSettingsResponse = jsonResponse('Course settings, with defaults applied', SettingsItemResponse);
const UpdateSettingsResponse = jsonResponse('Course settings after the update', SettingsItemResponse);

export const v1CourseSettingsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get a course's student progression, self-enrollment, Markdown export and comment settings; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: GetSettingsResponse,
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.read,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const settings = await getPublicApiCourseSettingsService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: settings }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to get course settings');
      }
    }
  )
  .patch(
    '/',
    describeRoute({
      description: `Change a course's student progression, self-enrollment, Markdown export or comment settings; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: UpdateSettingsResponse,
        400: {
          description: 'Invalid request body, no setting sent, or self-enrollment turned on for a private course'
        },
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourseSettings),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const settings = await updatePublicApiCourseSettingsService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: settings }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course settings');
      }
    }
  );
