<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import * as Page from '@cio/ui/base/page';
  import * as Table from '@cio/ui/base/table';
  import { Badge } from '@cio/ui/base/badge';
  import { Empty } from '@cio/ui/custom/empty';
  import { GoalIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { cohortGoalApi } from '$features/cohort/api';
  import type { GoalsOverviewRow } from '$features/cohort/utils/types';

  onMount(() => {
    cohortGoalApi.listOverview();
  });

  const overviewRows = $derived(cohortGoalApi.overviewRows);

  const cohorts = $derived.by(() => {
    const map = new Map<string, { cohortId: string; cohortName: string; goals: GoalsOverviewRow[] }>();

    for (const row of overviewRows) {
      const bucket = map.get(row.cohortId) ?? {
        cohortId: row.cohortId,
        cohortName: row.cohortName,
        goals: []
      };
      bucket.goals.push(row);
      map.set(row.cohortId, bucket);
    }

    return [...map.values()].sort((a, b) => a.cohortName.localeCompare(b.cohortName));
  });

  function aggregateOnTrackPct(rows: GoalsOverviewRow[]): number {
    if (rows.length === 0) return 0;
    const total = rows.reduce((sum, row) => sum + row.totalLearners, 0);
    if (total === 0) return 0;
    const onTrack = rows.reduce((sum, row) => sum + (row.totalLearners - row.atRiskCount - row.overdueCount), 0);
    return Math.round((onTrack / total) * 100);
  }

  function aggregateCount(rows: GoalsOverviewRow[], field: keyof GoalsOverviewRow): number {
    return rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0);
  }
</script>

<svelte:head>
  <title>{$t('cohorts.goals.heading')} · ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('cohorts.goals.heading')}</Page.Title>
      <Page.Subtitle>{$t('cohorts.goals.description')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if !cohortGoalApi.isLoading && overviewRows.length === 0}
        <Empty
          title={$t('cohorts.goals.empty_title')}
          description={$t('cohorts.goals.empty_description')}
          icon={GoalIcon}
          variant="page"
        />
      {:else}
        <div class="flex w-full flex-col gap-6 p-4">
          {#each cohorts as cohort (cohort.cohortId)}
            {@const onTrackPct = aggregateOnTrackPct(cohort.goals)}
            {@const totalLearners = aggregateCount(cohort.goals, 'totalLearners')}
            {@const overdueLearners = aggregateCount(cohort.goals, 'overdueCount')}
            {@const atRiskLearners = aggregateCount(cohort.goals, 'atRiskCount')}
            <section class="flex flex-col gap-3 rounded-md border p-4">
              <header class="flex flex-wrap items-baseline justify-between gap-3">
                <a
                  href={resolve(`/cohorts/${cohort.cohortId}/settings`, {})}
                  class="text-base font-semibold hover:underline"
                >
                  {cohort.cohortName}
                </a>
                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="ui:text-muted-foreground">
                    <span class="text-base font-semibold text-emerald-600">{onTrackPct}%</span>
                    {$t('cohorts.goals.tile.on_track')}
                  </span>
                  <span class="ui:text-muted-foreground">
                    <span class="font-medium">{totalLearners}</span> learners
                  </span>
                  {#if atRiskLearners > 0}
                    <span class="text-amber-700">
                      <span class="font-medium">{atRiskLearners}</span>
                      {$t('cohorts.goals.tile.at_risk_short')}
                    </span>
                  {/if}
                  {#if overdueLearners > 0}
                    <span class="text-red-600">
                      <span class="font-medium">{overdueLearners}</span>
                      {$t('cohorts.goals.tile.overdue_short')}
                    </span>
                  {/if}
                </div>
              </header>

              <div class="rounded-md border">
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head>Goal</Table.Head>
                      <Table.Head>Type</Table.Head>
                      <Table.Head>{$t('cohorts.goals.status.completed')}</Table.Head>
                      <Table.Head>{$t('cohorts.goals.status.in_progress')}</Table.Head>
                      <Table.Head>{$t('cohorts.goals.status.at_risk')}</Table.Head>
                      <Table.Head>{$t('cohorts.goals.status.overdue')}</Table.Head>
                      <Table.Head>{$t('cohorts.goals.tile.on_track')}</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each cohort.goals as goal (goal.goalId)}
                      <Table.Row>
                        <Table.Cell class="font-medium">{goal.title}</Table.Cell>
                        <Table.Cell>
                          <Badge variant="outline">{$t(`cohorts.goals.type.${goal.type}`)}</Badge>
                        </Table.Cell>
                        <Table.Cell>{goal.completedCount}/{goal.totalLearners}</Table.Cell>
                        <Table.Cell>{goal.inProgressCount}</Table.Cell>
                        <Table.Cell class={goal.atRiskCount > 0 ? 'text-amber-700' : ''}>
                          {goal.atRiskCount}
                        </Table.Cell>
                        <Table.Cell class={goal.overdueCount > 0 ? 'text-red-600' : ''}>
                          {goal.overdueCount}
                        </Table.Cell>
                        <Table.Cell>{goal.onTrackPct}%</Table.Cell>
                      </Table.Row>
                    {/each}
                  </Table.Body>
                </Table.Root>
              </div>
            </section>
          {/each}
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
