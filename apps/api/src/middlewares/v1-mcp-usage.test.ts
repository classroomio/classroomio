import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';
import { AppError } from '@api/utils/errors';
import { getMcpAutomationCategory } from '@cio/utils/plans';

const mocks = vi.hoisted(() => ({
  reserve: vi.fn(),
  complete: vi.fn(),
  release: vi.fn(),
  handler: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: mocks.reserve,
  completeMcpAutomationUsage: mocks.complete,
  releaseMcpAutomationUsage: mocks.release
}));

import { MCP_V1_ROUTE_TOOL_MAP, v1McpUsageMiddleware } from './v1-mcp-usage';

const injectAutomationKey = async (c: Context, next: Next) => {
  c.set('automationKey', { id: 'key-id', organizationId: 'org-id', type: 'mcp' } as never);
  await next();
};

function buildApp() {
  return new Hono()
    .use('*', injectAutomationKey)
    .use('*', v1McpUsageMiddleware)
    .post('/public-api/v1/cohorts/:cohortId/goals', (c) => {
      mocks.handler();
      return c.json({ success: true }, 201);
    })
    .post('/public-api/v1/cohorts/:cohortId/members', (c) => c.json({ success: false }, 400))
    .get('/public-api/v1/courses', (c) => c.json({ success: true }, 200));
}

describe('v1McpUsageMiddleware', () => {
  beforeEach(() => {
    mocks.reserve.mockReset().mockResolvedValue('reservation-id');
    mocks.complete.mockReset().mockResolvedValue(undefined);
    mocks.release.mockReset().mockResolvedValue(undefined);
    mocks.handler.mockReset();
  });

  it('reserves a slot before the handler and completes it with the mapped tool and its credit cost', async () => {
    const response = await buildApp().request('/public-api/v1/cohorts/cohort-id/goals', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(mocks.reserve).toHaveBeenCalledWith(expect.objectContaining({ id: 'key-id' }), 'write', 'pending POST');
    expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(mocks.handler.mock.invocationCallOrder[0]!);
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', 'create_cohort_goal', 1);
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it('releases the reservation when the request fails, so failed calls do not count', async () => {
    const response = await buildApp().request('/public-api/v1/cohorts/cohort-id/members', { method: 'POST' });

    expect(response.status).toBe(400);
    expect(mocks.release).toHaveBeenCalledWith('reservation-id');
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('returns 429 without running the handler when the limit is reached', async () => {
    mocks.reserve.mockRejectedValue(
      new AppError('Automation rate limit exceeded', 'AUTOMATION_RATE_LIMIT_EXCEEDED', 429)
    );

    const response = await buildApp().request('/public-api/v1/cohorts/cohort-id/goals', { method: 'POST' });

    expect(response.status).toBe(429);
    expect(mocks.handler).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when the limiter cannot record the request', async () => {
    mocks.reserve.mockRejectedValue(new Error('connection refused'));

    const response = await buildApp().request('/public-api/v1/cohorts/cohort-id/goals', { method: 'POST' });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'AUTOMATION_USAGE_UNAVAILABLE' });
    expect(mocks.handler).not.toHaveBeenCalled();
  });

  it('still returns the response when completing the reservation fails; the slot stays counted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.complete.mockRejectedValue(new Error('write failed'));

    const response = await buildApp().request('/public-api/v1/cohorts/cohort-id/goals', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it('resolves the full route pattern when routers are nested like the real v1 router', async () => {
    const goalsRouter = new Hono().post('/:goalId/archive', (c) => c.json({ success: true }, 200));
    const cohortsRouter = new Hono().route('/:cohortId/goals', goalsRouter);
    const v1Router = new Hono()
      .use('*', injectAutomationKey)
      .use('*', v1McpUsageMiddleware)
      .route('/cohorts', cohortsRouter);
    const app = new Hono().route('/public-api/v1', v1Router);

    const response = await app.request('/public-api/v1/cohorts/cohort-id/goals/goal-id/archive', { method: 'POST' });

    expect(response.status).toBe(200);
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', 'archive_cohort_goal', 1);
  });

  it('falls back to the method+route action with zero credits for an unmapped route', async () => {
    const response = await buildApp().request('/public-api/v1/courses', { method: 'GET' });

    expect(response.status).toBe(200);
    expect(mocks.reserve).toHaveBeenCalledWith(expect.anything(), 'read', 'pending GET');
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', 'GET /public-api/v1/courses', 0);
  });

  it('reserves under the same category every mapped tool is billed as (GET is read, everything else write)', () => {
    for (const methods of Object.values(MCP_V1_ROUTE_TOOL_MAP)) {
      for (const [method, toolName] of Object.entries(methods)) {
        expect([toolName, getMcpAutomationCategory(toolName!)]).toEqual([
          toolName,
          method === 'GET' ? 'read' : 'write'
        ]);
      }
    }
  });
});
