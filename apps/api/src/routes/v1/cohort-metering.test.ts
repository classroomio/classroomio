import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  complete: vi.fn(),
  ok: () => vi.fn().mockResolvedValue({ items: [], pagination: {} })
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

vi.mock('@api/services/v1/cohort', () => ({
  listCohortsService: mocks.ok(),
  listPublicApiEnrolledCohortsService: mocks.ok(),
  createPublicApiCohortService: mocks.ok(),
  getPublicApiCohortService: mocks.ok(),
  updatePublicApiCohortService: mocks.ok(),
  deletePublicApiCohortService: mocks.ok()
}));
vi.mock('@api/services/v1/cohort-member', () => ({
  listPublicApiCohortMembersService: mocks.ok(),
  addPublicApiCohortMembersService: mocks.ok(),
  updatePublicApiCohortMemberService: mocks.ok(),
  removePublicApiCohortMemberService: mocks.ok()
}));
vi.mock('@api/services/v1/cohort-course', () => ({
  listPublicApiCohortCoursesService: mocks.ok(),
  addPublicApiCohortCourseService: mocks.ok(),
  removePublicApiCohortCourseService: mocks.ok()
}));
vi.mock('@api/services/v1/cohort-newsfeed', () => ({
  listPublicApiCohortNewsfeedService: mocks.ok(),
  createPublicApiCohortNewsfeedService: mocks.ok(),
  updatePublicApiCohortNewsfeedService: mocks.ok(),
  setPublicApiCohortNewsfeedReactionService: mocks.ok(),
  deletePublicApiCohortNewsfeedService: mocks.ok(),
  listPublicApiCohortNewsfeedCommentsService: mocks.ok(),
  createPublicApiCohortNewsfeedCommentService: mocks.ok(),
  deletePublicApiCohortNewsfeedCommentService: mocks.ok()
}));
vi.mock('@api/services/v1/cohort-goal', () => ({
  listPublicApiCohortGoalsService: mocks.ok(),
  createPublicApiCohortGoalService: mocks.ok(),
  getPublicApiCohortGoalService: mocks.ok(),
  updatePublicApiCohortGoalService: mocks.ok(),
  archivePublicApiCohortGoalService: mocks.ok(),
  deletePublicApiCohortGoalService: mocks.ok(),
  evaluatePublicApiCohortGoalService: mocks.ok(),
  evaluateAllPublicApiCohortGoalsService: mocks.ok(),
  getPublicApiOrgGoalsOverviewService: mocks.ok(),
  listPublicApiMyCohortGoalsService: mocks.ok()
}));
vi.mock('@api/services/v1/cohort-invite', () => ({
  invitePublicApiCohortStudentsService: mocks.ok(),
  assignPublicApiCohortStudentsService: mocks.ok(),
  getPublicApiCohortInviteLinkService: mocks.ok(),
  createPublicApiCohortInviteLinkService: mocks.ok(),
  setPublicApiCohortInviteLinkRevokedService: mocks.ok()
}));

import { v1Router } from './index';

const C = '11111111-1111-4111-8111-111111111111';
const X = '22222222-2222-4222-8222-222222222222';
const G = '33333333-3333-4333-8333-333333333333';

const goalBody = { type: 'complete_all', title: 'Goal', courseIds: [X] };

// [method, path, body, expected tool]
const CASES: [string, string, unknown, string][] = [
  ['GET', '/cohorts', undefined, 'list_org_cohorts'],
  ['POST', '/cohorts', { name: 'Cohort' }, 'create_cohort'],
  ['GET', '/cohorts/enrolled', undefined, 'list_my_enrolled_cohorts'],
  ['GET', '/cohorts/my/goals', undefined, 'list_my_cohort_goals'],
  ['GET', '/cohorts/goals/overview', undefined, 'get_org_goals_overview'],
  ['GET', `/cohorts/${C}`, undefined, 'get_cohort'],
  ['PUT', `/cohorts/${C}`, { name: 'Renamed' }, 'update_cohort'],
  ['DELETE', `/cohorts/${C}`, undefined, 'delete_cohort'],
  ['POST', `/cohorts/${C}/invite`, { recipientCsv: 'email\na@test.dev' }, 'invite_students_to_cohort'],
  ['POST', `/cohorts/${C}/invite/assign`, { profileIds: [X] }, 'assign_students_to_cohort'],
  ['GET', `/cohorts/${C}/invite-link`, undefined, 'get_cohort_invite_link'],
  ['POST', `/cohorts/${C}/invite-link`, undefined, 'create_cohort_invite_link'],
  ['PATCH', `/cohorts/${C}/invite-link`, { isRevoked: true }, 'set_cohort_invite_link_revoked'],
  ['GET', `/cohorts/${C}/members`, undefined, 'list_cohort_members'],
  ['POST', `/cohorts/${C}/members`, { members: [{ email: 'a@test.dev', roleId: 3 }] }, 'add_cohort_members'],
  ['PUT', `/cohorts/${C}/members/${X}`, { roleId: 2 }, 'update_cohort_member'],
  ['DELETE', `/cohorts/${C}/members/${X}`, undefined, 'delete_cohort_member'],
  ['GET', `/cohorts/${C}/courses`, undefined, 'list_cohort_courses'],
  ['POST', `/cohorts/${C}/courses`, { courseId: X }, 'add_cohort_course'],
  ['DELETE', `/cohorts/${C}/courses/${X}`, undefined, 'remove_cohort_course'],
  ['GET', `/cohorts/${C}/newsfeed`, undefined, 'list_cohort_newsfeed'],
  ['POST', `/cohorts/${C}/newsfeed`, { content: 'Hi' }, 'create_cohort_newsfeed_post'],
  ['PUT', `/cohorts/${C}/newsfeed/${X}`, { content: 'Edited' }, 'update_cohort_newsfeed_post'],
  ['DELETE', `/cohorts/${C}/newsfeed/${X}`, undefined, 'delete_cohort_newsfeed_post'],
  ['PUT', `/cohorts/${C}/newsfeed/${X}/react`, { reaction: 'clap' }, 'update_cohort_newsfeed_reaction'],
  ['GET', `/cohorts/${C}/newsfeed/${X}/comments`, undefined, 'list_cohort_newsfeed_comments'],
  ['POST', `/cohorts/${C}/newsfeed/${X}/comment`, { content: 'Nice' }, 'create_cohort_newsfeed_comment'],
  ['DELETE', `/cohorts/${C}/newsfeed/${X}/comment/42`, undefined, 'delete_cohort_newsfeed_comment'],
  ['GET', `/cohorts/${C}/goals`, undefined, 'list_cohort_goals'],
  ['POST', `/cohorts/${C}/goals`, goalBody, 'create_cohort_goal'],
  ['POST', `/cohorts/${C}/goals/evaluate-all`, undefined, 'evaluate_all_cohort_goals'],
  ['GET', `/cohorts/${C}/goals/${G}`, undefined, 'get_cohort_goal'],
  ['PUT', `/cohorts/${C}/goals/${G}`, { title: 'Renamed' }, 'update_cohort_goal'],
  ['DELETE', `/cohorts/${C}/goals/${G}`, undefined, 'delete_cohort_goal'],
  ['POST', `/cohorts/${C}/goals/${G}/archive`, undefined, 'archive_cohort_goal'],
  ['POST', `/cohorts/${C}/goals/${G}/evaluate`, undefined, 'evaluate_cohort_goal']
];

const app = new Hono().route('/public-api/v1', v1Router);

describe('default MCP key through the real v1 cohort routers (scopes and metering)', () => {
  beforeEach(() => {
    mocks.complete.mockReset().mockResolvedValue(undefined);
    mocks.authenticate.mockResolvedValue({
      id: 'key-id',
      organizationId: 'org-id',
      createdByProfileId: 'actor-id',
      type: 'mcp',
      // The MCP default: cohort scopes only, no public_api:*.
      scopes: ['cohort:read', 'cohort:write']
    });
  });

  it.each(CASES)('%s %s is metered as %s', async (method, path, body, toolName) => {
    const response = await app.request(`/public-api/v1${path}`, {
      method,
      headers: { Authorization: 'Bearer cio_mcp_test', 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    expect(response.status).toBeLessThan(300);
    expect(mocks.complete).toHaveBeenCalledWith('reservation-id', toolName, expect.any(Number));
  });

  it.each([
    ['PUT', `/courses/${C}`],
    ['DELETE', `/courses/${C}`],
    ['GET', '/audience']
  ])('keeps a default MCP key out of %s %s (403 before any handler runs)', async (method, path) => {
    const response = await app.request(`/public-api/v1${path}`, {
      method,
      headers: { Authorization: 'Bearer cio_mcp_test', 'content-type': 'application/json' },
      body: method === 'PUT' ? JSON.stringify({ title: 'Renamed' }) : undefined
    });

    expect(response.status).toBe(403);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});
