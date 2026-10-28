<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import {
    cohortHealth,
    dimensionLabel,
    formatCount,
    formatShortDate,
    hasStudents,
    numberCell,
    textCell
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import HeatCell from '../heat-cell.svelte';
  import InsightsPill from '../insights-pill.svelte';
  import ProgressCell from '../progress-cell.svelte';
  import SortableHead from '../sortable-head.svelte';
  import StatusBadge from '../status-badge.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const pageGroup = $derived(widget.pageGroup ?? widget.id);
  const sort = $derived(insightsApi.pageState(pageGroup).sort);

  function handleSort(key: string) {
    void insightsApi.setSort(pageGroup, key);
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <SortableHead label={$t('insights.columns.cohort')} sortKey="cohort" {sort} onSort={handleSort} />
      <SortableHead
        label={$t('insights.columns.created')}
        sortKey="cohort_created_at__value"
        {sort}
        onSort={handleSort}
      />
      <SortableHead
        label={$t('insights.columns.students')}
        sortKey="students__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.avg_progress')}
        sortKey="avg_progress_pct__value"
        {sort}
        onSort={handleSort}
        class="min-w-[100px]"
      />
      <SortableHead
        label={$t('insights.columns.avg_score')}
        sortKey="avg_score_pct__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.overdue')}
        sortKey="overdue_students__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <Table.Head>{$t('insights.columns.health')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['cohort_id'])}
      {@const cohortId = textCell(row, 'cohort_id') ?? ''}
      {@const health = cohortHealth(row)}
      {@const pendingInvites = numberCell(row, 'pending_invites__value') ?? 0}
      {@const isEmptyCohort = !hasStudents(row)}
      <Table.Row>
        <Table.Cell class="font-medium">
          <a
            class="ui:text-primary min-w-[140px] whitespace-normal hover:underline"
            href={resolve(`/cohorts/${cohortId}/analytics`, {})}
          >
            {dimensionLabel(row, 'cohort', $t)}
          </a>
        </Table.Cell>
        <Table.Cell class="whitespace-nowrap">{formatShortDate(row['cohort_created_at__value'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {formatCount(row['students__value'])}
          {#if pendingInvites > 0}
            <span class="ui:text-muted-foreground block text-xs">
              {$t('insights.invited', { count: pendingInvites })}
            </span>
          {/if}
        </Table.Cell>
        <Table.Cell>
          {#if isEmptyCohort}
            <span class="ui:text-muted-foreground text-xs">{$t('insights.no_students_yet')}</span>
          {:else}
            <ProgressCell value={row['avg_progress_pct__value']} />
          {/if}
        </Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {isEmptyCohort ? '–' : formatCount(row['overdue_students__value'])}
        </Table.Cell>
        <Table.Cell>
          {#if health}
            <StatusBadge status={health} />
          {:else}
            <InsightsPill tone="none">{$t('insights.no_students')}</InsightsPill>
          {/if}
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
