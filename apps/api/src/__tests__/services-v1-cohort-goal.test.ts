import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isOrgAdminByCohortId: vi.fn()
}));

vi.mock('@api/services/cohort/goal', () => ({
  createGoal: vi.fn(),
  listGoals: vi.fn(),
  getGoal: vi.fn(),
  updateGoal: vi.fn(),
  archiveGoal: vi.fn(),
  removeGoal: vi.fn()
}));

import { getCohortMemberRole, getCohortOrganizationId, isOrgAdminByCohortId } from '@cio/db/queries/cohort';
import { archiveGoal, createGoal, getGoal, listGoals, removeGoal, updateGoal } from '@api/services/cohort/goal';
import { ROLE } from '@cio/utils/constants';
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
const ACTOR_ID = 'actor-1';

const cohortParams = { cohortId: COHORT_ID };
const goalParams = { cohortId: COHORT_ID, goalId: GOAL_ID };

const CREATE_GOAL_PAYLOAD = {
  title: 'Finish onboarding',
  type: 'complete_all' as const,
  courseIds: ['course-1'],
  deadlineKind: 'none' as const,
  reminderDaysBefore: [7, 1]
};

/** Default happy path: actor is a cohort tutor, so the team-or-admin gate passes. */
function mockActorAsCohortTeamMember() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

describe('v1 cohort goal service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTeamMember();
  });

  it('lists goals after the org guard passes, with no team-membership requirement', async () => {
    vi.mocked(listGoals).mockResolvedValue([]);

    await listPublicApiCohortGoalsService(ORG_ID, cohortParams);

    expect(listGoals).toHaveBeenCalledWith(COHORT_ID);
  });

  it('creates a goal using the automation actor once they are a cohort team member', async () => {
    vi.mocked(createGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof createGoal>>);

    await createPublicApiCohortGoalService(ORG_ID, ACTOR_ID, cohortParams, CREATE_GOAL_PAYLOAD);

    expect(createGoal).toHaveBeenCalledWith(COHORT_ID, ACTOR_ID, CREATE_GOAL_PAYLOAD);
  });

  it('refuses to create a goal when the actor is not a cohort team member', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(
      createPublicApiCohortGoalService(ORG_ID, ACTOR_ID, cohortParams, CREATE_GOAL_PAYLOAD)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(createGoal).not.toHaveBeenCalled();
  });

  it('rejects creating a goal with no automation actor', async () => {
    await expect(
      createPublicApiCohortGoalService(ORG_ID, null, cohortParams, CREATE_GOAL_PAYLOAD)
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(createGoal).not.toHaveBeenCalled();
  });

  it('gets a goal with no team-membership requirement (read-only)', async () => {
    vi.mocked(getGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof getGoal>>);

    await getPublicApiCohortGoalService(ORG_ID, goalParams);

    expect(getGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
  });

  it('updates, archives, and deletes a goal once the actor is a cohort team member', async () => {
    vi.mocked(updateGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof updateGoal>>);
    vi.mocked(archiveGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof archiveGoal>>);
    vi.mocked(removeGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof removeGoal>>);

    await updatePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams, { title: 'Renamed' });
    await archivePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams);
    await deletePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams);

    expect(updateGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID, { title: 'Renamed' });
    expect(archiveGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
    expect(removeGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
  });

  it('refuses to update/archive/delete a goal when the actor is not a cohort team member or org admin', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(
      updatePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams, { title: 'Renamed' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateGoal).not.toHaveBeenCalled();
  });

  it('refuses to touch a goal in a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(getPublicApiCohortGoalService(ORG_ID, goalParams)).rejects.toMatchObject({ statusCode: 404 });
    expect(getGoal).not.toHaveBeenCalled();
  });
});
