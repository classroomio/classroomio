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
  setPublicApiFeaturedCoursesService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import {
  clonePublicApiCourseService,
  getCourseService,
  setPublicApiFeaturedCoursesService,
  updatePublicApiCourseService
} from '@api/services/v1/courses/course';
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
  vi.mocked(setPublicApiFeaturedCoursesService).mockImplementation(async (_orgId, _actorId, payload) => payload);
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

describe('PUT /public-api/v1/courses/featured', () => {
  it('sets featured courses in order and is not read as a course id', async () => {
    const payload = { courseIds: [OTHER_COURSE_ID, COURSE_ID] };
    const response = await requestAs('api', ['public_api:*'], '/courses/featured', body('PUT', payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: payload });
    expect(setPublicApiFeaturedCoursesService).toHaveBeenCalledWith('org-1', 'actor-1', payload);
    expect(updatePublicApiCourseService).not.toHaveBeenCalled();
    expect(getCourseService).not.toHaveBeenCalled();
  });

  it('accepts an empty list to clear the featured courses', async () => {
    const response = await requestAs('api', ['public_api:*'], '/courses/featured', body('PUT', { courseIds: [] }));

    expect(response.status).toBe(200);
  });

  it.each([
    [
      'more than four ids',
      { courseIds: Array.from({ length: 5 }, (_, i) => `0000000${i}-0000-4000-8000-000000000000`) }
    ],
    ['duplicate ids', { courseIds: [COURSE_ID, COURSE_ID] }],
    ['a non-uuid id', { courseIds: ['nope'] }],
    ['a missing list', {}]
  ])('returns 400 for %s', async (_label, payload) => {
    const response = await requestAs('api', ['public_api:*'], '/courses/featured', body('PUT', payload));

    expect(response.status).toBe(400);
    expect(setPublicApiFeaturedCoursesService).not.toHaveBeenCalled();
  });
});

describe('MCP keys on the clone and featured routes', () => {
  it.each([
    ['clone_course', 201, `/courses/${COURSE_ID}/clone`, body('POST', { title: 'Copy' })],
    ['set_featured_courses', 200, '/courses/featured', body('PUT', { courseIds: [COURSE_ID] })]
  ])('meters %s at 1 credit with course:write', async (toolName, status, path, init) => {
    const response = await requestAs('mcp', ['course:read', 'course:write'], path, init);

    expect(response.status).toBe(status);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', toolName, 1);
  });

  it.each([
    ['clone', `/courses/${COURSE_ID}/clone`, body('POST', { title: 'Copy' })],
    ['featured', '/courses/featured', body('PUT', { courseIds: [COURSE_ID] })]
  ])('refuses %s with only course:read before the handler runs', async (_label, path, init) => {
    const response = await requestAs('mcp', ['course:read'], path, init);

    expect(response.status).toBe(403);
    expect(clonePublicApiCourseService).not.toHaveBeenCalled();
    expect(setPublicApiFeaturedCoursesService).not.toHaveBeenCalled();
  });

  it('does not open the other course routes to a course:write key', async () => {
    const response = await requestAs('mcp', ['course:write'], `/courses/${COURSE_ID}`, body('PUT', { title: 'x' }));

    expect(response.status).toBe(403);
    expect(updatePublicApiCourseService).not.toHaveBeenCalled();
  });
});
