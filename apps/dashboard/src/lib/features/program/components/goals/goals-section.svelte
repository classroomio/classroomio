<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { t } from '$lib/utils/functions/translations';
  import { programGoalApi } from '$features/program/api';
  import type { ProgramGoal } from '$features/program/utils/types';
  import GoalFormModal from './goal-form-modal.svelte';

  interface Props {
    programId: string;
    canManage: boolean;
  }

  let { programId, canManage }: Props = $props();

  let isModalOpen = $state(false);
  let editingGoal = $state<ProgramGoal | null>(null);

  const goals = $derived(programGoalApi.goalsFor(programId));

  onMount(() => {
    programGoalApi.listGoals(programId);
  });

  function openCreate() {
    editingGoal = null;
    isModalOpen = true;
  }

  function openEdit(goal: ProgramGoal) {
    editingGoal = goal;
    isModalOpen = true;
  }

  async function deleteGoal(goal: ProgramGoal) {
    const confirmMessage = $t('programs.goals.delete_confirm');
    if (!confirm(confirmMessage)) return;

    await programGoalApi.deleteGoal(programId, goal.id);
  }

  function summarizeDeadline(goal: ProgramGoal) {
    if (goal.deadlineKind === 'none') return $t('programs.goals.lms.no_deadline');
    if (goal.deadlineKind === 'absolute' && goal.deadlineDate) {
      return new Date(goal.deadlineDate).toLocaleDateString();
    }

    if (goal.deadlineKind === 'relative_to_join' && goal.relativeDays) {
      return `+${goal.relativeDays}d after join`;
    }

    if (goal.deadlineKind === 'recurring' && goal.recurringMonths) {
      return `Repeats every ${goal.recurringMonths}mo`;
    }

    return $t('programs.goals.lms.no_deadline');
  }

  function totalLearners(goal: ProgramGoal): number {
    return Object.values(goal.statusCounts ?? {}).reduce((sum, value) => sum + (value ?? 0), 0);
  }

  function statusValue(goal: ProgramGoal, status: string): number {
    return goal.statusCounts?.[status] ?? 0;
  }
</script>

<section>
  <div class="mb-3 flex items-start justify-between gap-3">
    <div>
      <h2 class="text-sm font-semibold">{$t('programs.goals.heading')}</h2>
      <p class="ui:text-muted-foreground mt-1 text-xs">{$t('programs.goals.description')}</p>
    </div>
    {#if canManage}
      <Button variant="secondary" onclick={openCreate}>
        <PlusIcon size={16} />
        {$t('programs.goals.add')}
      </Button>
    {/if}
  </div>

  {#if goals.length === 0}
    <div class="rounded-md border p-6 text-center">
      <p class="text-sm font-medium">{$t('programs.goals.empty_title')}</p>
      <p class="ui:text-muted-foreground mt-1 text-xs">{$t('programs.goals.empty_description')}</p>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each goals as goal (goal.id)}
        {@const total = totalLearners(goal)}
        {@const completed = statusValue(goal, 'completed')}
        {@const overdue = statusValue(goal, 'overdue')}
        {@const atRisk = statusValue(goal, 'at_risk')}
        <div class="flex flex-col gap-3 rounded-md border p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium">{goal.title}</p>
                <Badge variant="outline">{$t(`programs.goals.type.${goal.type}`)}</Badge>
              </div>
              {#if goal.description}
                <p class="ui:text-muted-foreground mt-1 text-sm">{goal.description}</p>
              {/if}
              <p class="ui:text-muted-foreground mt-2 text-xs">
                {goal.courseIds.length} courses · {summarizeDeadline(goal)}
              </p>
            </div>
            {#if canManage}
              <div class="flex items-center gap-1">
                <IconButton onclick={() => openEdit(goal)}>
                  <PencilIcon size={16} />
                </IconButton>
                <IconButton onclick={() => deleteGoal(goal)}>
                  <TrashIcon size={16} />
                </IconButton>
              </div>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="rounded border p-2 text-center">
              <p class="ui:text-muted-foreground text-xs">{$t('programs.goals.status.completed')}</p>
              <p class="text-base font-semibold">{completed}/{total}</p>
            </div>
            <div class="rounded border p-2 text-center">
              <p class="ui:text-muted-foreground text-xs">{$t('programs.goals.status.in_progress')}</p>
              <p class="text-base font-semibold">{statusValue(goal, 'in_progress')}</p>
            </div>
            <div class="rounded border p-2 text-center {atRisk > 0 ? 'bg-amber-50' : ''}">
              <p class="ui:text-muted-foreground text-xs">{$t('programs.goals.status.at_risk')}</p>
              <p class="text-base font-semibold">{atRisk}</p>
            </div>
            <div class="rounded border p-2 text-center {overdue > 0 ? 'bg-red-50' : ''}">
              <p class="ui:text-muted-foreground text-xs">{$t('programs.goals.status.overdue')}</p>
              <p class="text-base font-semibold">{overdue}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<GoalFormModal bind:open={isModalOpen} {programId} goal={editingGoal} onClose={() => (isModalOpen = false)} />
