<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import { programGoalApi } from '$features/program/api';
  import type { ProgramGoal } from '$features/program/utils/types';

  interface Props {
    programId: string;
  }

  let { programId }: Props = $props();

  const goals = $derived(programGoalApi.goalsFor(programId));

  onMount(() => {
    programGoalApi.listGoals(programId);
  });

  function totalLearners(goal: ProgramGoal): number {
    return Object.values(goal.statusCounts ?? {}).reduce((sum, value) => sum + (value ?? 0), 0);
  }

  function statusValue(goal: ProgramGoal, status: string): number {
    return goal.statusCounts?.[status] ?? 0;
  }

  function onTrackPct(goal: ProgramGoal): number {
    const total = totalLearners(goal);
    if (total === 0) return 0;
    const onTrack =
      statusValue(goal, 'completed') + statusValue(goal, 'in_progress') + statusValue(goal, 'not_started');
    return Math.round((onTrack / total) * 100);
  }
</script>

{#if goals.length > 0}
  <section class="mb-4">
    <h3 class="mb-2 text-sm font-semibold">{$t('programs.goals.heading')}</h3>
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {#each goals as goal (goal.id)}
        {@const total = totalLearners(goal)}
        {@const completed = statusValue(goal, 'completed')}
        {@const overdue = statusValue(goal, 'overdue')}
        {@const atRisk = statusValue(goal, 'at_risk')}
        <div class="flex flex-col gap-2 rounded-md border p-3">
          <div class="flex items-start justify-between gap-2">
            <p class="line-clamp-2 text-sm font-medium">{goal.title}</p>
            <Badge variant="outline">{$t(`programs.goals.type.${goal.type}`)}</Badge>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-semibold">{onTrackPct(goal)}%</span>
            <span class="ui:text-muted-foreground text-xs">{$t('programs.goals.tile.on_track')}</span>
          </div>
          <div class="flex flex-wrap gap-3 text-xs">
            <span>
              <span class="font-medium">{completed}/{total}</span>
              {' '}{$t('programs.goals.tile.completed_short')}
            </span>
            {#if atRisk > 0}
              <span class="text-amber-700">
                <span class="font-medium">{atRisk}</span>
                {' '}{$t('programs.goals.tile.at_risk_short')}
              </span>
            {/if}
            {#if overdue > 0}
              <span class="text-red-600">
                <span class="font-medium">{overdue}</span>
                {' '}{$t('programs.goals.tile.overdue_short')}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}
