import { Context, Next } from 'hono';
import { z } from 'zod';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { describeMissingScopes, organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { courseTeamMemberMiddleware } from './course-team-member';

// Course ids are Postgres uuids. This runs before the route's own validator, so a malformed
// id has to be refused here, or the lookup throws and the caller gets a 500. `guid` rather
// than `uuid`: it takes any 8-4-4-4-12 hex id, which is what Postgres accepts, whereas
// `uuid` also demands RFC version bits and would refuse ids the database holds.
const ZCourseId = z.guid();

const invalidCourseId = (c: Context) =>
  c.json({ success: false, error: 'Invalid course ID', code: ErrorCodes.VALIDATION_ERROR }, 400);

export const courseTeamMemberOrAutomationKeyMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    try {
      const automationKey = c.get('automationKey');
      const courseId = c.req.param('courseId') || c.req.query('courseId');

      if (!automationKey) {
        if (courseId && !ZCourseId.safeParse(courseId).success) {
          return invalidCourseId(c);
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

      if (!ZCourseId.safeParse(courseId).success) {
        return invalidCourseId(c);
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
