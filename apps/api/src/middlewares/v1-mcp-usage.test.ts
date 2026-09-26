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
    .post('/public-api/v1/courses/:courseId/members', (c) => {
      mocks.handler();
      return c.json({ success: true }, 201);
    })
    .post('/public-api/v1/courses/:courseId/invites', (c) => c.json({ success: false }, 400));
}

describe('v1McpUsageMiddleware', () => {
  beforeEach(() => {
    mocks.reserve.mockReset().mockResolvedValue('reservation-id');
    mocks.complete.mockReset().mockResolvedValue(undefined);
    mocks.release.mockReset().mockResolvedValue(undefined);
    mocks.handler.mockReset();
  });

  it('reserves a slot before the handler and completes it with the mapped tool and its credit cost', async () => {
    const response = await buildApp().request('/public-api/v1/courses/course-id/members', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(mocks.reserve).toHaveBeenCalledWith(expect.objectContaining({ id: 'key-id' }), 'write', 'pending POST');
    expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(mocks.handler.mock.invocationCallOrder[0]!);
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', 'add_course_member', 1);
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it('releases the reservation when the request fails, so failed calls do not count', async () => {
    const response = await buildApp().request('/public-api/v1/courses/course-id/invites', { method: 'POST' });

    expect(response.status).toBe(400);
    expect(mocks.release).toHaveBeenCalledWith('reservation-id');
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('returns 429 without running the handler when the limit is reached', async () => {
    mocks.reserve.mockRejectedValue(
      new AppError('Automation rate limit exceeded', 'AUTOMATION_RATE_LIMIT_EXCEEDED', 429)
    );

    const response = await buildApp().request('/public-api/v1/courses/course-id/members', { method: 'POST' });

    expect(response.status).toBe(429);
    expect(mocks.handler).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when the limiter cannot record the request', async () => {
    mocks.reserve.mockRejectedValue(new Error('connection refused'));

    const response = await buildApp().request('/public-api/v1/courses/course-id/members', { method: 'POST' });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'AUTOMATION_USAGE_UNAVAILABLE' });
    expect(mocks.handler).not.toHaveBeenCalled();
  });

  it('still returns the response when completing the reservation fails; the slot stays counted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.complete.mockRejectedValue(new Error('write failed'));

    const response = await buildApp().request('/public-api/v1/courses/course-id/members', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(mocks.release).not.toHaveBeenCalled();
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
