import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn()
}));

vi.mock('@api/services/cohort/goal', () => ({
  createGoal: vi.fn(),
  listGoals: vi.fn(),
  getGoal: vi.fn(),
  updateGoal: vi.fn(),
  archiveGoal: vi.fn(),
  removeGoal: vi.fn()
}));

import { getCohortOrganizationId } from '@cio/db/queries/cohort';
import { archiveGoal, createGoal, getGoal, listGoals, removeGoal, updateGoal } from '@api/services/cohort/goal';
import {
  archivePublicApiCohortGoalService,
  createPublicApiCohortGoalService,
  deletePublicApiCohortGoalService,
  getPublicApiCohortGoalService,
  listPublicApiCohortGoalsService,
  updatePublicApiCohortGoalService
} from '@api/services/v1/cohort-goal';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const COHORT_ID = 'cohort-1';
const GOAL_ID = 'goal-1';

const cohortParams = { cohortId: COHORT_ID };
const goalParams = { cohortId: COHORT_ID, goalId: GOAL_ID };

const CREATE_GOAL_PAYLOAD = {
  title: 'Finish onboarding',
  type: 'complete_all' as const,
  courseIds: ['course-1'],
  deadlineKind: 'none' as const,
  reminderDaysBefore: [7, 1]
};

describe('v1 cohort goal service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
  });

  it('lists goals after the org guard passes', async () => {
    vi.mocked(listGoals).mockResolvedValue([]);

    await listPublicApiCohortGoalsService(ORG_ID, cohortParams);

    expect(listGoals).toHaveBeenCalledWith(COHORT_ID);
  });

  it('creates a goal using the automation actor', async () => {
    vi.mocked(createGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof createGoal>>);

    await createPublicApiCohortGoalService(ORG_ID, 'actor-1', cohortParams, CREATE_GOAL_PAYLOAD);

    expect(createGoal).toHaveBeenCalledWith(COHORT_ID, 'actor-1', CREATE_GOAL_PAYLOAD);
  });

  it('rejects creating a goal with no automation actor', async () => {
    await expect(
      createPublicApiCohortGoalService(ORG_ID, null, cohortParams, CREATE_GOAL_PAYLOAD)
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(createGoal).not.toHaveBeenCalled();
  });

  it('gets, updates, archives, and deletes a goal after the org guard passes', async () => {
    vi.mocked(getGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof getGoal>>);
    vi.mocked(updateGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof updateGoal>>);
    vi.mocked(archiveGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof archiveGoal>>);
    vi.mocked(removeGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof removeGoal>>);

    await getPublicApiCohortGoalService(ORG_ID, goalParams);
    await updatePublicApiCohortGoalService(ORG_ID, goalParams, { title: 'Renamed' });
    await archivePublicApiCohortGoalService(ORG_ID, goalParams);
    await deletePublicApiCohortGoalService(ORG_ID, goalParams);

    expect(getGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
    expect(updateGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID, { title: 'Renamed' });
    expect(archiveGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
    expect(removeGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
  });

  it('refuses to touch a goal in a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(getPublicApiCohortGoalService(ORG_ID, goalParams)).rejects.toMatchObject({ statusCode: 404 });
    expect(getGoal).not.toHaveBeenCalled();
  });
});
