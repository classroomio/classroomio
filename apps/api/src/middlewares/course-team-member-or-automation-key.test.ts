import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { DEFAULT_SCOPES, describeMissingScopes } from '@api/services/organization/automation-key';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { courseTeamMemberOrAutomationKeyMiddleware } from './course-team-member-or-automation-key';

const mocks = vi.hoisted(() => ({
  getCourseOrganizationId: vi.fn(),
  courseTeamMember: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: mocks.getCourseOrganizationId
}));

vi.mock('./course-team-member', () => ({
  courseTeamMemberMiddleware: mocks.courseTeamMember
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const COURSE_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function buildApp(automationKey: { scopes: string[]; organizationId: string; createdByProfileId: string } | null) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', automationKey);
    c.set('user', { id: 'user-1' });
    await next();
  };

  return new Hono()
    .use(setContext)
    .put('/course/:courseId/landing-page', courseTeamMemberOrAutomationKeyMiddleware(['course:write']), (c) =>
      c.json({ success: true, orgId: c.get('orgId') })
    );
}

const apiKey = { scopes: DEFAULT_SCOPES.api, organizationId: ORG_ID, createdByProfileId: 'profile-1' };
const mcpKey = { scopes: DEFAULT_SCOPES.mcp, organizationId: ORG_ID, createdByProfileId: 'profile-1' };

describe('courseTeamMemberOrAutomationKeyMiddleware', () => {
  beforeEach(() => {
    mocks.getCourseOrganizationId.mockReset();
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);
    mocks.courseTeamMember.mockReset();
    mocks.courseTeamMember.mockImplementation(async (_c: Context, next: Next) => next());
  });

  describe('a key that lacks the required scope (issue #1113)', () => {
    it('answers 403 and names the missing scope and the key type that has it', async () => {
      const response = await buildApp(apiKey).request(`/course/${COURSE_ID}/landing-page`, { method: 'PUT' });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.code).toBe(ErrorCodes.FORBIDDEN);
      expect(body.error).toBe(
        'Automation key is missing required scopes: course:write (included by default in mcp keys)'
      );
      expect(mocks.getCourseOrganizationId).not.toHaveBeenCalled();
    });

    it('lets a key that has the scope through', async () => {
      const response = await buildApp(mcpKey).request(`/course/${COURSE_ID}/landing-page`, { method: 'PUT' });

      expect(response.status).toBe(200);
      expect((await response.json()).orgId).toBe(ORG_ID);
    });
  });

  describe('a malformed course id (issue #1113)', () => {
    it('answers 400 for an automation key, without querying the database', async () => {
      const response = await buildApp(mcpKey).request('/course/not-a-uuid/landing-page', { method: 'PUT' });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(body.error).toBe('Invalid course ID');
      expect(mocks.getCourseOrganizationId).not.toHaveBeenCalled();
    });

    it('answers 400 for a signed-in team member too', async () => {
      const response = await buildApp(null).request('/course/not-a-uuid/landing-page', { method: 'PUT' });

      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(mocks.courseTeamMember).not.toHaveBeenCalled();
    });

    it('still reports the missing scope first when both are wrong', async () => {
      const response = await buildApp(apiKey).request('/course/not-a-uuid/landing-page', { method: 'PUT' });

      expect(response.status).toBe(403);
      expect((await response.json()).code).toBe(ErrorCodes.FORBIDDEN);
    });

    it('still answers 404 for a well-formed id that matches no course', async () => {
      mocks.getCourseOrganizationId.mockResolvedValue(null);

      const response = await buildApp(mcpKey).request(`/course/${COURSE_ID}/landing-page`, { method: 'PUT' });

      expect(response.status).toBe(404);
      expect((await response.json()).code).toBe(ErrorCodes.COURSE_NOT_FOUND);
    });
  });

  it('lets a signed-in team member through with a valid course id and records the org and actor', async () => {
    const response = await buildApp(null).request(`/course/${COURSE_ID}/landing-page`, { method: 'PUT' });

    expect(response.status).toBe(200);
    expect((await response.json()).orgId).toBe(ORG_ID);
    expect(mocks.courseTeamMember).toHaveBeenCalledTimes(1);
    expect(mocks.getCourseOrganizationId).toHaveBeenCalledWith(COURSE_ID);
  });

  it('still answers 500 when the lookup itself fails', async () => {
    mocks.getCourseOrganizationId.mockRejectedValue(new Error('db down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await buildApp(mcpKey).request(`/course/${COURSE_ID}/landing-page`, { method: 'PUT' });

    expect(response.status).toBe(500);
    expect((await response.json()).code).toBe('COURSE_TEAM_MEMBER_CHECK_FAILED');
    consoleError.mockRestore();
  });
});

describe('describeMissingScopes', () => {
  it('lists every missing scope', () => {
    expect(describeMissingScopes(['course:read'], ['course:read', 'course:write', 'cohort:write'])).toBe(
      'Automation key is missing required scopes: course:write, cohort:write (included by default in mcp keys)'
    );
  });

  it('leaves out the key-type hint when no key type has the scope by default', () => {
    expect(describeMissingScopes([], ['not:a-real-scope' as never])).toBe(
      'Automation key is missing required scopes: not:a-real-scope'
    );
  });

  it('keeps the plain message when nothing is missing', () => {
    expect(describeMissingScopes(['course:write'], ['course:write'])).toBe('Automation key is missing required scopes');
  });
});
