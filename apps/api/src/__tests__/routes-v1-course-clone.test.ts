import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope)),
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));

vi.mock('@api/services/v1/courses/course', () => ({
  clonePublicApiCourseService: vi.fn(),
  createPublicApiCourseService: vi.fn(),
  deletePublicApiCourseService: vi.fn(),
  exportCourseService: vi.fn(),
  getCourseService: vi.fn(),
  listCoursesService: vi.fn(),
  listCourseStudentsService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import { clonePublicApiCourseService, updatePublicApiCourseService } from '@api/services/v1/courses/course';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '22222222-2222-4222-8222-222222222222';

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], path: string, init: RequestInit = {}) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request(`/public-api/v1${path}`, {
    ...init,
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json', ...init.headers }
  });
};

const body = (method: string, payload: unknown): RequestInit => ({ method, body: JSON.stringify(payload) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(clonePublicApiCourseService).mockResolvedValue({ id: OTHER_COURSE_ID } as never);
});

describe('POST /public-api/v1/courses/:courseId/clone', () => {
  it('clones as the key creator and returns 201', async () => {
    const payload = { title: 'Copy', slug: 'copy' };
    const response = await requestAs('api', ['public_api:*'], `/courses/${COURSE_ID}/clone`, body('POST', payload));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, data: { id: OTHER_COURSE_ID } });
    expect(clonePublicApiCourseService).toHaveBeenCalledWith('org-1', 'actor-1', { courseId: COURSE_ID }, payload);
  });

  it('returns 400 for a bad course id or a missing title', async () => {
    const badId = await requestAs('api', ['public_api:*'], '/courses/not-a-uuid/clone', body('POST', { title: 'x' }));
    const noTitle = await requestAs('api', ['public_api:*'], `/courses/${COURSE_ID}/clone`, body('POST', {}));

    expect(badId.status).toBe(400);
    expect(noTitle.status).toBe(400);
    expect(clonePublicApiCourseService).not.toHaveBeenCalled();
  });

  it('returns 409 when a concurrent clone takes the slug first', async () => {
    vi.mocked(clonePublicApiCourseService).mockRejectedValue(
      Object.assign(new Error('Failed to create course'), { cause: { code: '23505' } })
    );

    const response = await requestAs(
      'api',
      ['public_api:*'],
      `/courses/${COURSE_ID}/clone`,
      body('POST', { title: 'Copy', slug: 'copy' })
    );

    expect(response.status).toBe(409);
  });
});

describe('MCP keys on the clone route', () => {
  it('meters clone_course at 1 credit with course:write', async () => {
    const response = await requestAs(
      'mcp',
      ['course:read', 'course:write'],
      `/courses/${COURSE_ID}/clone`,
      body('POST', { title: 'Copy' })
    );

    expect(response.status).toBe(201);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'clone_course', 1);
  });

  it('refuses a key with only course:read before the handler runs', async () => {
    const response = await requestAs(
      'mcp',
      ['course:read'],
      `/courses/${COURSE_ID}/clone`,
      body('POST', { title: 'Copy' })
    );

    expect(response.status).toBe(403);
    expect(clonePublicApiCourseService).not.toHaveBeenCalled();
  });

  it('does not open the other course routes to a course:write key', async () => {
    const response = await requestAs('mcp', ['course:write'], `/courses/${COURSE_ID}`, body('PUT', { title: 'x' }));

    expect(response.status).toBe(403);
    expect(updatePublicApiCourseService).not.toHaveBeenCalled();
  });
});
