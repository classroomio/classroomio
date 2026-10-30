<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { formatCount, textCell } from '../../utils/insights-utils';
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
      <SortableHead label={$t('insights.columns.course')} sortKey="course" {sort} onSort={handleSort} />
      <SortableHead
        label={$t('insights.columns.students')}
        sortKey="rows__count"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.avg_progress')}
        sortKey="progress_pct__avg"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.avg_score')}
        sortKey="avg_score_pct__avg"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.completed')}
        sortKey="is_completed__count_if"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.took_pass_mark')}
        sortKey="took_pass_mark__count_if"
        hint={$t('insights.column_hints.took_pass_mark')}
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
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['course_id'])}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[160px] whitespace-normal">{textCell(row, 'course_label')}</div>
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['rows__count'])}</Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['progress_pct__avg']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__avg']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['is_completed__count_if'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['took_pass_mark__count_if'])}</Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['first_try_pass__pooled']} /></Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
