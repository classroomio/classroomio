import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMembers: vi.fn()
}));

vi.mock('@cio/core/services/activity/activity', () => ({
  getActivityResults: vi.fn(),
  getActivityLearnerResult: vi.fn(),
  resetActivityLearner: vi.fn()
}));

vi.mock('@api/services/activity/plan', () => ({
  assertActivityKindAllowed: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMembers } from '@cio/db/queries/course/people';
import {
  getActivityLearnerResult,
  getActivityResults,
  resetActivityLearner
} from '@cio/core/services/activity/activity';
import { activityRouter } from '@api/routes/course/activity';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const ACTIVITY_ID = '22222222-2222-4222-8222-222222222222';
const PROFILE_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = '44444444-4444-4666-8666-444444444444';

function buildApp() {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('user', { id: USER_ID } as never);
      c.set('session', { id: 'session' } as never);
      await next();
    })
    .route('/course/:courseId/activity', activityRouter as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getCourseMembers).mockResolvedValue([
    { roleId: 3, profileId: PROFILE_ID } as never,
    { roleId: 2, profileId: USER_ID } as never
  ]);
  vi.mocked(getActivityResults).mockResolvedValue({
    summary: { enrolled: 1, started: 1, completed: 1, passed: 1, averageScore: 90 },
    learners: [],
    total: 1
  });
  vi.mocked(getActivityLearnerResult).mockResolvedValue({ profileId: PROFILE_ID, attempts: [] });
  vi.mocked(resetActivityLearner).mockResolvedValue({ attempts: 2, completions: 1 });
});

describe('activity results routes', () => {
  it('returns paged results with summary and pagination for the course team', async () => {
    const response = await buildApp().request(
      `/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results?page=2&limit=10&sort=score&direction=asc`
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      summary: { enrolled: number };
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
    expect(body.success).toBe(true);
    expect(body.summary.enrolled).toBe(1);
    expect(body.pagination).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(getActivityResults).toHaveBeenCalledWith(
      COURSE_ID,
      ACTIVITY_ID,
      [PROFILE_ID],
      expect.objectContaining({ page: 2, limit: 10, sort: 'score', direction: 'asc' })
    );
  });

  it('passes only student profile ids to the results service', async () => {
    vi.mocked(getCourseMembers).mockResolvedValue([
      { roleId: 3, profileId: PROFILE_ID } as never,
      { roleId: 3, profileId: null } as never,
      { roleId: 1, profileId: USER_ID } as never
    ]);

    await buildApp().request(`/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results`);

    expect(getActivityResults).toHaveBeenCalledWith(COURSE_ID, ACTIVITY_ID, [PROFILE_ID], expect.anything());
  });

  it('rejects results reads from students', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    const response = await buildApp().request(`/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results`);

    expect(response.status).toBe(403);
    expect(getActivityResults).not.toHaveBeenCalled();
  });

  it('returns one learner detail for the course team', async () => {
    const response = await buildApp().request(`/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results/${PROFILE_ID}`);

    expect(response.status).toBe(200);
    expect(getActivityLearnerResult).toHaveBeenCalledWith(COURSE_ID, ACTIVITY_ID, PROFILE_ID);
  });

  it('rejects learner detail reads from students', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    const response = await buildApp().request(`/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results/${PROFILE_ID}`);

    expect(response.status).toBe(403);
    expect(getActivityLearnerResult).not.toHaveBeenCalled();
  });

  it('resets one learner for the course team', async () => {
    const response = await buildApp().request(
      `/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results/${PROFILE_ID}/reset`,
      {
        method: 'POST'
      }
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as { success: boolean; data: { attempts: number; completions: number } };
    expect(body.data).toEqual({ attempts: 2, completions: 1 });
    expect(resetActivityLearner).toHaveBeenCalledWith(COURSE_ID, ACTIVITY_ID, PROFILE_ID);
  });

  it('rejects learner resets from students', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    const response = await buildApp().request(
      `/course/${COURSE_ID}/activity/${ACTIVITY_ID}/results/${PROFILE_ID}/reset`,
      {
        method: 'POST'
      }
    );

    expect(response.status).toBe(403);
    expect(resetActivityLearner).not.toHaveBeenCalled();
  });
});
