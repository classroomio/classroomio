import { Hono } from '@api/utils/hono';
import { ZMarketingCourseFunnel, ZMarketingRange } from '@cio/utils/validation/marketing';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';
import {
  getCountryBreakdown,
  getCourseFunnel,
  getLandingStats,
  getPopularTypes,
  getTopCoursesByViews
} from '@api/services/marketing';

export const marketingRouter = new Hono()
  .get('/landing-stats', authMiddleware, orgMemberMiddleware, zValidator('query', ZMarketingRange), async (c) => {
    try {
      const { days } = c.req.valid('query');
      const orgId = c.get('orgId')!;
      const bust = c.req.query('bust') === '1';
      const result = await getLandingStats(orgId, days, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load landing stats');
    }
  })
  .get('/country-breakdown', authMiddleware, orgMemberMiddleware, zValidator('query', ZMarketingRange), async (c) => {
    try {
      const { days } = c.req.valid('query');
      const orgId = c.get('orgId')!;
      const bust = c.req.query('bust') === '1';
      const result = await getCountryBreakdown(orgId, days, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load country breakdown');
    }
  })
  .get(
    '/course-funnel',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('query', ZMarketingCourseFunnel),
    async (c) => {
      try {
        const { days, courseId } = c.req.valid('query');
        const orgId = c.get('orgId')!;
        const bust = c.req.query('bust') === '1';
        const result = await getCourseFunnel(orgId, days, courseId, bust);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load course funnel');
      }
    }
  )
  .get('/popular-types', authMiddleware, orgMemberMiddleware, zValidator('query', ZMarketingRange), async (c) => {
    try {
      const { days } = c.req.valid('query');
      const orgId = c.get('orgId')!;
      const bust = c.req.query('bust') === '1';
      const result = await getPopularTypes(orgId, days, bust);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load popular course types');
    }
  })
  .get('/top-courses', authMiddleware, orgMemberMiddleware, zValidator('query', ZMarketingRange), async (c) => {
    try {
      const { days } = c.req.valid('query');
      const orgId = c.get('orgId')!;
      const bust = c.req.query('bust') === '1';
      const result = await getTopCoursesByViews(orgId, days, bust);

      c.header('Cache-Control', 'no-store');
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load top courses');
    }
  });
