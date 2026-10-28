<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { dimensionLabel, formatCount, hasStudents } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import HeatCell from '../heat-cell.svelte';
  import SortableHead from '../sortable-head.svelte';

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
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.avg_score')}
        sortKey="avg_score_pct__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.passed_first_try')}
        sortKey="first_try_pass__pooled"
        hint={$t('insights.column_hints.passed_first_try')}
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
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['cohort_id'])}
      {@const isEmptyCohort = !hasStudents(row)}
      <Table.Row>
        <Table.Cell class="font-medium">{dimensionLabel(row, 'cohort', $t)}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['students__value'])}</Table.Cell>
        <Table.Cell class="text-center">
          {#if isEmptyCohort}
            <span class="ui:text-muted-foreground text-xs">{$t('insights.no_students_yet')}</span>
          {:else}
            <HeatCell value={row['avg_progress_pct__value']} />
          {/if}
        </Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['first_try_pass__pooled']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {isEmptyCohort ? '–' : formatCount(row['overdue_students__value'])}
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
