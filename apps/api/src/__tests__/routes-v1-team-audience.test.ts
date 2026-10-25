import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  complete: vi.fn(),
  release: vi.fn(),
  team: {
    listTeamService: vi.fn(),
    getTeamMemberService: vi.fn(),
    updateTeamMemberService: vi.fn()
  },
  audience: {
    listAudienceService: vi.fn(),
    createAudienceService: vi.fn(),
    getAudienceMemberService: vi.fn(),
    assignAudienceCoursesService: vi.fn(),
    removeAudienceService: vi.fn(),
    updateAudienceService: vi.fn()
  }
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
  releaseMcpAutomationUsage: mocks.release
}));

vi.mock('@api/services/v1/team', () => mocks.team);
vi.mock('@api/services/v1/audience', () => mocks.audience);

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { v1Router } from '@api/routes/v1';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const NEW_SCOPES = ['audience:read', 'audience:write', 'team:read', 'team:write'];

const teamMember = {
  id: 7,
  profileId: PROFILE_ID,
  name: 'Tim Tutor',
  email: 't@example.com',
  roleId: 2,
  verified: true
};
const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

const app = new Hono().route('/public-api/v1', v1Router);

const request = (method: string, path: string, body?: unknown) =>
  app.request(`/public-api/v1${path}`, {
    method,
    headers: { Authorization: 'Bearer cio_mcp_test', 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

const useKey = (type: 'mcp' | 'api', scopes: string[]) =>
  mocks.authenticate.mockResolvedValue({
    id: 'key-id',
    organizationId: 'org-id',
    createdByProfileId: 'actor-id',
    type,
    scopes
  });

const routes: Array<[string, string, unknown, string, number, number]> = [
  ['GET', '/team', undefined, 'list_team_members', 0, 200],
  ['GET', '/team/7', undefined, 'get_team_member', 0, 200],
  ['PUT', '/team/7', { roleId: 1 }, 'update_team_member', 1, 200],
  ['GET', '/audience', undefined, 'list_audience_members', 0, 200],
  ['POST', '/audience', { email: 'new@example.com' }, 'add_audience_member', 1, 201],
  ['POST', '/audience', { emails: ['a@example.com', 'b@example.com'] }, 'add_audience_member', 1, 201],
  [
    'POST',
    '/audience/assign-courses',
    { profileIds: [PROFILE_ID], courseIds: [COURSE_ID] },
    'assign_audience_courses',
    1,
    200
  ],
  ['GET', '/audience/7', undefined, 'get_audience_member', 0, 200],
  ['PUT', '/audience/7', { name: 'Sam Student' }, 'update_audience_member', 1, 200],
  ['DELETE', '/audience/7', undefined, 'remove_audience_member', 1, 200]
];

describe('team and audience routes through the v1 router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.complete.mockResolvedValue(undefined);
    mocks.release.mockResolvedValue(undefined);
    mocks.team.listTeamService.mockResolvedValue({ items: [teamMember], pagination });
    mocks.team.getTeamMemberService.mockResolvedValue(teamMember);
    mocks.team.updateTeamMemberService.mockResolvedValue({ ...teamMember, roleId: 1 });
    mocks.audience.listAudienceService.mockResolvedValue({ items: [], pagination, query: {} });
    mocks.audience.createAudienceService.mockResolvedValue({});
    mocks.audience.getAudienceMemberService.mockResolvedValue({});
    mocks.audience.assignAudienceCoursesService.mockResolvedValue({});
    mocks.audience.removeAudienceService.mockResolvedValue({});
    mocks.audience.updateAudienceService.mockResolvedValue({});
    useKey('mcp', NEW_SCOPES);
  });

  it.each(routes)(
    '%s %s is mounted, reachable by an MCP key, and metered as %s',
    async (method, path, body, tool, credits, status) => {
      const response = await request(method, path, body);

      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ success: true });
      expect(mocks.complete).toHaveBeenCalledWith('reservation-id', tool, credits);
    }
  );

  it.each(routes)('%s %s is closed to an MCP key without the audience and team scopes', async (method, path, body) => {
    useKey('mcp', ['cohort:read', 'cohort:write', 'course:member:read', 'course:member:write']);

    const response = await request(method, path, body);

    expect(response.status).toBe(403);
    for (const service of [...Object.values(mocks.team), ...Object.values(mocks.audience)]) {
      expect(service).not.toHaveBeenCalled();
    }
  });

  it.each(routes)(
    '%s %s is open to an API key with public_api:*',
    async (method, path, body, _tool, _credits, status) => {
      useKey('api', ['public_api:*']);

      expect((await request(method, path, body)).status).toBe(status);
    }
  );

  it('keeps read scopes from writing', async () => {
    useKey('mcp', ['audience:read', 'team:read']);

    expect((await request('GET', '/team')).status).toBe(200);
    expect((await request('GET', '/audience/7')).status).toBe(200);
    expect((await request('PUT', '/team/7', { roleId: 1 })).status).toBe(403);
    expect((await request('PUT', '/audience/7', { name: 'Sam Student' })).status).toBe(403);
    expect((await request('DELETE', '/audience/7')).status).toBe(403);
    expect(mocks.team.updateTeamMemberService).not.toHaveBeenCalled();
    expect(mocks.audience.updateAudienceService).not.toHaveBeenCalled();
  });

  it('keeps team scopes out of the audience, and the other way round', async () => {
    useKey('mcp', ['team:read', 'team:write']);
    expect((await request('GET', '/audience')).status).toBe(403);

    useKey('mcp', ['audience:read', 'audience:write']);
    expect((await request('GET', '/team')).status).toBe(403);
    expect((await request('PUT', '/team/7', { roleId: 1 })).status).toBe(403);
  });

  it('passes the key organization and creator to the team services', async () => {
    await request('GET', '/team?page=2&limit=5');
    expect(mocks.team.listTeamService).toHaveBeenCalledWith('org-id', 'actor-id', { page: 2, limit: 5 });

    await request('GET', '/team/7');
    expect(mocks.team.getTeamMemberService).toHaveBeenCalledWith('org-id', 'actor-id', { memberId: 7 });

    await request('PUT', '/team/7', { roleId: 1, name: '  Tim T  ' });
    expect(mocks.team.updateTeamMemberService).toHaveBeenCalledWith(
      'org-id',
      'actor-id',
      { memberId: 7 },
      { roleId: 1, name: 'Tim T' }
    );
  });

  it('passes the key creator to every audience service', async () => {
    await request('GET', '/audience');
    expect(mocks.audience.listAudienceService).toHaveBeenCalledWith('org-id', 'actor-id', expect.any(Object));

    await request('GET', '/audience/7');
    expect(mocks.audience.getAudienceMemberService).toHaveBeenCalledWith('org-id', 'actor-id', { memberId: 7 });

    await request('POST', '/audience/assign-courses', { profileIds: [PROFILE_ID], courseIds: [COURSE_ID] });
    expect(mocks.audience.assignAudienceCoursesService).toHaveBeenCalledWith(
      'org-id',
      'actor-id',
      expect.any(Object),
      'mcp'
    );

    await request('PUT', '/audience/7', { name: 'Sam Student' });
    expect(mocks.audience.updateAudienceService).toHaveBeenCalledWith('org-id', 7, 'actor-id', {
      name: 'Sam Student',
      sendEmail: true
    });
  });

  it('returns the list envelope with pagination', async () => {
    const response = await request('GET', '/team');

    expect(await response.json()).toEqual({ success: true, data: [teamMember], pagination });
  });

  it.each([
    ['PUT', '/team/7', {}],
    ['PUT', '/team/7', { roleId: 3 }],
    ['PUT', '/team/7', { name: 'Al' }],
    ['PUT', '/team/abc', { roleId: 1 }],
    ['GET', '/team/0', undefined],
    ['GET', '/team?limit=101', undefined],
    ['PUT', '/audience/7', {}],
    ['PUT', '/audience/7', { sendEmail: false }],
    ['PUT', '/audience/7', { name: 'Al' }],
    ['POST', '/audience', {}],
    ['POST', '/audience', { email: 'a@example.com', emails: ['b@example.com'] }]
  ])('%s %s with %j is a 400 that is not metered', async (method, path, body) => {
    const response = await request(method, path, body);

    expect(response.status).toBe(400);
    expect(mocks.team.updateTeamMemberService).not.toHaveBeenCalled();
    expect(mocks.audience.updateAudienceService).not.toHaveBeenCalled();
    expect(mocks.audience.createAudienceService).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledWith('reservation-id');
  });

  it('returns the service status and code for a refused role change', async () => {
    mocks.team.updateTeamMemberService.mockRejectedValue(
      new AppError('The organization must keep at least one admin', ErrorCodes.ORG_TEAM_LAST_ADMIN, 400)
    );

    const response = await request('PUT', '/team/7', { roleId: 2 });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.ORG_TEAM_LAST_ADMIN });
  });

  it('returns 403 when the key creator is not an org admin', async () => {
    mocks.team.listTeamService.mockRejectedValue(
      new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    expect((await request('GET', '/team')).status).toBe(403);
  });

  it('returns 404 for an unknown team member', async () => {
    mocks.team.getTeamMemberService.mockRejectedValue(new AppError('Team member not found', ErrorCodes.NOT_FOUND, 404));

    expect((await request('GET', '/team/999')).status).toBe(404);
  });

  it('documents the team routes and the audience update in the OpenAPI spec', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[]; responses: Record<string, unknown> }>>;
    };

    const team = spec.paths['/public-api/v1/team'];
    const teamMemberPath = spec.paths['/public-api/v1/team/{memberId}'];
    const audienceMemberPath = spec.paths['/public-api/v1/audience/{memberId}'];

    expect(team.get).toMatchObject({ summary: 'List team members', tags: ['Team'] });
    expect(teamMemberPath.get).toMatchObject({ summary: 'Get a team member', tags: ['Team'] });
    expect(teamMemberPath.put).toMatchObject({ summary: 'Update a team member', tags: ['Team'] });
    expect(Object.keys(teamMemberPath.put.responses).sort()).toEqual(['200', '400', '401', '403', '404', '429']);
    expect(audienceMemberPath.put.summary).toBe('Update an audience member');
    expect(Object.keys(audienceMemberPath.put.responses)).toContain('409');
  });
});
