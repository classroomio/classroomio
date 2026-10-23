<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  import {
    dimensionLabel,
    formatCount,
    formatPercent,
    numberCell,
    scoreTone,
    TONE_CELL_CLASS
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.section')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.exercises_taken')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.pass_rate')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.video')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.classroom')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row['section_id'] ?? `none-${index}`)}
      {@const averageScore = numberCell(row, 'section_score_pct__avg')}
      <Table.Row>
        <Table.Cell class="font-medium">{dimensionLabel(row, 'section', $t)}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">
          {formatCount(row['took_all__count_if'])} / {formatCount(row['rows__count'])}
        </Table.Cell>
        <Table.Cell class="text-right">
          <span class={cn('rounded-md px-2 py-1 text-xs tabular-nums', TONE_CELL_CLASS[scoreTone(averageScore)])}>
            {formatPercent(averageScore)}
          </span>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['passed_all_required__rate'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['video_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['attendance__pooled'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
