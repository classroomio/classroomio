import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reserve: vi.fn(),
  complete: vi.fn(),
  release: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: mocks.reserve,
  completeMcpAutomationUsage: mocks.complete,
  releaseMcpAutomationUsage: mocks.release
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope))
}));

vi.mock('@api/services/v1/course-member', () => ({
  listCourseMembersService: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
  addCourseMemberService: vi.fn().mockResolvedValue({}),
  getCourseMemberService: vi.fn().mockResolvedValue({}),
  updateCourseMemberService: vi.fn().mockResolvedValue({}),
  deleteCourseMemberService: vi.fn().mockResolvedValue({}),
  resetCourseMemberProgressService: vi.fn().mockResolvedValue({}),
  getCourseMemberAnalyticsService: vi.fn().mockResolvedValue({})
}));

vi.mock('@api/services/v1/course-invite', () => ({
  listCourseInvitesService: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
  createCourseInviteService: vi.fn().mockResolvedValue({}),
  revokeCourseInviteService: vi.fn().mockResolvedValue({})
}));

vi.mock('@api/services/v1/shared', () => ({
  assertCourseBelongsToOrganization: vi.fn(),
  assertCourseTeamMemberOrOrgAdmin: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { publicApiScopesMiddleware } from '@api/middlewares/public-api-scopes';
import { v1McpUsageMiddleware } from '@api/middlewares/v1-mcp-usage';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const INVITE_ID = '44444444-4444-4444-8444-444444444444';
const MCP_SCOPES = ['course:read', 'course:member:read', 'course:member:write'];

function buildApp(automationKey: { type: string; scopes: string[] }) {
  const v1Router = new Hono()
    .use('*', async (c, next) => {
      c.set('automationKey', { id: 'key-id', organizationId: 'org-1', ...automationKey } as never);
      c.set('orgId', 'org-1');
      c.set('actorId', 'actor-1');
      await next();
    })
    .use('*', publicApiScopesMiddleware)
    .use('*', v1McpUsageMiddleware)
    .route(
      '/audience',
      new Hono().get('/', (c) => c.json({ success: true }))
    )
    .route('/courses', v1CoursesRouter);

  return new Hono().route('/public-api/v1', v1Router);
}

const json = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const base = `/public-api/v1/courses/${COURSE_ID}`;

describe('public API scopes for MCP keys', () => {
  beforeEach(() => {
    mocks.reserve.mockReset().mockResolvedValue('reservation-id');
    mocks.complete.mockReset().mockResolvedValue(undefined);
    mocks.release.mockReset().mockResolvedValue(undefined);
  });

  it('lets an MCP key reach course member routes with the course:member scopes', async () => {
    const app = buildApp({ type: 'mcp', scopes: MCP_SCOPES });

    expect((await app.request(`${base}/members`)).status).toBe(200);
    expect((await app.request(`${base}/members`, json('POST', { roleId: 3, email: 'a@example.com' }))).status).toBe(
      201
    );
  });

  it('blocks an MCP key from the rest of the public API', async () => {
    const app = buildApp({ type: 'mcp', scopes: MCP_SCOPES });

    expect((await app.request('/public-api/v1/audience')).status).toBe(403);
    expect((await app.request('/public-api/v1/courses')).status).toBe(403);
    expect((await app.request(`${base}/students`)).status).toBe(403);
  });

  it('needs course:member:write for writes', async () => {
    const app = buildApp({ type: 'mcp', scopes: ['course:member:read'] });

    expect((await app.request(`${base}/members`)).status).toBe(200);
    expect((await app.request(`${base}/members/${MEMBER_ID}`, { method: 'DELETE' })).status).toBe(403);
    expect((await app.request(`${base}/invites/${INVITE_ID}/revoke`, { method: 'POST' })).status).toBe(403);
  });

  it('still lets a public_api:* key reach every route', async () => {
    const app = buildApp({ type: 'api', scopes: ['public_api:*'] });

    expect((await app.request('/public-api/v1/audience')).status).toBe(200);
    expect((await app.request(`${base}/members`)).status).toBe(200);
  });
});

describe('MCP usage on course member routes', () => {
  beforeEach(() => {
    mocks.reserve.mockReset().mockResolvedValue('reservation-id');
    mocks.complete.mockReset().mockResolvedValue(undefined);
    mocks.release.mockReset().mockResolvedValue(undefined);
  });

  it('reserves each call under its category and completes it with the MCP tool name and credit cost', async () => {
    const app = buildApp({ type: 'mcp', scopes: MCP_SCOPES });

    await app.request(`${base}/members`);
    await app.request(`${base}/members`, json('POST', { roleId: 3, email: 'a@example.com' }));
    await app.request(`${base}/members/${MEMBER_ID}`);
    await app.request(`${base}/members/${MEMBER_ID}`, json('PUT', { roleId: 2 }));
    await app.request(`${base}/members/${MEMBER_ID}`, { method: 'DELETE' });
    await app.request(`${base}/members/${MEMBER_ID}/reset-progress`, { method: 'POST' });
    await app.request(`${base}/members/${MEMBER_ID}/analytics`);
    await app.request(`${base}/invites`);
    await app.request(
      `${base}/invites`,
      json('POST', { preset: 'MULTI_USE_30D', recipientEmails: ['a@example.com'], sendEmail: false })
    );
    await app.request(`${base}/invites/${INVITE_ID}/revoke`, { method: 'POST' });

    const categories = mocks.reserve.mock.calls.map(([, category]) => category);
    expect(mocks.complete.mock.calls.map(([, action, cost], index) => [action, categories[index], cost])).toEqual([
      ['list_course_members', 'read', 0],
      ['add_course_member', 'write', 1],
      ['get_course_member', 'read', 0],
      ['update_course_member', 'write', 1],
      ['delete_course_member', 'write', 1],
      ['reset_course_member_progress', 'write', 1],
      ['get_course_member_analytics', 'read', 0],
      ['list_course_invites', 'read', 0],
      ['create_course_invite', 'write', 1],
      ['revoke_course_invite', 'write', 1]
    ]);
  });

  it('returns 429 without running the handler when the MCP rate limit is hit', async () => {
    mocks.reserve.mockRejectedValueOnce(
      new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429)
    );
    const app = buildApp({ type: 'mcp', scopes: MCP_SCOPES });

    const response = await app.request(`${base}/members/${MEMBER_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(429);
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('does not meter non-MCP keys', async () => {
    const app = buildApp({ type: 'api', scopes: ['public_api:*'] });

    await app.request(`${base}/members`);

    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});
