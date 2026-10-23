import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  countCohortGoals: vi.fn(),
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
  listOverdueAssignmentReminderContexts: vi.fn(),
  updateCohortGoal: vi.fn(),
  upsertCohortGoalAssignments: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

import {
  createCohortGoal,
  getCohortById,
  getCohortGoalById,
  getCohortMembers,
  getCoursesByCohort,
  listAssignmentsForReminderScan,
  listOverdueAssignmentReminderContexts,
  updateCohortGoal as updateCohortGoalQuery,
  upsertCohortGoalAssignments,
  type CohortGoalReminderContext
} from '@cio/db/queries/cohort';
import {
  archiveGoal,
  createGoal,
  evaluateGoal,
  runCohortGoalReminderScan,
  sendOverdueCohortGoalRemindersNow,
  updateGoal
} from '@api/services/cohort/goal';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { buildEmailFromName } from '@cio/email';

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

describe('evaluateGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips an archived goal without touching its assignments', async () => {
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL, status: 'archived' });

    const result = await evaluateGoal(GOAL_ID);

    expect(result).toEqual({ evaluated: 0 });
    expect(getCohortMembers).not.toHaveBeenCalled();
    expect(upsertCohortGoalAssignments).not.toHaveBeenCalled();
  });
});

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

  it('archives a goal that is already stored in an invalid state', async () => {
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL, type: 'score', scoreThreshold: null });
    vi.mocked(updateCohortGoalQuery).mockResolvedValue({ ...EXISTING_GOAL, status: 'archived' });

    await archiveGoal(COHORT_ID, GOAL_ID);

    expect(updateCohortGoalQuery).toHaveBeenCalledWith(COHORT_ID, GOAL_ID, { status: 'archived' });
  });

  it('allows resending a course that was later unlinked, but rejects adding a new unlinked course', async () => {
    const unlinkedCourseId = '55555555-5555-4555-8555-555555555555';
    vi.mocked(getCohortGoalById).mockResolvedValue({ ...EXISTING_GOAL, courseIds: [unlinkedCourseId] });
    vi.mocked(getCoursesByCohort).mockResolvedValue([]);
    vi.mocked(updateCohortGoalQuery).mockResolvedValue({ ...EXISTING_GOAL, title: 'Renamed' });

    await updateGoal(COHORT_ID, GOAL_ID, { title: 'Renamed', courseIds: [unlinkedCourseId] });
    await expect(
      updateGoal(COHORT_ID, GOAL_ID, { courseIds: [unlinkedCourseId, ANOTHER_COHORT_COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(updateCohortGoalQuery).toHaveBeenCalledTimes(1);
  });

  it('accepts a stored deadline in the format Postgres returns when updating or archiving', async () => {
    const goalWithStoredDeadline = {
      ...EXISTING_GOAL,
      deadlineKind: 'absolute' as const,
      deadlineDate: '2026-09-23 10:00:00.123456+00'
    };
    vi.mocked(getCohortGoalById).mockResolvedValue(goalWithStoredDeadline);
    vi.mocked(updateCohortGoalQuery).mockResolvedValue(goalWithStoredDeadline);

    await updateGoal(COHORT_ID, GOAL_ID, { title: 'Renamed' });
    await archiveGoal(COHORT_ID, GOAL_ID);

    expect(updateCohortGoalQuery).toHaveBeenNthCalledWith(1, COHORT_ID, GOAL_ID, { title: 'Renamed' });
    expect(updateCohortGoalQuery).toHaveBeenNthCalledWith(2, COHORT_ID, GOAL_ID, { status: 'archived' });
  });
});

const ASSIGNMENT_ID = 'assignment-1';
const COURSE_ID = '55555555-5555-4555-8555-555555555555';
const NOW = new Date('2026-01-10T12:00:00.000Z');

function reminderContext(overrides: Partial<CohortGoalReminderContext> = {}): CohortGoalReminderContext {
  return {
    assignment: {
      id: ASSIGNMENT_ID,
      goalId: GOAL_ID,
      cohortMemberId: 'member-1',
      profileId: PROFILE_ID,
      status: 'in_progress',
      completedCount: 1,
      requiredCount: 3,
      score: null,
      teamPassRate: null,
      dueDate: '2026-01-05T00:00:00.000Z',
      completedAt: null,
      lastEvaluatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    } as CohortGoalReminderContext['assignment'],
    goal: EXISTING_GOAL,
    profileId: PROFILE_ID,
    email: 'learner@example.com',
    cohortId: COHORT_ID,
    cohortName: 'Cohort',
    organizationId: '66666666-6666-4666-8666-666666666666',
    organizationName: 'Acme',
    organizationSiteName: 'acme',
    organizationCustomDomain: null,
    organizationIsCustomDomainVerified: null,
    organizationAvatarUrl: null,
    organizationTheme: null,
    ...overrides
  };
}

describe('cohort goal reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.mocked(enqueueTransactionalEmail).mockResolvedValue({ jobIds: ['job-1'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends every overdue reminder for the course and counts the skipped learners', async () => {
    vi.mocked(listOverdueAssignmentReminderContexts).mockResolvedValue([
      reminderContext(),
      reminderContext({ assignment: { ...reminderContext().assignment, id: 'assignment-2' }, email: null })
    ]);

    await expect(sendOverdueCohortGoalRemindersNow(COHORT_ID, { courseId: COURSE_ID })).resolves.toEqual({
      enqueued: 1,
      skipped: 1
    });

    expect(listOverdueAssignmentReminderContexts).toHaveBeenCalledWith(COHORT_ID, { courseId: COURSE_ID });
    expect(enqueueTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0]?.[1]).toMatchObject({
      idempotencyKey: `cohort-goal-reminder-manual:${ASSIGNMENT_ID}:2026-01-10`
    });
  });

  it('passes the learner filter through so only that learner is reminded', async () => {
    vi.mocked(listOverdueAssignmentReminderContexts).mockResolvedValue([reminderContext()]);

    await expect(sendOverdueCohortGoalRemindersNow(COHORT_ID, { profileId: PROFILE_ID })).resolves.toEqual({
      enqueued: 1,
      skipped: 0
    });

    expect(listOverdueAssignmentReminderContexts).toHaveBeenCalledWith(COHORT_ID, {
      courseId: undefined,
      profileId: PROFILE_ID
    });
    expect(enqueueTransactionalEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps the scan idempotency key distinct from manual sends', async () => {
    vi.mocked(listAssignmentsForReminderScan).mockResolvedValue([
      reminderContext({ assignment: { ...reminderContext().assignment, dueDate: '2026-01-11T00:00:00.000Z' } })
    ]);

    await expect(runCohortGoalReminderScan()).resolves.toEqual({ scanned: 1, remindersEnqueued: 1 });

    expect(vi.mocked(enqueueTransactionalEmail).mock.calls[0]?.[1]).toMatchObject({
      idempotencyKey: `cohort-goal-reminder:${ASSIGNMENT_ID}:1:2026-01-10`,
      from: buildEmailFromName('Acme (via ClassroomIO.com)')
    });
  });
});
