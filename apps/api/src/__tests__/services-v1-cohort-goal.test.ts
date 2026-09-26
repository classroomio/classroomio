import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/cohort/goal', () => ({
  createGoal: vi.fn(),
  listGoalsPage: vi.fn(),
  getGoal: vi.fn(),
  updateGoal: vi.fn(),
  archiveGoal: vi.fn(),
  removeGoal: vi.fn(),
  evaluateGoal: vi.fn(),
  evaluateCohortGoals: vi.fn(),
  getOrgGoalsOverview: vi.fn(),
  getMyGoals: vi.fn()
}));

vi.mock('@api/services/cohort/cohort', () => ({
  getEnrolledCohorts: vi.fn()
}));

import {
  getCohortMemberRole,
  getCohortOrganizationId,
  isCohortMember,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import {
  archiveGoal,
  createGoal,
  evaluateCohortGoals,
  evaluateGoal,
  getGoal,
  getMyGoals,
  getOrgGoalsOverview,
  listGoalsPage,
  removeGoal,
  updateGoal
} from '@api/services/cohort/goal';
import { getEnrolledCohorts } from '@api/services/cohort/cohort';
import { ROLE } from '@cio/utils/constants';
import {
  archivePublicApiCohortGoalService,
  createPublicApiCohortGoalService,
  deletePublicApiCohortGoalService,
  evaluateAllPublicApiCohortGoalsService,
  evaluatePublicApiCohortGoalService,
  getPublicApiCohortGoalService,
  getPublicApiOrgGoalsOverviewService,
  listPublicApiCohortGoalsService,
  listPublicApiMyCohortGoalsService,
  updatePublicApiCohortGoalService
} from '@api/services/v1/cohort-goal';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const COHORT_ID = 'cohort-1';
const GOAL_ID = 'goal-1';
const ACTOR_ID = 'actor-1';

const cohortParams = { cohortId: COHORT_ID };
const goalParams = { cohortId: COHORT_ID, goalId: GOAL_ID };
const FIRST_PAGE = { page: 1, limit: 20 };

const CREATE_GOAL_PAYLOAD = {
  title: 'Finish onboarding',
  type: 'complete_all' as const,
  courseIds: ['course-1'],
  deadlineKind: 'none' as const,
  reminderDaysBefore: [7, 1]
};

function mockActorAsCohortTeamMember() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
  vi.mocked(isCohortMember).mockResolvedValue(true);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

function mockActorAsOutsider() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(null);
  vi.mocked(isCohortMember).mockResolvedValue(false);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

describe('v1 cohort goal service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTeamMember();
  });

  it('lists goals a page at a time when the actor is a cohort member', async () => {
    vi.mocked(listGoalsPage).mockResolvedValue({ items: [], total: 0 });

    const result = await listPublicApiCohortGoalsService(ORG_ID, ACTOR_ID, cohortParams, { page: 1, limit: 20 });

    expect(listGoalsPage).toHaveBeenCalledWith(COHORT_ID, { page: 1, limit: 20 });
    expect(result.pagination.totalPages).toBe(0);
  });

  it('refuses to list or get goals when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(
      listPublicApiCohortGoalsService(ORG_ID, ACTOR_ID, cohortParams, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(getPublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(listGoalsPage).not.toHaveBeenCalled();
    expect(getGoal).not.toHaveBeenCalled();
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

  it('gets a goal when the actor is a cohort member', async () => {
    vi.mocked(getGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof getGoal>>);

    await getPublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams);

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

    await expect(getPublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getGoal).not.toHaveBeenCalled();
  });

  it('evaluates one goal after confirming it belongs to the cohort', async () => {
    vi.mocked(getGoal).mockResolvedValue({ id: GOAL_ID } as Awaited<ReturnType<typeof getGoal>>);
    vi.mocked(evaluateGoal).mockResolvedValue({ evaluated: 4 });

    const result = await evaluatePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams);

    expect(getGoal).toHaveBeenCalledWith(COHORT_ID, GOAL_ID);
    expect(evaluateGoal).toHaveBeenCalledWith(GOAL_ID);
    expect(result).toEqual({ evaluated: 4 });
  });

  it('refuses to evaluate goals when the actor is not a cohort team member or org admin', async () => {
    mockActorAsOutsider();

    await expect(evaluatePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams)).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(evaluateAllPublicApiCohortGoalsService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(evaluateGoal).not.toHaveBeenCalled();
    expect(evaluateCohortGoals).not.toHaveBeenCalled();
  });

  it('refuses to evaluate an archived goal, so its history is kept', async () => {
    vi.mocked(getGoal).mockResolvedValue({ id: GOAL_ID, status: 'archived' } as Awaited<ReturnType<typeof getGoal>>);

    await expect(evaluatePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams)).rejects.toMatchObject({
      statusCode: 409
    });
    expect(evaluateGoal).not.toHaveBeenCalled();
  });

  it('404s evaluating a goal that belongs to another cohort, without evaluating anything', async () => {
    vi.mocked(getGoal).mockRejectedValue(Object.assign(new Error('Goal not found'), { statusCode: 404 }));

    await expect(evaluatePublicApiCohortGoalService(ORG_ID, ACTOR_ID, goalParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(evaluateGoal).not.toHaveBeenCalled();
  });

  it('evaluates every goal in the cohort', async () => {
    vi.mocked(evaluateCohortGoals).mockResolvedValue({ evaluated: 9 });

    const result = await evaluateAllPublicApiCohortGoalsService(ORG_ID, ACTOR_ID, cohortParams);

    expect(evaluateCohortGoals).toHaveBeenCalledWith(COHORT_ID);
    expect(result).toEqual({ evaluated: 9 });
  });

  it('refuses to evaluate goals of a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(evaluateAllPublicApiCohortGoalsService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(evaluateCohortGoals).not.toHaveBeenCalled();
  });
});

describe('v1 org goals overview service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgGoalsOverview).mockResolvedValue({ goals: [] });
  });

  it.each([ROLE.ADMIN, ROLE.TUTOR])('returns the overview for an org team member (role %s)', async (roleId) => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(roleId);

    await getPublicApiOrgGoalsOverviewService(ORG_ID, ACTOR_ID, FIRST_PAGE);

    expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
    expect(getOrgGoalsOverview).toHaveBeenCalledWith(ORG_ID);
  });

  it('refuses a student or non-member of the organization', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);
    await expect(getPublicApiOrgGoalsOverviewService(ORG_ID, ACTOR_ID, FIRST_PAGE)).rejects.toMatchObject({
      statusCode: 403
    });

    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null);
    await expect(getPublicApiOrgGoalsOverviewService(ORG_ID, ACTOR_ID, FIRST_PAGE)).rejects.toMatchObject({
      statusCode: 403
    });

    expect(getOrgGoalsOverview).not.toHaveBeenCalled();
  });

  it('pages the overview goals', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrgGoalsOverview).mockResolvedValue({
      goals: [{ goalId: 'g1' }, { goalId: 'g2' }, { goalId: 'g3' }]
    } as Awaited<ReturnType<typeof getOrgGoalsOverview>>);

    const result = await getPublicApiOrgGoalsOverviewService(ORG_ID, ACTOR_ID, { page: 2, limit: 2 });

    expect(result.items.map((goal) => goal.goalId)).toEqual(['g3']);
    expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects the overview with no automation actor', async () => {
    await expect(getPublicApiOrgGoalsOverviewService(ORG_ID, null, FIRST_PAGE)).rejects.toMatchObject({
      statusCode: 401
    });
    expect(getOrganizationMemberRoleId).not.toHaveBeenCalled();
  });
});

describe('v1 my cohort goals service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only the actor's goal assignments in the key's organization", async () => {
    vi.mocked(getEnrolledCohorts).mockResolvedValue([
      { id: 'cohort-a', organizationId: ORG_ID },
      { id: 'cohort-b', organizationId: OTHER_ORG_ID }
    ] as Awaited<ReturnType<typeof getEnrolledCohorts>>);
    vi.mocked(getMyGoals).mockResolvedValue([
      { id: 'assignment-a', cohortId: 'cohort-a' },
      { id: 'assignment-b', cohortId: 'cohort-b' }
    ] as Awaited<ReturnType<typeof getMyGoals>>);

    const result = await listPublicApiMyCohortGoalsService(ORG_ID, ACTOR_ID, FIRST_PAGE);

    expect(getMyGoals).toHaveBeenCalledWith(ACTOR_ID);
    expect(result.items.map((goal) => goal.id)).toEqual(['assignment-a']);
  });

  it('rejects listing goals with no automation actor', async () => {
    await expect(listPublicApiMyCohortGoalsService(ORG_ID, null, FIRST_PAGE)).rejects.toMatchObject({
      statusCode: 401
    });
    expect(getMyGoals).not.toHaveBeenCalled();
  });
});
