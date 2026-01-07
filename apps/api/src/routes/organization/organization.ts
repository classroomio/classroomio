import {
  ZCancelOrgPlan,
  ZCreateOrgPlan,
  ZCreateOrganization,
  ZGetCoursesBySiteName,
  ZGetOrgSetup,
  ZGetOrganizations,
  ZGetUserAnalytics,
  ZInviteTeamMembers,
  ZLMSExercisesParam,
  ZRemoveTeamMember,
  ZUpdateOrgPlan,
  ZUpdateOrganization
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
  getPublicCourses,
  getRecommendedCourses,
  getUserAnalytics,
  getUserEnrolledCourses,
  inviteTeamMembers,
  removeTeamMember,
  updateOrg,
  updateOrgPlan
} from '@api/services/organization';

import { Hono } from '@api/utils/hono';
import { TOrganization } from '@db/types';
import { authMiddleware } from '@api/middlewares/auth';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { getLMSExercisesService } from '@api/services/exercise';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { quizRouter } from '@api/routes/organization/quiz';
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
   * GET /organization/team
   * Gets organization team members (non-students)
   * Requires authentication
   */
  .get('/team', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
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
   * POST /organization/team/invite
   * Invites team members to an organization
   * Requires authentication and admin role
   */
  .post('/team/invite', authMiddleware, orgAdminMiddleware, zValidator('json', ZInviteTeamMembers), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
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
  })
  /**
   * DELETE /organization/team/:memberId
   * Removes a team member from an organization
   * Requires authentication and admin role
   */
  .delete('/team/:memberId', authMiddleware, orgAdminMiddleware, zValidator('param', ZRemoveTeamMember), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { memberId } = c.req.valid('param');

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
  })
  /**
   * GET /organization/audience
   * Gets organization audience (students)
   * Requires authentication
   */
  .get('/audience', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
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
  })
  /**
   * GET /organization/audience/:userId/analytics
   * Gets user analytics for a specific user in an organization
   * Requires authentication and organization membership
   */
  .get(
    '/audience/:userId/analytics',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZGetUserAnalytics),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { userId } = c.req.valid('param');
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
   * GET /organization/courses/public
   * Gets published courses for an organization (public landing page)
   * Query params: siteName (string)
   * No authentication required - returns only published courses
   */
  .get('/courses/public', zValidator('query', ZGetCoursesBySiteName), async (c) => {
    try {
      const { siteName } = c.req.valid('query');
      const courses = await getPublicCourses(siteName);

      return c.json(
        {
          success: true,
          data: courses
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch public courses');
    }
  })
  /**
   * GET /organization/courses/enrolled
   * Gets enrolled courses for a user in an organization (used in lms)
   * Requires authentication and organization membership
   */
  .get('/courses/enrolled', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;

      const orgId = c.req.header('cio-org-id')!;
      const result = await getUserEnrolledCourses(orgId, user.id);

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch courses');
    }
  })
  /**
   * GET /organization/courses/recommended
   * Gets recommended courses (published courses user isn't enrolled in) for a user in an organization (used in lms)
   * Requires authentication and organization membership
   */
  .get('/courses/recommended', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;

      const orgId = c.req.header('cio-org-id')!;
      const result = await getRecommendedCourses(orgId, user.id);

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch recommended courses');
    }
  })
  /**
   * GET /organization/courses
   * Gets courses for an organization with role-based filtering (used in dashboard)
   * Requires authentication and organization membership
   */
  .get('/courses', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId');
      const userRole = c.get('userRole');

      if (!orgId || userRole === null) {
        return c.json(
          {
            success: false,
            error: 'Organization context not available',
            code: 'ORG_CONTEXT_MISSING'
          },
          500
        );
      }

      const result = await getOrganizationCourses(orgId, user.id, userRole);

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch courses');
    }
  })
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
      const user = c.get('user')!;
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
   * PUT /organization
   * Updates an organization (name, avatarUrl)
   * Requires authentication
   */
  .put('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateOrganization), async (c) => {
    try {
      console.log('updateOrg');
      console.log(c.req.valid('json'));
      const orgId = c.req.header('cio-org-id')!;

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
  })
  /**
   * GET /organization/:orgId/exercises/lms
   * Gets exercises with submissions for a student in an organization
   * Returns exercises from unlocked lessons in courses where the student is a member
   * Requires authentication and organization membership
   */
  .get('/:orgId/exercises/lms', authMiddleware, zValidator('param', ZLMSExercisesParam), async (c) => {
    try {
      const { orgId } = c.req.valid('param');
      const user = c.get('user')!;

      // Check org membership manually since middleware expects header
      const { getUserOrgRole } = await import('@cio/db/queries/organization');
      const roleId = await getUserOrgRole(orgId, user.id);
      if (roleId === null) {
        return c.json(
          {
            success: false,
            error: 'UNAUTHORIZED',
            code: 'UNAUTHORIZED'
          },
          403
        );
      }

      const exercises = await getLMSExercisesService(user.id, orgId);

      return c.json(
        {
          success: true,
          data: exercises
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch LMS exercises');
    }
  })
  .route('/:orgId/quiz', quizRouter);
