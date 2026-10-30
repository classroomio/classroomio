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
  listRelatedCoursesService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import { getCourseService, listRelatedCoursesService } from '@api/services/v1/courses/course';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const PROFILE_ID = '22222222-2222-4222-8222-222222222222';

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], path: string) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request(`/public-api/v1${path}`, { headers: { Authorization: 'Bearer key' } });
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(listRelatedCoursesService).mockResolvedValue([{ id: 'course-2' }] as never);
});

describe('GET /public-api/v1/courses/:courseId/related', () => {
  it('returns the related courses with the default limit', async () => {
    const response = await requestAs('api', ['public_api:*'], `/courses/${COURSE_ID}/related`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [{ id: 'course-2' }] });
    expect(listRelatedCoursesService).toHaveBeenCalledWith('org-1', { courseId: COURSE_ID }, { limit: 4 });
    expect(getCourseService).not.toHaveBeenCalled();
  });

  it('passes profileId, pricing and limit', async () => {
    await requestAs(
      'api',
      ['public_api:*'],
      `/courses/${COURSE_ID}/related?profileId=${PROFILE_ID}&pricing=paid&limit=2`
    );

    expect(listRelatedCoursesService).toHaveBeenCalledWith(
      'org-1',
      { courseId: COURSE_ID },
      { profileId: PROFILE_ID, pricing: 'paid', limit: 2 }
    );
  });

  it.each([
    ['a bad course id', '/courses/not-a-uuid/related'],
    ['a limit above 20', `/courses/${COURSE_ID}/related?limit=21`],
    ['an unknown pricing', `/courses/${COURSE_ID}/related?pricing=cheap`],
    ['a bad profileId', `/courses/${COURSE_ID}/related?profileId=nope`]
  ])('returns 400 for %s', async (_label, path) => {
    const response = await requestAs('api', ['public_api:*'], path);

    expect(response.status).toBe(400);
    expect(listRelatedCoursesService).not.toHaveBeenCalled();
  });
});

describe('MCP keys on the related courses route', () => {
  it('meters list_related_courses at 0 credits with course:read', async () => {
    const response = await requestAs('mcp', ['course:read'], `/courses/${COURSE_ID}/related`);

    expect(response.status).toBe(200);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', 'list_related_courses', 0);
  });

  it('refuses a key without course:read before the handler runs', async () => {
    const response = await requestAs('mcp', ['course:write'], `/courses/${COURSE_ID}/related`);

    expect(response.status).toBe(403);
    expect(listRelatedCoursesService).not.toHaveBeenCalled();
  });
});
