import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ recordAutomationChange: vi.fn() }));

vi.mock('@api/services/organization/automation-change', () => ({
  recordAutomationChange: mocks.recordAutomationChange
}));

import { Hono } from 'hono';
import type { Context, Next } from 'hono';

import { automationChangeLogMiddleware } from '@api/middlewares/automation-change-log';
import type { AuthSession } from '@api/types/auth';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const SECTION_ID = '22222222-2222-4222-8222-222222222222';
const mcpKey = { id: 'key-1', type: 'mcp', organizationId: 'org-1', createdByProfileId: 'actor-1' };

function authAs(key: typeof mcpKey | null) {
  return async (c: Context<AuthSession>, next: Next) => {
    c.set('automationKey', key as never);
    c.set('actorId', key ? key.createdByProfileId : null);
    c.set('clientName', key ? 'Claude' : null);
    await next();
  };
}

function buildApp(key: typeof mcpKey | null) {
  return new Hono<AuthSession>()
    .use('*', automationChangeLogMiddleware)
    .post('/public-api/v1/courses/:courseId/sections', authAs(key), (c) =>
      c.json({ success: true, data: { id: SECTION_ID, title: 'Week 1' } }, 201)
    )
    .post('/public-api/v1/courses', authAs(key), (c) =>
      c.json({ success: true, data: { course: { id: COURSE_ID }, banner: null } }, 201)
    )
    .delete('/public-api/v1/courses/:courseId/sections/:sectionId', authAs(key), (c) =>
      c.json({ success: true, data: { id: SECTION_ID } })
    )
    .post('/public-api/v1/analytics/academy/query', authAs(key), (c) => c.json({ success: true, data: { rows: [] } }))
    .get('/public-api/v1/courses/:courseId/sections', authAs(key), (c) => c.json({ success: true, data: [] }))
    .put('/course/:courseId/exercise/:exerciseId', authAs(key), (c) =>
      c.json({ success: false, error: 'Forbidden' }, 403)
    );
}

describe('automationChangeLogMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recordAutomationChange.mockResolvedValue({ id: 'log-1' });
  });

  it('records a create with its route, ids, tool name and the id it returned', async () => {
    const response = await buildApp(mcpKey).request(`/public-api/v1/courses/${COURSE_ID}/sections`, {
      method: 'POST'
    });

    expect(response.status).toBe(201);
    expect(mocks.recordAutomationChange).toHaveBeenCalledWith({
      automationKey: mcpKey,
      oauthClientId: undefined,
      clientName: 'Claude',
      actorProfileId: 'actor-1',
      method: 'POST',
      route: '/public-api/v1/courses/:courseId/sections',
      action: 'create_course_section',
      resourceIds: { courseId: COURSE_ID, createdId: SECTION_ID },
      statusCode: 201
    });
  });

  it('reads the created id from a nested object when data has no id of its own', async () => {
    await buildApp(mcpKey).request('/public-api/v1/courses', { method: 'POST' });

    expect(mocks.recordAutomationChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create_course', resourceIds: { createdId: COURSE_ID } })
    );
  });

  it('records deletes with the ids from the route', async () => {
    await buildApp(mcpKey).request(`/public-api/v1/courses/${COURSE_ID}/sections/${SECTION_ID}`, {
      method: 'DELETE'
    });

    expect(mocks.recordAutomationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_course_section',
        resourceIds: { courseId: COURSE_ID, sectionId: SECTION_ID }
      })
    );
  });

  it.each([
    ['a read', 'GET', `/public-api/v1/courses/${COURSE_ID}/sections`, mcpKey],
    ['a write that read-only analytics tools make with POST', 'POST', '/public-api/v1/analytics/academy/query', mcpKey],
    ['a failed write', 'PUT', `/course/${COURSE_ID}/exercise/${SECTION_ID}`, mcpKey],
    ['a write without an API key or OAuth token', 'POST', `/public-api/v1/courses/${COURSE_ID}/sections`, null]
  ])('does not record %s', async (_label, method, path, key) => {
    await buildApp(key).request(path, { method });

    expect(mocks.recordAutomationChange).not.toHaveBeenCalled();
  });

  it('keeps the response when the change cannot be recorded', async () => {
    mocks.recordAutomationChange.mockRejectedValue(new Error('database down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await buildApp(mcpKey).request(`/public-api/v1/courses/${COURSE_ID}/sections`, {
      method: 'POST'
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, data: { id: SECTION_ID, title: 'Week 1' } });
    consoleError.mockRestore();
  });

  it('records the full route pattern for routes mounted on a sub-router', async () => {
    const v1Router = new Hono<AuthSession>().post('/courses/:courseId/sections', authAs(mcpKey), (c) =>
      c.json({ success: true, data: { id: SECTION_ID } }, 201)
    );
    const app = new Hono<AuthSession>().use('*', automationChangeLogMiddleware).route('/public-api/v1', v1Router);

    await app.request(`/public-api/v1/courses/${COURSE_ID}/sections`, { method: 'POST' });

    expect(mocks.recordAutomationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        route: '/public-api/v1/courses/:courseId/sections',
        action: 'create_course_section',
        resourceIds: { courseId: COURSE_ID, createdId: SECTION_ID }
      })
    );
  });
});
