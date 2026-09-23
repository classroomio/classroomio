import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  assertAllowed: vi.fn(),
  recordUsage: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  assertMcpAutomationUsageAllowedForCategory: mocks.assertAllowed,
  recordMcpAutomationUsageForAction: mocks.recordUsage
}));

import { v1McpUsageMiddleware } from './v1-mcp-usage';

function buildApp() {
  const injectAutomationKey = async (c: Context, next: Next) => {
    c.set('automationKey', { id: 'key-id', organizationId: 'org-id', type: 'mcp' } as never);
    await next();
  };

  return new Hono()
    .use('*', injectAutomationKey)
    .use('*', v1McpUsageMiddleware)
    .post('/public-api/v1/cohorts/:cohortId/goals', (c) => c.json({ success: true }, 201))
    .get('/public-api/v1/courses', (c) => c.json({ success: true }, 200));
}

describe('v1McpUsageMiddleware', () => {
  beforeEach(() => {
    mocks.assertAllowed.mockReset();
    mocks.recordUsage.mockReset().mockResolvedValue(undefined);
  });

  it('records the mapped tool name and its credit cost for a known cohort route', async () => {
    const app = buildApp();

    const response = await app.request('/public-api/v1/cohorts/cohort-id/goals', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(mocks.recordUsage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'key-id' }),
      'create_cohort_goal',
      'write',
      1
    );
  });

  it('resolves the full route pattern when routers are nested like the real v1 router', async () => {
    const goalsRouter = new Hono().post('/:goalId/archive', (c) => c.json({ success: true }, 200));
    const cohortsRouter = new Hono().route('/:cohortId/goals', goalsRouter);
    const v1Router = new Hono()
      .use('*', async (c: Context, next: Next) => {
        c.set('automationKey', { id: 'key-id', organizationId: 'org-id', type: 'mcp' } as never);
        await next();
      })
      .use('*', v1McpUsageMiddleware)
      .route('/cohorts', cohortsRouter);
    const app = new Hono().route('/public-api/v1', v1Router);

    const response = await app.request('/public-api/v1/cohorts/cohort-id/goals/goal-id/archive', { method: 'POST' });

    expect(response.status).toBe(200);
    expect(mocks.recordUsage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'key-id' }),
      'archive_cohort_goal',
      'write',
      1
    );
  });

  it('falls back to the method+route action with zero credits for an unmapped route', async () => {
    const app = buildApp();

    const response = await app.request('/public-api/v1/courses', { method: 'GET' });

    expect(response.status).toBe(200);
    expect(mocks.recordUsage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'key-id' }),
      'GET /public-api/v1/courses',
      'read',
      0
    );
  });
});
