import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  createCohortGoal: vi.fn(),
  deleteCohortGoal: vi.fn(),
  getAssignmentsForProfile: vi.fn(),
  getCoursesByCohort: vi.fn(),
  getLatestCompletionRecordsForProfilesAndCourses: vi.fn(),
  getMaxScoresForProfilesAndCourses: vi.fn(),
  getNonComplianceCourseCompletions: vi.fn(),
  getCohortById: vi.fn(),
  getCohortGoalAssignments: vi.fn(),
  getCohortGoalById: vi.fn(),
  getCohortGoals: vi.fn(),
  getCohortGoalsByOrg: vi.fn(),
  getCohortMembers: vi.fn(),
  listAllActiveCohortGoals: vi.fn(),
  listAssignmentsForReminderScan: vi.fn(),
  updateCohortGoal: vi.fn(),
  upsertCohortGoalAssignments: vi.fn()
}));

import {
  createCohortGoal,
  getCohortById,
  getCohortGoalById,
  getCohortMembers,
  getCoursesByCohort,
  updateCohortGoal as updateCohortGoalQuery
} from '@cio/db/queries/cohort';
import { createGoal, updateGoal } from '@api/services/cohort/goal';

const COHORT_ID = 'cohort-1';
const GOAL_ID = 'goal-1';
const PROFILE_ID = 'profile-1';
const COHORT_COURSE_ID = '33333333-3333-4333-8333-333333333333';
const ANOTHER_COHORT_COURSE_ID = '44444444-4444-4444-8444-444444444444';
const OUTSIDE_COURSE_ID = 'course-not-in-cohort';

const EXISTING_GOAL = {
  id: GOAL_ID,
  cohortId: COHORT_ID,
  title: 'Existing goal',
  description: null,
  type: 'complete_all' as const,
  courseIds: [COHORT_COURSE_ID],
  requiredCount: null,
  scoreThreshold: null,
  teamPassRateThreshold: null,
  reminderDaysBefore: [7, 1],
  deadlineKind: 'none' as const,
  deadlineDate: null,
  relativeDays: null,
  recurringMonths: null,
  status: 'active' as const,
  createdByProfileId: PROFILE_ID,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('createGoal / updateGoal course scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof getCohortById>>);
    vi.mocked(getCohortMembers).mockResolvedValue([]);
    vi.mocked(getCoursesByCohort).mockResolvedValue([
      { courseId: COHORT_COURSE_ID } as Awaited<ReturnType<typeof getCoursesByCohort>>[number]
    ]);
  });

  it('creates a goal whose courseIds are all linked to the cohort', async () => {
    vi.mocked(createCohortGoal).mockResolvedValue({ ...EXISTING_GOAL } as Awaited<ReturnType<typeof createCohortGoal>>);

    await createGoal(COHORT_ID, PROFILE_ID, {
      title: 'New goal',
      type: 'complete_all',
      courseIds: [COHORT_COURSE_ID],
      deadlineKind: 'none',
      reminderDaysBefore: [7, 1]
    });

    expect(createCohortGoal).toHaveBeenCalled();
  });

  it('rejects creating a goal that references a course not linked to the cohort', async () => {
    await expect(
      createGoal(COHORT_ID, PROFILE_ID, {
        title: 'New goal',
        type: 'complete_all',
        courseIds: [OUTSIDE_COURSE_ID],
        deadlineKind: 'none',
        reminderDaysBefore: [7, 1]
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(createCohortGoal).not.toHaveBeenCalled();
  });

  it('rejects updating a goal to reference a course not linked to the cohort', async () => {
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL });

    await expect(updateGoal(COHORT_ID, GOAL_ID, { courseIds: [OUTSIDE_COURSE_ID] })).rejects.toMatchObject({
      statusCode: 400
    });
    expect(updateCohortGoalQuery).not.toHaveBeenCalled();
  });
});

describe('updateGoal partial-update field preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL });
    vi.mocked(getCohortMembers).mockResolvedValue([]);
  });

  it('only patches the fields actually sent, leaving everything else untouched in the DB call', async () => {
    vi.mocked(updateCohortGoalQuery).mockResolvedValue({ ...EXISTING_GOAL, title: 'Renamed' });

    await updateGoal(COHORT_ID, GOAL_ID, { title: 'Renamed' });

    expect(updateCohortGoalQuery).toHaveBeenCalledWith(COHORT_ID, GOAL_ID, { title: 'Renamed' });
  });

  it('does not send requiredCount/scoreThreshold/deadline fields as null when they were never mentioned', async () => {
    vi.mocked(updateCohortGoalQuery).mockResolvedValue({ ...EXISTING_GOAL, title: 'Renamed' });

    await updateGoal(COHORT_ID, GOAL_ID, { title: 'Renamed' });

    const patch = vi.mocked(updateCohortGoalQuery).mock.calls[0]?.[2] ?? {};
    expect(patch).not.toHaveProperty('requiredCount');
    expect(patch).not.toHaveProperty('scoreThreshold');
    expect(patch).not.toHaveProperty('teamPassRateThreshold');
    expect(patch).not.toHaveProperty('deadlineDate');
    expect(patch).not.toHaveProperty('relativeDays');
    expect(patch).not.toHaveProperty('recurringMonths');
  });

  it('rejects a patch that would leave the merged goal invalid for its type (n_of_m with no requiredCount)', async () => {
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL, type: 'complete_all' });

    await expect(updateGoal(COHORT_ID, GOAL_ID, { type: 'n_of_m' })).rejects.toMatchObject({ statusCode: 400 });
    expect(updateCohortGoalQuery).not.toHaveBeenCalled();
  });

  it('allows a patch that keeps the merged goal valid using the existing required fields', async () => {
    vi.mocked(getCohortGoalById).mockResolvedValue({
      ...EXISTING_GOAL,
      type: 'n_of_m',
      requiredCount: 2,
      courseIds: [COHORT_COURSE_ID, ANOTHER_COHORT_COURSE_ID]
    });
    vi.mocked(updateCohortGoalQuery).mockResolvedValue({ ...EXISTING_GOAL, title: 'Renamed' });

    await updateGoal(COHORT_ID, GOAL_ID, { title: 'Renamed' });

    expect(updateCohortGoalQuery).toHaveBeenCalledWith(COHORT_ID, GOAL_ID, { title: 'Renamed' });
  });

  it('explicitly clearing description to null is preserved as null, not dropped', async () => {
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL, description: 'old description' });
    vi.mocked(updateCohortGoalQuery).mockResolvedValue({ ...EXISTING_GOAL, description: null });

    await updateGoal(COHORT_ID, GOAL_ID, { description: null });

    expect(updateCohortGoalQuery).toHaveBeenCalledWith(COHORT_ID, GOAL_ID, { description: null });
  });
});
