import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type * as z from 'zod';

import {
  ZInsightsDashboardParam,
  ZInsightsExportRequest,
  ZInsightsStudentExportRequest,
  ZInsightsQueryRequest,
  ZInsightsScope,
  ZUpdateInsightsSettings,
  type TInsightsDashboardParam,
  type TInsightsExportRequest,
  type TInsightsStudentExportRequest,
  type TInsightsQueryRequest
} from '@cio/utils/validation/insights';

import { claimInsightsRefresh } from '@cio/core/utils/redis/insights-cache';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import {
  exportInsightsStudentsForActor,
  exportInsightsQueryForActor,
  getInsightsDashboardForActor,
  runInsightsQueryForActor,
  updateInsightsSettings,
  type InsightsActor
} from '@api/services/insights';
import type { AuthSession } from '@api/types/auth';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

const INSIGHTS_CACHE_CONTROL = 'private, no-store';

const queryRequestSchema: z.ZodType<TInsightsQueryRequest> = ZInsightsQueryRequest;
const exportRequestSchema: z.ZodType<TInsightsExportRequest> = ZInsightsExportRequest;
const studentExportRequestSchema: z.ZodType<TInsightsStudentExportRequest> = ZInsightsStudentExportRequest;
const dashboardParamSchema: z.ZodType<TInsightsDashboardParam> = ZInsightsDashboardParam;

const insightsExportRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 6,
  message: 'Too many exports. Please try again shortly.',
  keyGenerator: (c) => `insights_export:${c.get('user')?.id ?? 'anonymous'}`
});

function getInsightsActor(c: Context<AuthSession>): InsightsActor {
  const user = c.get('user')!;
  const orgId = c.get('orgId')!;
  const orgRoles = c.get('orgRoles') ?? {};

  return { profileId: user.id, orgId, orgRoles };
}

export const insightsRouter = new Hono()
  .post('/query', authMiddleware, orgMemberMiddleware, zValidator('json', queryRequestSchema), async (c) => {
    c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

    try {
      const actor = getInsightsActor(c);
      const request = c.req.valid('json');
      const result = await runInsightsQueryForActor(actor, request);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load analytics');
    }
  })
  .post(
    '/export',
    authMiddleware,
    orgMemberMiddleware,
    insightsExportRateLimit,
    zValidator('json', exportRequestSchema),
    async (c) => {
      c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

      try {
        const actor = getInsightsActor(c);
        const request = c.req.valid('json');
        const result = await exportInsightsQueryForActor(actor, request);

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
    insightsExportRateLimit,
    zValidator('json', studentExportRequestSchema),
    async (c) => {
      c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

      try {
        const actor = getInsightsActor(c);
        const request = c.req.valid('json');
        const result = await exportInsightsStudentsForActor(actor, request);

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
      c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

      try {
        const actor = getInsightsActor(c);
        const param = c.req.valid('param');
        const dashboard = await getInsightsDashboardForActor(actor, param);

        return c.json({ success: true, data: dashboard }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load analytics dashboard');
      }
    }
  )
  .post('/dashboards-refresh', authMiddleware, orgMemberMiddleware, zValidator('json', ZInsightsScope), async (c) => {
    c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

    try {
      const actor = getInsightsActor(c);
      const scope = c.req.valid('json');
      const refresh = await claimInsightsRefresh(actor.profileId, scope.type, scope.id, 'dashboard');
      const dashboard = await getInsightsDashboardForActor(
        actor,
        { scopeType: scope.type, scopeId: scope.id },
        { refresh }
      );

      return c.json({ success: true, data: dashboard }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to refresh analytics dashboard');
    }
  })
  .put('/settings', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateInsightsSettings), async (c) => {
    c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

    try {
      const orgId = c.req.header('cio-org-id')!;
      const input = c.req.valid('json');
      const settings = await updateInsightsSettings(orgId, input);

      return c.json({ success: true, data: settings }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save analytics settings');
    }
  });
