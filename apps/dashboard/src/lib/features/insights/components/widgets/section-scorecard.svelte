<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { focusStructure, formatCount, formatPercent, numberCell, sectionLabel } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnHeader from '../column-header.svelte';
  import HeatCell from '../heat-cell.svelte';

  let { result }: WidgetRendererProps = $props();

  const structure = $derived(focusStructure(insightsApi.dashboard, insightsApi.selection));
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.section')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.exercises_taken')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.avg_score')}</Table.Head>
      <Table.Head class="text-center">
        <ColumnHeader
          label={$t('insights.columns.passed_first_try')}
          hint={$t('insights.column_hints.section_passed_first_try')}
        />
      </Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.video_attendance')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.classroom_attendance')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row['section_id'] ?? `none-${index}`)}
      {@const tookAll = numberCell(row, 'took_all__count_if') ?? 0}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[180px] whitespace-normal">
            {sectionLabel(row['section_id'], structure, $t, { withTitle: true })}
          </div>
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {tookAll > 0 ? `${formatCount(tookAll)} / ${formatCount(row['rows__count'])}` : '–'}
        </Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['section_score_pct__avg']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['passed_first_try__rate']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatPercent(row['video_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatPercent(row['attendance__pooled'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
