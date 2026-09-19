import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { courseMemberOrAutomationKeyMiddleware } from './course-member-or-automation-key';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  courseMemberMiddleware: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: (courseId: string) => mocks.getCourseOrganizationId(courseId)
}));

vi.mock('./course-member', () => ({
  courseMemberMiddleware: (c: Context, next: Next) => mocks.courseMemberMiddleware(c, next)
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
    .get('/course/:courseId/lesson/:lessonId/video', courseMemberOrAutomationKeyMiddleware(['course:write']), (c) =>
      c.json({ success: true, orgId: c.get('orgId'), actorId: c.get('actorId') })
    );
}

describe('courseMemberOrAutomationKeyMiddleware', () => {
  beforeEach(() => {
    mocks.hasScopes.mockReset();
    mocks.getCourseOrganizationId.mockReset();
    mocks.courseMemberMiddleware.mockReset();
  });

  it('allows an automation key scoped to the course organization with the required scope', async () => {
    mocks.hasScopes.mockReturnValue(true);
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);

    const app = buildApp({ organizationId: ORG_ID, createdByProfileId: ACTOR_ID, scopes: ['course:write'] });
    const response = await app.request(`/course/${COURSE_ID}/lesson/lesson-1/video`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orgId).toBe(ORG_ID);
    expect(body.actorId).toBe(ACTOR_ID);
    expect(mocks.courseMemberMiddleware).not.toHaveBeenCalled();
  });

  it('rejects an automation key scoped to a different organization than the course', async () => {
    mocks.hasScopes.mockReturnValue(true);
    mocks.getCourseOrganizationId.mockResolvedValue(OTHER_ORG_ID);

    const app = buildApp({ organizationId: ORG_ID, createdByProfileId: ACTOR_ID, scopes: ['course:write'] });
    const response = await app.request(`/course/${COURSE_ID}/lesson/lesson-1/video`);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('sets orgId and actorId for session requests when courseMemberMiddleware allows the request through', async () => {
    mocks.courseMemberMiddleware.mockImplementation(async (c: Context, next: Next) => next());
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);

    const app = buildApp(null, { id: ACTOR_ID });
    const response = await app.request(`/course/${COURSE_ID}/lesson/lesson-1/video`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orgId).toBe(ORG_ID);
    expect(body.actorId).toBe(ACTOR_ID);
    expect(mocks.getCourseOrganizationId).toHaveBeenCalledWith(COURSE_ID);
  });

  it('falls back to courseMemberMiddleware for session requests with no automation key, and its rejection is untouched', async () => {
    mocks.courseMemberMiddleware.mockImplementation(async (c: Context) =>
      c.json({ success: false, error: 'Unauthorized', code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED }, 403)
    );

    const app = buildApp(null, { id: ACTOR_ID });
    const response = await app.request(`/course/${COURSE_ID}/lesson/lesson-1/video`);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.ORG_TEAM_NOT_AUTHORIZED);
  });
});
