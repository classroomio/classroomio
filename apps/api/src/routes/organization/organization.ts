import {
  ZCancelOrgPlan,
  ZCreateOrgPlan,
  ZGetCoursesBySiteName,
  ZGetOrganizationAudience,
  ZGetOrganizationTeam,
  ZGetOrganizations,
  ZUpdateOrgPlan
} from '@cio/utils/validation/organization';
import {
  cancelOrgPlan,
  createOrgPlan,
  getCoursesByOrgSiteName,
  getOrgAudience,
  getOrgTeam,
  getOrganizationsWithFilters,
  updateOrgPlan
} from '@api/services/organization';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const organizationRouter = new Hono()
  /**
   * GET /organization
   * Gets organizations with optional filters
   * Query params: siteName (string, optional), customDomain (string, optional), isCustomDomainVerified (boolean, optional)
   */
  .get('/', zValidator('query', ZGetOrganizations), async (c) => {
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
      return handleError(c, error, 'Failed to fetch organizations');
    }
  })
  /**
   * GET /organization/:orgId/team
   * Gets organization team members (non-students)
   * Requires authentication
   */
  .get('/:orgId/team', authMiddleware, zValidator('param', ZGetOrganizationTeam), async (c) => {
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
   * GET /organization/:orgId/audience
   * Gets organization audience (students)
   * Requires authentication
   */
  .get('/:orgId/audience', authMiddleware, zValidator('param', ZGetOrganizationAudience), async (c) => {
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
  })
  /**
   * GET /organization/courses
   * Gets courses by organization siteName
   * Query params: siteName (string)
   */
  .get('/courses', zValidator('query', ZGetCoursesBySiteName), async (c) => {
    try {
      const { siteName } = c.req.valid('query');
      const courses = await getCoursesByOrgSiteName(siteName);

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
  })
  /**
   * POST /organization/plan
   * Creates a new organization plan
   * Requires authentication
   */
  .post('/plan', authMiddleware, zValidator('json', ZCreateOrgPlan), async (c) => {
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
   * Requires authentication
   */
  .put('/plan', authMiddleware, zValidator('json', ZUpdateOrgPlan), async (c) => {
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
   * Requires authentication
   */
  .post('/plan/cancel', authMiddleware, zValidator('json', ZCancelOrgPlan), async (c) => {
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
  });
