<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../../api';
  import { dimensionLabel, formatCount, formatPercent, numberCell, textCell } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ProgressCell from '../progress-cell.svelte';
  import SortableHead from '../sortable-head.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const pageGroup = $derived(widget.pageGroup ?? widget.id);
  const sort = $derived(analyticsApi.pageState(pageGroup).sort);

  function handleSort(key: string) {
    void analyticsApi.setSort(pageGroup, key);
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <SortableHead label={$t('analytics.columns.path')} sortKey="path" {sort} onSort={handleSort} />
      <SortableHead
        label={$t('analytics.columns.courses')}
        sortKey="courses__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('analytics.columns.students')}
        sortKey="students__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('analytics.columns.avg_progress')}
        sortKey="avg_progress_pct__value"
        {sort}
        onSort={handleSort}
        class="min-w-[100px]"
      />
      <SortableHead
        label={$t('analytics.columns.completion_rate')}
        sortKey="completion_pct__pooled"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('analytics.columns.active_14d')}
        sortKey="active_students__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('analytics.columns.certificates')}
        sortKey="certificates__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['path_id'])}
      {@const publicId = textCell(row, 'path_public_id__value') ?? ''}
      {@const students = numberCell(row, 'students__value') ?? 0}
      <Table.Row>
        <Table.Cell class="font-medium">
          <a
            class="ui:text-primary min-w-[140px] whitespace-normal hover:underline"
            href={resolve(`/paths/${publicId}/analytics`, {})}
          >
            {dimensionLabel(row, 'path', $t)}
          </a>
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['courses__value'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(students)}</Table.Cell>
        <Table.Cell>
          {#if students === 0}
            <span class="ui:text-muted-foreground text-xs">{$t('analytics.no_students_yet')}</span>
          {:else}
            <ProgressCell value={row['avg_progress_pct__value']} />
          {/if}
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {students === 0 ? '–' : formatPercent(numberCell(row, 'completion_pct__pooled'))}
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums"
          >{students === 0 ? '–' : formatCount(row['active_students__value'])}</Table.Cell
        >
        <Table.Cell class="text-center tabular-nums">{formatCount(row['certificates__value'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
