import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/cohort', () => ({
  listCohortsService: vi.fn(),
  listPublicApiEnrolledCohortsService: vi.fn(),
  createPublicApiCohortService: vi.fn(),
  getPublicApiCohortService: vi.fn(),
  updatePublicApiCohortService: vi.fn(),
  deletePublicApiCohortService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-goal', () => ({
  listPublicApiCohortGoalsService: vi.fn(),
  createPublicApiCohortGoalService: vi.fn(),
  getPublicApiCohortGoalService: vi.fn(),
  updatePublicApiCohortGoalService: vi.fn(),
  archivePublicApiCohortGoalService: vi.fn(),
  deletePublicApiCohortGoalService: vi.fn(),
  evaluatePublicApiCohortGoalService: vi.fn(),
  evaluateAllPublicApiCohortGoalsService: vi.fn(),
  getPublicApiOrgGoalsOverviewService: vi.fn(),
  listPublicApiMyCohortGoalsService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-member', () => ({
  listPublicApiCohortMembersService: vi.fn(),
  addPublicApiCohortMembersService: vi.fn(),
  updatePublicApiCohortMemberService: vi.fn(),
  removePublicApiCohortMemberService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-invite', () => ({
  invitePublicApiCohortStudentsService: vi.fn(),
  assignPublicApiCohortStudentsService: vi.fn(),
  getPublicApiCohortInviteLinkService: vi.fn(),
  createPublicApiCohortInviteLinkService: vi.fn(),
  setPublicApiCohortInviteLinkRevokedService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { getPublicApiCohortService, listPublicApiEnrolledCohortsService } from '@api/services/v1/cohort';
import {
  evaluateAllPublicApiCohortGoalsService,
  evaluatePublicApiCohortGoalService,
  getPublicApiCohortGoalService,
  getPublicApiOrgGoalsOverviewService,
  listPublicApiMyCohortGoalsService
} from '@api/services/v1/cohort-goal';
import {
  assignPublicApiCohortStudentsService,
  createPublicApiCohortInviteLinkService,
  getPublicApiCohortInviteLinkService,
  invitePublicApiCohortStudentsService,
  setPublicApiCohortInviteLinkRevokedService
} from '@api/services/v1/cohort-invite';
import { addPublicApiCohortMembersService } from '@api/services/v1/cohort-member';
import { v1CohortsRouter } from '@api/routes/v1/cohorts';

const COHORT_ID = '11111111-1111-4111-8111-111111111111';
const GOAL_ID = '22222222-2222-4222-8222-222222222222';
const PROFILE_ID = '33333333-3333-4333-8333-333333333333';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CohortsRouter);

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1CohortsRouter invite, learner, and goal-evaluation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes /enrolled, /my/goals, and /goals/overview to their own handlers, not /:cohortId', async () => {
    const page = { items: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } };
    vi.mocked(listPublicApiEnrolledCohortsService).mockResolvedValue(page);
    vi.mocked(listPublicApiMyCohortGoalsService).mockResolvedValue(page);
    vi.mocked(getPublicApiOrgGoalsOverviewService).mockResolvedValue(page);

    const enrolled = await app.request('/enrolled?page=2&limit=5');
    const myGoals = await app.request('/my/goals');
    const overview = await app.request('/goals/overview');

    expect([enrolled.status, myGoals.status, overview.status]).toEqual([200, 200, 200]);
    expect(await enrolled.json()).toEqual({ success: true, data: [], pagination: page.pagination });
    expect(listPublicApiEnrolledCohortsService).toHaveBeenCalledWith('org-1', 'actor-1', { page: 2, limit: 5 });
    expect(listPublicApiMyCohortGoalsService).toHaveBeenCalledWith('org-1', 'actor-1', { page: 1, limit: 20 });
    expect(getPublicApiOrgGoalsOverviewService).toHaveBeenCalledWith('org-1', 'actor-1', { page: 1, limit: 20 });
    expect(getPublicApiCohortService).not.toHaveBeenCalled();
  });

  it('rejects a limit above 100 on the learner and overview lists', async () => {
    const response = await app.request('/goals/overview?limit=500');

    expect(response.status).toBe(400);
    expect(getPublicApiOrgGoalsOverviewService).not.toHaveBeenCalled();
  });

  it('routes evaluate-all to its handler rather than treating it as a goalId', async () => {
    vi.mocked(evaluateAllPublicApiCohortGoalsService).mockResolvedValue({ evaluated: 3 });
    vi.mocked(evaluatePublicApiCohortGoalService).mockResolvedValue({ evaluated: 1 });

    const all = await app.request(`/${COHORT_ID}/goals/evaluate-all`, { method: 'POST' });
    const one = await app.request(`/${COHORT_ID}/goals/${GOAL_ID}/evaluate`, { method: 'POST' });

    expect(all.status).toBe(200);
    expect(await all.json()).toEqual({ success: true, data: { evaluated: 3 } });
    expect(evaluateAllPublicApiCohortGoalsService).toHaveBeenCalledWith('org-1', 'actor-1', { cohortId: COHORT_ID });
    expect(one.status).toBe(200);
    expect(evaluatePublicApiCohortGoalService).toHaveBeenCalledWith('org-1', 'actor-1', {
      cohortId: COHORT_ID,
      goalId: GOAL_ID
    });
    expect(getPublicApiCohortGoalService).not.toHaveBeenCalled();
  });

  it('invites by CSV with sendEmail defaulting to true', async () => {
    vi.mocked(invitePublicApiCohortStudentsService).mockResolvedValue({ imported: 1 } as Awaited<
      ReturnType<typeof invitePublicApiCohortStudentsService>
    >);

    const response = await app.request(
      `/${COHORT_ID}/invite`,
      jsonRequest('POST', { recipientCsv: 'email\nnew@test.dev' })
    );

    expect(response.status).toBe(201);
    expect(invitePublicApiCohortStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { recipientCsv: 'email\nnew@test.dev', sendEmail: true }
    );
  });

  it('rejects an invite with an empty CSV and an assign with a non-uuid profileId', async () => {
    const invite = await app.request(`/${COHORT_ID}/invite`, jsonRequest('POST', { recipientCsv: '' }));
    const assign = await app.request(`/${COHORT_ID}/invite/assign`, jsonRequest('POST', { profileIds: ['nope'] }));

    expect(invite.status).toBe(400);
    expect(assign.status).toBe(400);
    expect(invitePublicApiCohortStudentsService).not.toHaveBeenCalled();
    expect(assignPublicApiCohortStudentsService).not.toHaveBeenCalled();
  });

  it('assigns existing students', async () => {
    vi.mocked(assignPublicApiCohortStudentsService).mockResolvedValue({
      assigned: 1,
      alreadyEnrolled: 0,
      emailsSent: 0
    });

    const response = await app.request(
      `/${COHORT_ID}/invite/assign`,
      jsonRequest('POST', { profileIds: [PROFILE_ID], sendEmail: false })
    );

    expect(response.status).toBe(200);
    expect(assignPublicApiCohortStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { profileIds: [PROFILE_ID], sendEmail: false }
    );
  });

  it('rejects a member-add request that repeats the same email or profileId', async () => {
    const repeatedEmail = await app.request(
      `/${COHORT_ID}/members`,
      jsonRequest('POST', {
        members: [
          { email: 'ada@test.dev', roleId: 3 },
          { email: 'ADA@test.dev', roleId: 3 }
        ]
      })
    );
    const repeatedProfile = await app.request(
      `/${COHORT_ID}/members`,
      jsonRequest('POST', {
        members: [
          { profileId: PROFILE_ID, roleId: 3 },
          { profileId: PROFILE_ID, roleId: 2 }
        ]
      })
    );

    expect(repeatedEmail.status).toBe(400);
    expect(repeatedProfile.status).toBe(400);
    expect(addPublicApiCohortMembersService).not.toHaveBeenCalled();
  });

  it('gets (null when missing), creates, and revokes the invite link', async () => {
    vi.mocked(getPublicApiCohortInviteLinkService).mockResolvedValue(null);
    vi.mocked(createPublicApiCohortInviteLinkService).mockResolvedValue({ id: 'link' } as Awaited<
      ReturnType<typeof createPublicApiCohortInviteLinkService>
    >);
    vi.mocked(setPublicApiCohortInviteLinkRevokedService).mockResolvedValue({ id: 'link' } as Awaited<
      ReturnType<typeof setPublicApiCohortInviteLinkRevokedService>
    >);

    const fetched = await app.request(`/${COHORT_ID}/invite-link`);
    const created = await app.request(`/${COHORT_ID}/invite-link`, { method: 'POST' });
    const revoked = await app.request(`/${COHORT_ID}/invite-link`, jsonRequest('PATCH', { isRevoked: true }));
    const invalid = await app.request(`/${COHORT_ID}/invite-link`, jsonRequest('PATCH', {}));

    expect(await fetched.json()).toEqual({ success: true, data: null });
    expect(created.status).toBe(200);
    expect(revoked.status).toBe(200);
    expect(setPublicApiCohortInviteLinkRevokedService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { isRevoked: true }
    );
    expect(invalid.status).toBe(400);
  });
});
