import {
  ZAssignAudienceCourses,
  ZAudienceInviteByEmail,
  ZCancelOrgPlan,
  ZCreateLinkInvite,
  ZCreateOrgPlan,
  ZCreateOrganization,
  ZGetAudienceQuery,
  ZGetCoursesBySiteName,
  ZGetOrgSetup,
  ZGetOrganizationCoursesQuery,
  ZGetOrganizations,
  ZGetUserAnalytics,
  ZImportAudienceMembers,
  ZInviteTeamMembers,
  ZLMSExercisesParam,
  ZRemoveTeamMember,
  ZToggleLinkInvite,
  ZUpdateOrgPlan,
  ZUpdateOrganization
} from '@cio/utils/validation/organization';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import {
  assignAudienceToCourses,
  importAudienceMembers,
  resendAudienceInvite,
  revokeAudiencePendingInvite
} from '@api/services/organization/audience';
import {
  cancelOrgPlan,
  createOrg,
  createOrgPlan,
  getFirstOrgForSelfHosted,
  getOrgAudience,
  getOrgSetupData,
  getOrgTeam,
  getOrganizationCourses,
  getOrganizationsWithFilters,
  getPublicCourses,
  getRecommendedCourses,
  getUserAnalytics,
  getUserEnrolledCourses,
  removeAudienceMember,
  removeTeamMember,
  updateOrg,
  updateOrgPlan
} from '@api/services/organization';

import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';
import { TOrganization } from '@db/types';
import { assetsRouter } from '@api/routes/organization/assets';
import { autoJoinOrg } from '@api/services/organization/auto-join';
import { organizationAiTutorRouter } from '@api/routes/organization/ai-tutor';
import { organizationMemberEmailNotificationsRouter } from '@api/routes/organization/member-email-notifications';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { authMiddleware } from '@api/middlewares/auth';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { automationRouter } from '@api/routes/organization/automation';
import { courseImportRouter } from '@api/routes/organization/course-import';
import { getLMSExercisesService } from '@api/services/exercise';
import { handleError } from '@api/utils/errors';
import {
  fetchOrgLinkInvite,
  getOrCreateLinkInvite,
  inviteTeamMembers,
  toggleOrgLinkInvite
} from '@api/services/organization/invite';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgMemberOrAutomationKeyMiddleware } from '@api/middlewares/org-member-or-automation-key';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { quizRouter } from '@api/routes/organization/quiz';
import { searchRouter } from '@api/routes/organization/search';
import { tagsRouter } from '@api/routes/organization/tags';
import { widgetsRouter } from '@api/routes/organization/widgets';
import { zValidator } from '@hono/zod-validator';
import { ZGetRecommendedCourses } from '@cio/utils/validation/course';

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
   * GET /organization/first
   * Gets the first organization (for self-hosted single-org mode). Requires API key.
   */
  .get('/first', authOrApiKeyMiddleware, async (c) => {
    try {
      const org = await getFirstOrgForSelfHosted();
      return c.json(
        {
          success: true,
          data: org ? [org] : []
        },
        200
      );
    } catch (error) {
      console.error('Error fetching first organization:', error);
      return handleError(c, error, 'Failed to fetch first organization');
    }
  })
  /**
   * GET /organization/team
   * Gets organization team members (non-students)
   * Requires authentication
   */
  /**
   * POST /organization/auto-join
   * Idempotently joins the authenticated user to the org identified by the
   * `cio-org-id` header. Called by the dashboard's `setupApp` after a user
   * authenticates on a tenant site they aren't a member of yet. Respects
   * `disableSignup` and `inviteOnly` policies.
   */
  .post('/auto-join', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id');

      if (!orgId) {
        return c.json({ success: false, error: 'Organization ID is required', code: 'ORG_ID_REQUIRED' }, 400);
      }

      const result = await autoJoinOrg(user.id, orgId);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to auto-join organization');
    }
  })
  .get('/team', authMiddleware, orgTeamMemberMiddleware, async (c) => {
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
      const user = c.get('user')!;
      const { emails, roleId } = c.req.valid('json');

      const members = await inviteTeamMembers(orgId, emails, roleId, user.id);

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
   * GET /organization/link-invite
   * Returns the current org link invite (null if none created yet)
   */
  .get('/link-invite', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await fetchOrgLinkInvite(orgId);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch link invite');
    }
  })
  /**
   * POST /organization/link-invite
   * Get-or-create the org link invite
   */
  .post('/link-invite', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateLinkInvite), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const { roleId } = c.req.valid('json');
      const data = await getOrCreateLinkInvite(orgId, roleId, user.id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to create link invite');
    }
  })
  /**
   * PATCH /organization/link-invite
   * Enable or disable the org link invite
   */
  .patch('/link-invite', authMiddleware, orgAdminMiddleware, zValidator('json', ZToggleLinkInvite), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const { isRevoked } = c.req.valid('json');
      const data = await toggleOrgLinkInvite(orgId, isRevoked, user.id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to update link invite');
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
      const user = c.get('user')!;
      const { memberId } = c.req.valid('param');

      await removeTeamMember(orgId, memberId, user.id);

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
  .get('/audience', authMiddleware, orgTeamMemberMiddleware, zValidator('query', ZGetAudienceQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');
      const audience = await getOrgAudience(orgId, query);

      return c.json(
        {
          success: true,
          data: audience.items,
          pagination: audience.pagination,
          query: audience.query
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch organization audience');
    }
  })
  /**
   * DELETE /organization/audience/:memberId
   * Removes a student from the organization
   */
  .delete(
    '/audience/:memberId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZRemoveTeamMember),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { memberId } = c.req.valid('param');

        const deleted = await removeAudienceMember(orgId, memberId, user.id);

        return c.json(
          {
            success: true,
            data: deleted
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to remove audience member');
      }
    }
  )
  /**
   * POST /organization/audience/resend-invite
   * Resends a student org invite email (new token; optional course metadata from last invite)
   */
  .post(
    '/audience/resend-invite',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZAudienceInviteByEmail),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const data = c.req.valid('json');
        const result = await resendAudienceInvite(orgId, data, user.id);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to resend audience invite');
      }
    }
  )
  /**
   * POST /organization/audience/revoke-invite
   * Revokes an active (non-expired) pending student org invite
   */
  .post(
    '/audience/revoke-invite',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZAudienceInviteByEmail),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const data = c.req.valid('json');
        const result = await revokeAudiencePendingInvite(orgId, data, user.id);
        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to revoke audience invite');
      }
    }
  )
  /**
   * GET /organization/audience/:userId/analytics
   * Gets user analytics for a specific user in an organization
   * Requires authentication and organization membership
   */
  .get(
    '/audience/:userId/analytics',
    authMiddleware,
    orgTeamMemberMiddleware,
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
      const { siteName, tags, types, search, pricing, page, limit } = c.req.valid('query');
      const splitParam = (param: string | undefined) =>
        param
          ?.split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      const tagSlugs = splitParam(tags);
      const courseTypes = splitParam(types);
      const pagination = page !== undefined || limit !== undefined ? { page, limit } : undefined;
      const courses = await getPublicCourses(
        siteName,
        tagSlugs?.length ? tagSlugs : undefined,
        courseTypes?.length ? courseTypes : undefined,
        search || undefined,
        pricing || undefined,
        pagination
      );

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
  .get(
    '/courses/recommended',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('query', ZGetRecommendedCourses),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { limit, page = 1 } = c.req.valid('query');

        const orgId = c.req.header('cio-org-id')!;
        const { data, total } = await getRecommendedCourses(orgId, user.id, limit, page);

        const resolvedLimit = limit ?? total;
        const totalPages = resolvedLimit > 0 ? Math.ceil(total / resolvedLimit) : 1;

        return c.json(
          {
            success: true,
            data,
            pagination: { page, limit: resolvedLimit, total, totalPages }
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch recommended courses');
      }
    }
  )
  /**
   * GET /organization/courses
   * Gets courses for an organization with role-based filtering (used in dashboard)
   * Requires authentication and organization membership
   */
  .get(
    '/courses',
    authOrAutomationKeyMiddleware,
    orgMemberOrAutomationKeyMiddleware(['course:read']),
    zValidator('query', ZGetOrganizationCoursesQuery),
    async (c) => {
      try {
        const user = c.get('user');
        const orgId = c.get('orgId');
        const userRole = c.get('userRole');
        const automationKey = c.get('automationKey');
        const query = c.req.valid('query');

        if (!orgId) {
          return c.json(
            {
              success: false,
              error: 'Organization context not available',
              code: 'ORG_CONTEXT_MISSING'
            },
            500
          );
        }

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'list_org_courses');
        }

        const result = await getOrganizationCourses(
          orgId,
          user?.id ?? automationKey?.createdByProfileId ?? '',
          userRole ?? ROLE.ADMIN,
          query
        );

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'list_org_courses', {
            tags: query.tags,
            search: query.search,
            page: query.page,
            limit: query.limit
          });
        }

        return c.json(
          {
            success: true,
            data: result.items,
            pagination: result.pagination,
            query: result.query
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
   * Requires API key authentication
   */
  .post('/plan', apiKeyMiddleware, zValidator('json', ZCreateOrgPlan), async (c) => {
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
   * Requires API key authentication
   */
  .put('/plan', apiKeyMiddleware, zValidator('json', ZUpdateOrgPlan), async (c) => {
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
   * Requires API key authentication
   */
  .post('/plan/cancel', apiKeyMiddleware, zValidator('json', ZCancelOrgPlan), async (c) => {
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
  /**
   * POST /organization/audience/import
   * Imports users into the organization as students with optional course assignment
   * Requires authentication and admin role
   */
  .post(
    '/audience/import',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZImportAudienceMembers),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const data = c.req.valid('json');

        const result = await importAudienceMembers(orgId, data, user.id);

        return c.json(
          {
            success: true,
            data: result
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to import audience members');
      }
    }
  )
  /**
   * POST /organization/audience/assign-courses
   * Assigns existing audience members to one or more courses
   * Requires authentication and admin role
   */
  .post(
    '/audience/assign-courses',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZAssignAudienceCourses),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const data = c.req.valid('json');

        const result = await assignAudienceToCourses(orgId, data);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to assign audience to courses');
      }
    }
  )
  .route('/automation', automationRouter)
  .route('/course-import', courseImportRouter)
  .route('/search', searchRouter)
  .route('/tags', tagsRouter)
  .route('/widgets', widgetsRouter)
  .route('/assets', assetsRouter)
  .route('/ai-tutor', organizationAiTutorRouter)
  .route('/member/email-notifications', organizationMemberEmailNotificationsRouter)
  .route('/:orgId/quiz', quizRouter);
