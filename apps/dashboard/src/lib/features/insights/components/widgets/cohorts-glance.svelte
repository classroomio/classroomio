<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import {
    cohortHealth,
    dimensionLabel,
    formatCount,
    formatPercent,
    numberCell,
    textCell,
    toHealthSegments
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import DonutChart from '../charts/donut-chart.svelte';
  import StatusBadge from '../status-badge.svelte';

  let { result }: WidgetRendererProps = $props();
</script>

<div class="mb-6">
  <DonutChart segments={toHealthSegments(result, $t)} />
</div>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.cohort')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.measures.rows__count')}</Table.Head>
      <Table.Head class="min-w-[160px]">{$t('insights.columns.progress')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.flags.overdue')}</Table.Head>
      <Table.Head>{$t('insights.columns.health')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row['cohort_id'] ?? `none-${index}`)}
      {@const cohortId = textCell(row, 'cohort_id')}
      {@const progress = numberCell(row, 'overall_progress_pct__avg') ?? 0}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[160px] whitespace-normal">
            {#if cohortId}
              <a class="ui:text-primary hover:underline" href={resolve(`/cohorts/${cohortId}/analytics`, {})}>
                {dimensionLabel(row, 'cohort', $t)}
              </a>
            {:else}
              {dimensionLabel(row, 'cohort', $t)}
            {/if}
          </div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['rows__count'])}</Table.Cell>
        <Table.Cell>
          <div class="flex items-center gap-2">
            <div class="ui:bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div class="ui:bg-primary h-full rounded-full" style="width: {Math.min(100, progress)}%"></div>
            </div>
            <span class="w-10 text-right text-xs tabular-nums">{formatPercent(progress)}</span>
          </div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['is_overdue__count_if'])}</Table.Cell>
        <Table.Cell><StatusBadge status={cohortHealth(row)} /></Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
