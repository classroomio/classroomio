import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { TCreateCohortGoal, TUpdateCohortGoal } from '@cio/utils/validation/cohort';
import type { GoalsOverviewRow, MyGoalAssignment, CohortGoal } from '../utils/types';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';

class CohortGoalApi extends BaseApiWithErrors {
  goalsByCohortId = $state<Record<string, CohortGoal[]>>({});
  myGoals = $state<MyGoalAssignment[]>([]);
  overviewRows = $state<GoalsOverviewRow[]>([]);
  loadedCohortId = $state<string | null>(null);

  goalsFor(cohortId: string): CohortGoal[] {
    return this.goalsByCohortId[cohortId] ?? [];
  }

  async listGoals(cohortId: string, force = false) {
    if (!force && this.goalsByCohortId[cohortId] && this.loadedCohortId === cohortId) return;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['goals']['$get']>({
      requestFn: () => classroomio.cohort[':cohortId'].goals.$get({ param: { cohortId } }),
      onSuccess: (res) => {
        this.goalsByCohortId = { ...this.goalsByCohortId, [cohortId]: res.data };
        this.loadedCohortId = cohortId;
      },
      logContext: 'listCohortGoals'
    });
  }

  async createGoal(cohortId: string, data: TCreateCohortGoal): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['goals']['$post']>({
      requestFn: () => classroomio.cohort[':cohortId'].goals.$post({ param: { cohortId }, json: data }),
      onSuccess: async () => {
        await this.listGoals(cohortId, true);
        snackbar.success(t.get('cohorts.goals.created') || 'Goal created');
        ok = true;
      },
      logContext: 'createCohortGoal'
    });

    return ok;
  }

  async updateGoal(cohortId: string, goalId: string, data: TUpdateCohortGoal): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['goals'][':goalId']['$put']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].goals[':goalId'].$put({
          param: { cohortId, goalId },
          json: data
        }),
      onSuccess: async () => {
        await this.listGoals(cohortId, true);
        snackbar.success(t.get('cohorts.goals.updated') || 'Goal updated');
        ok = true;
      },
      logContext: 'updateCohortGoal'
    });

    return ok;
  }

  async deleteGoal(cohortId: string, goalId: string): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['goals'][':goalId']['$delete']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].goals[':goalId'].$delete({
          param: { cohortId, goalId }
        }),
      onSuccess: async () => {
        await this.listGoals(cohortId, true);
        snackbar.success(t.get('cohorts.goals.deleted') || 'Goal deleted');
        ok = true;
      },
      logContext: 'deleteCohortGoal'
    });

    return ok;
  }

  async evaluateGoal(cohortId: string, goalId: string): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['goals'][':goalId']['evaluate']['$post']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].goals[':goalId'].evaluate.$post({
          param: { cohortId, goalId }
        }),
      onSuccess: async () => {
        await this.listGoals(cohortId, true);
        ok = true;
      },
      logContext: 'evaluateCohortGoal'
    });

    return ok;
  }

  async listMyGoals() {
    await this.execute<typeof classroomio.cohort.my.goals.$get>({
      requestFn: () => classroomio.cohort.my.goals.$get({}),
      onSuccess: (res) => {
        this.myGoals = res.data;
      },
      logContext: 'listMyGoals'
    });
  }

  async listOverview() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<typeof classroomio.cohort.goals.overview.$get>({
      requestFn: () => classroomio.cohort.goals.overview.$get({ query: { organizationId: org.id } }),
      onSuccess: (res) => {
        this.overviewRows = res.data.goals;
      },
      logContext: 'listGoalsOverview'
    });
  }
}

export const cohortGoalApi = new CohortGoalApi();
