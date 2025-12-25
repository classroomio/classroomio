import {
  ZCancelOrgPlan,
  ZCreateOrgPlan,
  ZCreateOrganization,
  ZGetCoursesBySiteName,
  ZGetOrgSetup,
  ZGetOrganizationAudience,
  ZGetOrganizationTeam,
  ZGetOrganizations,
  ZGetUserAnalytics,
  ZInviteTeamMembers,
  ZRemoveTeamMember,
  ZUpdateOrgPlan,
  ZUpdateOrganization,
  ZUpdateOrganizationParam
} from '@cio/utils/validation/organization';
import {
  cancelOrgPlan,
  createOrg,
  createOrgPlan,
  getOrgAudience,
  getOrgSetupData,
  getOrgTeam,
  getOrganizationCourses,
  getOrganizationsWithFilters,
  getUserAnalytics,
  inviteTeamMembers,
  removeTeamMember,
  updateOrg,
  updateOrgPlan
} from '@api/services/organization';

import { Hono } from '@api/utils/hono';
import { TOrganization } from '@db/types';
import { authMiddleware } from '@api/middlewares/auth';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const organizationRouter = new Hono()
  /**
   * GET /organization
   * Gets organizations with optional filters
   * Query params: siteName (string, optional), customDomain (string, optional), isCustomDomainVerified (boolean, optional)
   * Accepts: User session OR API key (for server-side routes)
   */
  .get('/', authOrApiKeyMiddleware, zValidator('query', ZGetOrganizations), async (c) => {
    try {
      const filters = c.req.valid('query');
      console.log('filters', filters);
      const organizations = await getOrganizationsWithFilters(filters);

      return c.json(
        {
          success: true,
          data: organizations
        },
        200
      );
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return handleError(c, error, 'Failed to fetch organizations');
    }
  })
  /**
   * GET /organization/:orgId/team
   * Gets organization team members (non-students)
   * Requires authentication
   */
  .get('/:orgId/team', authMiddleware, orgMemberMiddleware, zValidator('param', ZGetOrganizationTeam), async (c) => {
    try {
      const { orgId } = c.req.valid('param');
      const team = await getOrgTeam(orgId);

      return c.json(
        {
          success: true,
          data: team
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch organization team');
    }
  })
  /**
   * POST /organization/:orgId/team/invite
   * Invites team members to an organization
   * Requires authentication and admin role
   */
  .post(
    '/:orgId/team/invite',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZGetOrganizationTeam),
    zValidator('json', ZInviteTeamMembers),
    async (c) => {
      try {
        const { orgId } = c.req.valid('param');
        const { emails, roleId } = c.req.valid('json');

        const members = await inviteTeamMembers(orgId, emails, roleId);

        return c.json(
          {
            success: true,
            data: members
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to invite team members');
      }
    }
  )
  /**
   * DELETE /organization/:orgId/team/:memberId
   * Removes a team member from an organization
   * Requires authentication and admin role
   */
  .delete(
    '/:orgId/team/:memberId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZRemoveTeamMember),
    async (c) => {
      try {
        const { orgId, memberId } = c.req.valid('param');

        await removeTeamMember(orgId, memberId);

        return c.json(
          {
            success: true
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to remove team member');
      }
    }
  )
  /**
   * GET /organization/:orgId/audience
   * Gets organization audience (students)
   * Requires authentication
   */
  .get(
    '/:orgId/audience',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZGetOrganizationAudience),
    async (c) => {
      try {
        const { orgId } = c.req.valid('param');
        const audience = await getOrgAudience(orgId);

        return c.json(
          {
            success: true,
            data: audience
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch organization audience');
      }
    }
  )
  /**
   * GET /organization/:orgId/audience/:userId/analytics
   * Gets user analytics for a specific user in an organization
   * Requires authentication and organization membership
   */
  .get(
    '/:orgId/audience/:userId/analytics',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZGetUserAnalytics),
    async (c) => {
      try {
        const { orgId, userId } = c.req.valid('param');
        const analytics = await getUserAnalytics(userId, orgId);

        return c.json(
          {
            success: true,
            data: analytics
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch user analytics');
      }
    }
  )
  /**
   * GET /organization/courses
   * Gets courses by organization siteName
   * Query params: siteName (string)
   * Requires authentication - filters courses based on user permissions:
   * - Admins see all courses (published and unpublished)
   * - Students/Teachers only see published courses they have access to
   * - Public (no auth): only see published courses
   */
  .get(
    '/courses',
    authMiddleware,
    // TODO: Ratelimit this endpoint
    // TODO: Add cache
    // TODO: Add pagination
    // TODO: Add sorting
    zValidator('query', ZGetCoursesBySiteName),
    async (c) => {
      try {
        const { siteName } = c.req.valid('query');
        const user = c.get('user');

        const courses = await getOrganizationCourses(siteName, user.id);

        return c.json(
          {
            success: true,
            data: courses
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch courses');
      }
    }
  )
  /**
   * GET /organization/setup
   * Gets setup data for an organization (courses, lessons, exercises, org info)
   * Query params: siteName (string)
   */
  .get('/setup', zValidator('query', ZGetOrgSetup), async (c) => {
    try {
      const { siteName } = c.req.valid('query');
      const setupData = await getOrgSetupData(siteName);

      return c.json(
        {
          success: true,
          data: setupData
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch setup data');
    }
  })
  /**
   * POST /organization/plan
   * Creates a new organization plan
   * Requires authentication (user session or API key)
   */
  .post('/plan', authOrApiKeyMiddleware, zValidator('json', ZCreateOrgPlan), async (c) => {
    try {
      const data = c.req.valid('json');
      const plan = await createOrgPlan(data);

      return c.json(
        {
          success: true,
          data: plan
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create organization plan');
    }
  })
  /**
   * PUT /organization/plan
   * Updates an organization plan by subscription ID
   * Requires authentication (user session or API key)
   */
  .put('/plan', authOrApiKeyMiddleware, zValidator('json', ZUpdateOrgPlan), async (c) => {
    try {
      const { subscriptionId, payload } = c.req.valid('json');
      const plan = await updateOrgPlan(subscriptionId, payload);

      return c.json(
        {
          success: true,
          data: plan
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to update organization plan');
    }
  })
  /**
   * POST /organization/plan/cancel
   * Cancels an organization plan by subscription ID
   * Requires authentication (user session or API key)
   */
  .post('/plan/cancel', authOrApiKeyMiddleware, zValidator('json', ZCancelOrgPlan), async (c) => {
    try {
      const { subscriptionId, payload } = c.req.valid('json');
      const plan = await cancelOrgPlan(subscriptionId, payload);

      return c.json(
        {
          success: true,
          data: plan
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to cancel organization plan');
    }
  })
  /**
   * POST /organization
   * Creates a new organization with the current user as owner
   * Requires authentication
   */
  .post('/', authMiddleware, zValidator('json', ZCreateOrganization), async (c) => {
    try {
      const user = c.get('user');
      const data = c.req.valid('json');

      const result = await createOrg(user.id, data);

      return c.json(
        {
          success: true,
          data: result
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create organization');
    }
  })
  /**
   * PUT /organization/:orgId
   * Updates an organization (name, avatarUrl)
   * Requires authentication
   */
  .put(
    '/:orgId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZUpdateOrganizationParam),
    zValidator('json', ZUpdateOrganization),
    async (c) => {
      try {
        console.log('updateOrg');
        console.log(c.req.valid('param'));
        console.log(c.req.valid('json'));
        const { orgId } = c.req.valid('param');

        const data = c.req.valid('json') as Partial<TOrganization>;

        const organization = await updateOrg(orgId, data);

        return c.json(
          {
            success: true,
            data: organization
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update organization');
      }
    }
  );
