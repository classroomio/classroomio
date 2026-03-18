import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { courseTeamMemberMiddleware } from './course-team-member';

export const courseTeamMemberOrAutomationKeyMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    try {
      const automationKey = c.get('automationKey');

      if (!automationKey) {
        return courseTeamMemberMiddleware(c, next);
      }

      if (!organizationApiKeyHasScopes(automationKey.scopes ?? [], requiredScopes)) {
        return c.json(
          {
            success: false,
            error: 'Automation key is missing required scopes',
            code: ErrorCodes.FORBIDDEN
          },
          403
        );
      }

      const courseId = c.req.param('courseId') || c.req.query('courseId');
      if (!courseId) {
        return c.json(
          {
            success: false,
            error: 'Course ID is required',
            code: 'COURSE_ID_REQUIRED'
          },
          400
        );
      }

      const courseOrgId = await getCourseOrganizationId(courseId);
      if (!courseOrgId) {
        return c.json(
          {
            success: false,
            error: 'Course not found',
            code: ErrorCodes.COURSE_NOT_FOUND
          },
          404
        );
      }

      if (courseOrgId !== automationKey.organizationId) {
        return c.json(
          {
            success: false,
            error: 'Invalid permissions',
            code: ErrorCodes.UNAUTHORIZED
          },
          403
        );
      }

      c.set('orgId', automationKey.organizationId);
      c.set('actorId', automationKey.createdByProfileId);

      return next();
    } catch (error) {
      console.error('Error in courseTeamMemberOrAutomationKeyMiddleware:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to verify course team access',
          code: 'COURSE_TEAM_MEMBER_CHECK_FAILED'
        },
        500
      );
    }
  };
