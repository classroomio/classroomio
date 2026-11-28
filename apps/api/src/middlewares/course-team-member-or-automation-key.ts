import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { invalidIdResponse } from '@api/utils/id-validation';
import { isValidUuid } from '@cio/utils/validation';
import { describeMissingScopes, organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { courseTeamMemberMiddleware } from './course-team-member';

export const courseTeamMemberOrAutomationKeyMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    try {
      const automationKey = c.get('automationKey');
      const courseId = c.req.param('courseId') || c.req.query('courseId');

      if (!automationKey) {
        if (courseId && !isValidUuid(courseId)) {
          return invalidIdResponse(c, 'course');
        }

        return courseTeamMemberMiddleware(c, async () => {
          const user = c.get('user')!;
          const courseOrgId = courseId ? await getCourseOrganizationId(courseId) : null;

          c.set('orgId', courseOrgId);
          c.set('actorId', user.id);

          return next();
        });
      }

      if (!organizationApiKeyHasScopes(automationKey.scopes ?? [], requiredScopes)) {
        return c.json(
          {
            success: false,
            error: describeMissingScopes(automationKey.scopes ?? [], requiredScopes),
            code: ErrorCodes.FORBIDDEN
          },
          403
        );
      }

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

      if (!isValidUuid(courseId)) {
        return invalidIdResponse(c, 'course');
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
