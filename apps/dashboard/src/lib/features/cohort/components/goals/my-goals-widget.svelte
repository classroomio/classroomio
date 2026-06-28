<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import { cohortGoalApi } from '$features/cohort/api';

  interface Props {
    /** When set, only show goals from this cohort. */
    cohortId?: string;
  }

  let { cohortId }: Props = $props();

  onMount(() => {
    cohortGoalApi.listMyGoals();
  });

  const myGoals = $derived(cohortGoalApi.myGoals.filter((assignment) => !cohortId || assignment.cohortId === cohortId));

  function formatDue(assignment: (typeof cohortGoalApi.myGoals)[number]): string {
    if (!assignment.dueDate) return $t('cohorts.goals.lms.no_deadline');

    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const days = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (days < 0) return $t('cohorts.goals.lms.overdue');
    if (days === 0) return $t('cohorts.goals.lms.due_today');
    if (days === 1) return $t('cohorts.goals.lms.due_tomorrow');

    return $t('cohorts.goals.lms.due_in_days').replace('{days}', String(days));
  }

  function progressPct(assignment: (typeof cohortGoalApi.myGoals)[number]): number {
    if (assignment.requiredCount <= 0) return 0;
    return Math.min(100, Math.round((assignment.completedCount / assignment.requiredCount) * 100));
  }

  function statusVariant(status: string) {
    if (status === 'completed') return 'default';
    if (status === 'overdue') return 'destructive';
    if (status === 'at_risk') return 'outline';

    return 'secondary';
  }
</script>

{#if myGoals.length > 0}
  <section class="mb-4">
    <h3 class="mb-2 text-sm font-semibold">{$t('cohorts.goals.lms.heading')}</h3>
    <div class="flex flex-col gap-2">
      {#each myGoals as assignment (assignment.id)}
        <div class="flex flex-col gap-2 rounded-md border p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="font-medium">{assignment.goal.title}</p>
              {#if !cohortId}
                <p class="ui:text-muted-foreground text-xs">{assignment.cohortName}</p>
              {/if}
            </div>
            <Badge variant={statusVariant(assignment.status)}>
              {$t(`cohorts.goals.status.${assignment.status}`)}
            </Badge>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-xs">
            <span class="ui:text-muted-foreground">
              {assignment.completedCount}/{assignment.requiredCount} ({progressPct(assignment)}%)
            </span>
            <span
              class={assignment.status === 'overdue'
                ? 'text-red-600'
                : assignment.status === 'at_risk'
                  ? 'text-amber-700'
                  : 'ui:text-muted-foreground'}
            >
              {formatDue(assignment)}
            </span>
          </div>

          <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div class="h-full bg-emerald-500 transition-[width]" style="width: {progressPct(assignment)}%"></div>
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}
