import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type * as z from 'zod';

import {
  ZAnalyticsDashboardParam,
  ZAnalyticsExportRequest,
  ZAnalyticsStudentExportRequest,
  ZAnalyticsQueryRequest,
  ZAnalyticsScope,
  ZUpdateAnalyticsSettings,
  type TAnalyticsDashboardParam,
  type TAnalyticsExportRequest,
  type TAnalyticsStudentExportRequest,
  type TAnalyticsQueryRequest
} from '@cio/utils/validation/analytics';

import { claimAnalyticsRefresh } from '@cio/core/utils/redis/analytics-cache';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import {
  exportAnalyticsStudentsForActor,
  exportAnalyticsQueryForActor,
  getAnalyticsDashboardForActor,
  runAnalyticsQueryForActor,
  updateAnalyticsSettings,
  type AnalyticsActor
} from '@api/services/analytics';
import type { AuthSession } from '@api/types/auth';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

const ANALYTICS_CACHE_CONTROL = 'private, no-store';

const queryRequestSchema: z.ZodType<TAnalyticsQueryRequest> = ZAnalyticsQueryRequest;
const exportRequestSchema: z.ZodType<TAnalyticsExportRequest> = ZAnalyticsExportRequest;
const studentExportRequestSchema: z.ZodType<TAnalyticsStudentExportRequest> = ZAnalyticsStudentExportRequest;
const dashboardParamSchema: z.ZodType<TAnalyticsDashboardParam> = ZAnalyticsDashboardParam;

const analyticsExportRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 6,
  message: 'Too many exports. Please try again shortly.',
  keyGenerator: (c) => `analytics_export:${c.get('user')?.id ?? 'anonymous'}`
});

function getAnalyticsActor(c: Context<AuthSession>): AnalyticsActor {
  const user = c.get('user')!;
  const orgId = c.get('orgId')!;
  const orgRoles = c.get('orgRoles') ?? {};

  return { profileId: user.id, orgId, orgRoles };
}

export const analyticsRouter = new Hono()
  .post('/query', authMiddleware, orgMemberMiddleware, zValidator('json', queryRequestSchema), async (c) => {
    c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);

    try {
      const actor = getAnalyticsActor(c);
      const request = c.req.valid('json');
      const result = await runAnalyticsQueryForActor(actor, request);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load analytics');
    }
  })
  .post(
    '/export',
    authMiddleware,
    orgMemberMiddleware,
    analyticsExportRateLimit,
    zValidator('json', exportRequestSchema),
    async (c) => {
      c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);

      try {
        const actor = getAnalyticsActor(c);
        const request = c.req.valid('json');
        const result = await exportAnalyticsQueryForActor(actor, request);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to export analytics');
      }
    }
  )
  .post(
    '/export/students',
    authMiddleware,
    orgMemberMiddleware,
    analyticsExportRateLimit,
    zValidator('json', studentExportRequestSchema),
    async (c) => {
      c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);

      try {
        const actor = getAnalyticsActor(c);
        const request = c.req.valid('json');
        const result = await exportAnalyticsStudentsForActor(actor, request);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to export analytics');
      }
    }
  )
  .get(
    '/dashboards/:scopeType/:scopeId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', dashboardParamSchema),
    async (c) => {
      c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);

      try {
        const actor = getAnalyticsActor(c);
        const param = c.req.valid('param');
        const dashboard = await getAnalyticsDashboardForActor(actor, param);

        return c.json({ success: true, data: dashboard }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load analytics dashboard');
      }
    }
  )
  .post('/dashboards-refresh', authMiddleware, orgMemberMiddleware, zValidator('json', ZAnalyticsScope), async (c) => {
    c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);

    try {
      const actor = getAnalyticsActor(c);
      const scope = c.req.valid('json');
      const refresh = await claimAnalyticsRefresh(actor.profileId, scope.type, scope.id, 'dashboard');
      const dashboard = await getAnalyticsDashboardForActor(
        actor,
        { scopeType: scope.type, scopeId: scope.id },
        { refresh }
      );

      return c.json({ success: true, data: dashboard }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to refresh analytics dashboard');
    }
  })
  .put('/settings', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateAnalyticsSettings), async (c) => {
    c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);

    try {
      const orgId = c.req.header('cio-org-id')!;
      const input = c.req.valid('json');
      const settings = await updateAnalyticsSettings(orgId, input);

      return c.json({ success: true, data: settings }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save analytics settings');
    }
  });
