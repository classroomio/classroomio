import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { TCreateProgramGoal, TUpdateProgramGoal } from '@cio/utils/validation/program';
import type { GoalsOverviewRow, MyGoalAssignment, ProgramGoal } from '../utils/types';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';

class ProgramGoalApi extends BaseApiWithErrors {
  goalsByProgramId = $state<Record<string, ProgramGoal[]>>({});
  myGoals = $state<MyGoalAssignment[]>([]);
  overviewRows = $state<GoalsOverviewRow[]>([]);
  loadedProgramId = $state<string | null>(null);

  goalsFor(programId: string): ProgramGoal[] {
    return this.goalsByProgramId[programId] ?? [];
  }

  async listGoals(programId: string, force = false) {
    if (!force && this.goalsByProgramId[programId] && this.loadedProgramId === programId) return;

    await this.execute<(typeof classroomio.program)[':programId']['goals']['$get']>({
      requestFn: () => classroomio.program[':programId'].goals.$get({ param: { programId } }),
      onSuccess: (res) => {
        this.goalsByProgramId = { ...this.goalsByProgramId, [programId]: res.data };
        this.loadedProgramId = programId;
      },
      logContext: 'listProgramGoals'
    });
  }

  async createGoal(programId: string, data: TCreateProgramGoal): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.program)[':programId']['goals']['$post']>({
      requestFn: () => classroomio.program[':programId'].goals.$post({ param: { programId }, json: data }),
      onSuccess: async () => {
        await this.listGoals(programId, true);
        snackbar.success(t.get('programs.goals.created') || 'Goal created');
        ok = true;
      },
      logContext: 'createProgramGoal'
    });

    return ok;
  }

  async updateGoal(programId: string, goalId: string, data: TUpdateProgramGoal): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.program)[':programId']['goals'][':goalId']['$put']>({
      requestFn: () =>
        classroomio.program[':programId'].goals[':goalId'].$put({
          param: { programId, goalId },
          json: data
        }),
      onSuccess: async () => {
        await this.listGoals(programId, true);
        snackbar.success(t.get('programs.goals.updated') || 'Goal updated');
        ok = true;
      },
      logContext: 'updateProgramGoal'
    });

    return ok;
  }

  async deleteGoal(programId: string, goalId: string): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.program)[':programId']['goals'][':goalId']['$delete']>({
      requestFn: () =>
        classroomio.program[':programId'].goals[':goalId'].$delete({
          param: { programId, goalId }
        }),
      onSuccess: async () => {
        await this.listGoals(programId, true);
        snackbar.success(t.get('programs.goals.deleted') || 'Goal deleted');
        ok = true;
      },
      logContext: 'deleteProgramGoal'
    });

    return ok;
  }

  async evaluateGoal(programId: string, goalId: string): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.program)[':programId']['goals'][':goalId']['evaluate']['$post']>({
      requestFn: () =>
        classroomio.program[':programId'].goals[':goalId'].evaluate.$post({
          param: { programId, goalId }
        }),
      onSuccess: async () => {
        await this.listGoals(programId, true);
        ok = true;
      },
      logContext: 'evaluateProgramGoal'
    });

    return ok;
  }

  async listMyGoals() {
    await this.execute<typeof classroomio.program.my.goals.$get>({
      requestFn: () => classroomio.program.my.goals.$get({}),
      onSuccess: (res) => {
        this.myGoals = res.data;
      },
      logContext: 'listMyGoals'
    });
  }

  async listOverview() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<typeof classroomio.program.goals.overview.$get>({
      requestFn: () => classroomio.program.goals.overview.$get({ query: { organizationId: org.id } }),
      onSuccess: (res) => {
        this.overviewRows = res.data.goals;
      },
      logContext: 'listGoalsOverview'
    });
  }
}

export const programGoalApi = new ProgramGoalApi();
