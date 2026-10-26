import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  complete: vi.fn()
}));

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

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn().mockResolvedValue('reservation-id'),
  completeMcpAutomationUsage: mocks.complete,
  releaseMcpAutomationUsage: vi.fn()
}));

vi.mock('@api/services/v1/cohorts/cohort', () => ({
  listCohortsService: vi.fn().mockResolvedValue({ items: [], pagination: {} })
}));

vi.mock('@api/services/v1/courses/certificates', () => ({
  getPublicApiCourseCertificateService: vi.fn().mockResolvedValue({})
}));

vi.mock('@api/services/v1/courses/exercises', () => ({
  listCourseExercisesService: vi.fn().mockResolvedValue({ items: [], pagination: {} })
}));

vi.mock('@api/services/v1/courses/submissions', () => ({
  listCourseSubmissionsService: vi.fn().mockResolvedValue({ items: [], pagination: {} })
}));

vi.mock('@api/services/v1/audience', () => ({
  listAudienceService: vi.fn().mockResolvedValue({ items: [], pagination: {}, query: {} })
}));

vi.mock('@api/services/v1/team', () => ({
  listTeamService: vi.fn().mockResolvedValue({ items: [], pagination: {} })
}));

vi.mock('@api/services/v1/organization/email-templates', () => ({
  listEmailTemplatesService: vi.fn().mockResolvedValue({ items: [], pagination: {} })
}));

vi.mock('@api/services/v1/courses/members', () => ({
  listCourseMembersService: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })
}));

vi.mock('@api/services/v1/courses/sections', () => ({
  listPublicApiCourseSectionsService: vi.fn().mockResolvedValue({ items: [], pagination: {} })
}));

import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

const MCP_DEFAULT_SCOPES = [
  'course_import:draft:create',
  'course_import:draft:read',
  'course_import:draft:update',
  'course_import:draft:publish',
  'course:read',
  'course:write',
  'course:tag:write',
  'course:exercise:read',
  'course:exercise:write',
  'cohort:read',
  'cohort:write',
  'course:member:read',
  'course:member:write',
  'course:certificate:read',
  'course:certificate:write',
  'course:submission:read',
  'course:submission:write',
  'audience:read',
  'audience:write',
  'team:read',
  'team:write',
  'organization:read',
  'organization:write'
];

const app = new Hono().route('/public-api/v1', v1Router);

const request = (path: string) =>
  app.request(`/public-api/v1${path}`, { headers: { Authorization: 'Bearer cio_mcp_test' } });

describe('default MCP key across the cohort, course member, certificate, exercise, submission, audience, team, and organization APIs', () => {
  beforeEach(() => {
    mocks.complete.mockReset().mockResolvedValue(undefined);
    mocks.authenticate.mockResolvedValue({
      id: 'key-id',
      organizationId: 'org-id',
      createdByProfileId: 'actor-id',
      type: 'mcp',
      scopes: MCP_DEFAULT_SCOPES
    });
  });

  it.each([
    ['/cohorts', 'list_org_cohorts'],
    [`/courses/${COURSE_ID}/members`, 'list_course_members'],
    [`/courses/${COURSE_ID}/certificate`, 'get_course_certificate'],
    [`/courses/${COURSE_ID}/sections`, 'list_course_sections'],
    [`/courses/${COURSE_ID}/exercises`, 'list_course_exercises'],
    [`/courses/${COURSE_ID}/submissions`, 'list_course_submissions'],
    ['/audience', 'list_audience_members'],
    ['/team', 'list_team_members'],
    ['/organization/email-templates', 'list_email_templates']
  ])('reaches %s and meters it as %s', async (path, toolName) => {
    const response = await request(path);

    expect(response.status).toBe(200);
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', toolName, 0);
  });

  it.each(['/courses', `/courses/${COURSE_ID}`])('is kept out of %s', async (path) => {
    const response = await request(path);

    expect(response.status).toBe(403);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});
