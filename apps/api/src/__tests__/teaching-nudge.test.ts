import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getGradableCoursesInOrg: vi.fn(),
  isCourseStudent: vi.fn(),
  recordLearnerNudge: vi.fn(),
  notifyLearnerNudged: vi.fn()
}));

vi.mock('@cio/db/queries/submission/grading-queue', () => ({
  getGradableCoursesInOrg: mocks.getGradableCoursesInOrg
}));
vi.mock('@cio/db/queries/teaching/nudge', () => ({
  isCourseStudent: mocks.isCourseStudent,
  recordLearnerNudge: mocks.recordLearnerNudge
}));
vi.mock('@cio/core/services/notification/staff-events', () => ({
  notifyLearnerNudged: mocks.notifyLearnerNudged
}));

import { nudgeLearner, NUDGE_INTERVAL_HOURS } from '@api/services/account/teaching-insights';

const scope = { orgId: 'org-1', profileId: 'tutor-1', isOrgAdmin: false };
const input = { courseId: '11111111-1111-4111-8111-111111111111', profileId: '22222222-2222-4222-8222-222222222222' };

describe('nudgeLearner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getGradableCoursesInOrg.mockResolvedValue([{ id: input.courseId }]);
    mocks.isCourseStudent.mockResolvedValue(true);
  });

  it('records the nudge, notifies the learner and reports when the next nudge is allowed', async () => {
    const createdAt = new Date().toISOString();
    mocks.recordLearnerNudge.mockResolvedValue({ created: true, nudge: { id: 'nudge-1', createdAt } });

    const result = await nudgeLearner(scope, input);

    const { windowStart } = mocks.recordLearnerNudge.mock.calls[0]![0];
    expect(Date.now() - windowStart.getTime()).toBeGreaterThanOrEqual(NUDGE_INTERVAL_HOURS * 60 * 60 * 1000 - 1000);
    expect(mocks.notifyLearnerNudged).toHaveBeenCalledWith({
      organizationId: 'org-1',
      courseId: input.courseId,
      learnerProfileId: input.profileId,
      actorProfileId: 'tutor-1',
      nudgeId: 'nudge-1'
    });
    expect(result.nudgedAt).toBe(createdAt);
    expect(new Date(result.nextNudgeAt!).getTime() - new Date(createdAt).getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('refuses a second nudge inside the window with NUDGE_RATE_LIMITED and sends nothing', async () => {
    mocks.recordLearnerNudge.mockResolvedValue({ created: false, lastNudgedAt: new Date().toISOString() });

    await expect(nudgeLearner(scope, input)).rejects.toMatchObject({ code: 'NUDGE_RATE_LIMITED', statusCode: 429 });
    expect(mocks.notifyLearnerNudged).not.toHaveBeenCalled();
  });

  it('refuses a course the caller does not teach', async () => {
    mocks.getGradableCoursesInOrg.mockResolvedValue([]);

    await expect(nudgeLearner(scope, input)).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.recordLearnerNudge).not.toHaveBeenCalled();
  });

  it('refuses a learner who is not a student in the course', async () => {
    mocks.isCourseStudent.mockResolvedValue(false);

    await expect(nudgeLearner(scope, input)).rejects.toMatchObject({
      code: 'LEARNER_NOT_IN_COURSE',
      statusCode: 404
    });
    expect(mocks.recordLearnerNudge).not.toHaveBeenCalled();
  });
});
