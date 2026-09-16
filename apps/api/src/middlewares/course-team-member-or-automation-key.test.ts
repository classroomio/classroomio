import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { courseTeamMemberOrAutomationKeyMiddleware } from './course-team-member-or-automation-key';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  courseTeamMemberMiddleware: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: (courseId: string) => mocks.getCourseOrganizationId(courseId)
}));

vi.mock('./course-team-member', () => ({
  courseTeamMemberMiddleware: (c: Context, next: Next) => mocks.courseTeamMemberMiddleware(c, next)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_ORG_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const COURSE_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const ACTOR_ID = 'a1b2c3d4-1234-5678-9abc-def012345678';

function buildApp(automationKey: Record<string, unknown> | null, user: { id: string } | null = null) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', automationKey);
    c.set('user', user);
    await next();
  };

  return new Hono()
    .use(setContext)
    .get('/course/:courseId/members', courseTeamMemberOrAutomationKeyMiddleware(['course:member:read']), (c) =>
      c.json({ success: true, orgId: c.get('orgId'), actorId: c.get('actorId') })
    );
}

describe('courseTeamMemberOrAutomationKeyMiddleware', () => {
  beforeEach(() => {
    mocks.hasScopes.mockReset();
    mocks.getCourseOrganizationId.mockReset();
    mocks.courseTeamMemberMiddleware.mockReset();
  });

  it('allows an automation key scoped to the course organization with the required scope', async () => {
    mocks.hasScopes.mockReturnValue(true);
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);

    const app = buildApp({ organizationId: ORG_ID, createdByProfileId: ACTOR_ID, scopes: ['course:member:read'] });
    const response = await app.request(`/course/${COURSE_ID}/members`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orgId).toBe(ORG_ID);
    expect(body.actorId).toBe(ACTOR_ID);
    expect(mocks.courseTeamMemberMiddleware).not.toHaveBeenCalled();
  });

  it('rejects an automation key scoped to a different organization than the course', async () => {
    mocks.hasScopes.mockReturnValue(true);
    mocks.getCourseOrganizationId.mockResolvedValue(OTHER_ORG_ID);

    const app = buildApp({ organizationId: ORG_ID, createdByProfileId: ACTOR_ID, scopes: ['course:member:read'] });
    const response = await app.request(`/course/${COURSE_ID}/members`);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('rejects an automation key missing the required scope, without leaking the course org lookup', async () => {
    mocks.hasScopes.mockReturnValue(false);

    const app = buildApp({ organizationId: ORG_ID, createdByProfileId: ACTOR_ID, scopes: [] });
    const response = await app.request(`/course/${COURSE_ID}/members`);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.FORBIDDEN);
    expect(mocks.getCourseOrganizationId).not.toHaveBeenCalled();
  });

  it('falls back to courseTeamMemberMiddleware for session requests with no automation key', async () => {
    mocks.courseTeamMemberMiddleware.mockImplementation(async (c: Context) =>
      c.json({ success: true, fellBack: true })
    );

    const app = buildApp(null);
    const response = await app.request(`/course/${COURSE_ID}/members`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.fellBack).toBe(true);
    expect(mocks.getCourseOrganizationId).not.toHaveBeenCalled();
  });

  it('sets actorId to the session user id when courseTeamMemberMiddleware allows the request through', async () => {
    mocks.courseTeamMemberMiddleware.mockImplementation(async (c: Context, next: Next) => next());

    const app = buildApp(null, { id: ACTOR_ID });
    const response = await app.request(`/course/${COURSE_ID}/members`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.actorId).toBe(ACTOR_ID);
  });
});
