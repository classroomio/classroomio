import { ZPublicApiFeaturedCoursesResponse, ZPublicApiSetFeaturedCourses } from '@cio/utils/validation/public-api';
import { setPublicApiFeaturedCoursesService } from '@api/services/v1/organization/landing-page';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { LANDING_PAGE_TAG, ORG_ADMIN_RULE, organizationForbiddenResponse } from './docs';

export const v1LandingPageRouter = new Hono().put(
  '/featured-courses',
  describeRoute({
    description: `Set the published courses shown first, in order, on the organization landing page and public course list; ${ORG_ADMIN_RULE}.`,
    tags: [LANDING_PAGE_TAG],
    responses: {
      200: jsonResponse('Featured courses set successfully', itemResponse(ZPublicApiFeaturedCoursesResponse)),
      400: { description: 'Invalid request body, or a course is not published, is deleted or is a template' },
      401: errorResponses.unauthorized,
      403: organizationForbiddenResponse('organization:write'),
      404: { description: 'Course not found' }
    }
  }),
  validator('json', ZPublicApiSetFeaturedCourses),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const payload = c.req.valid('json');
      const result = await setPublicApiFeaturedCoursesService(orgId, actorId, payload);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to set featured courses');
    }
  }
);
