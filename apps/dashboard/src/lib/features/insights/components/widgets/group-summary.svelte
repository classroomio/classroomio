<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { dimensionLabel, formatCount, formatPercent, SERIES_COLORS, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const CHART_MEASURES = ['progress_pct__avg', 'avg_score_pct__avg', 'required_pass__pooled'] as const;

  const dimension = $derived(widget.spec.dimensions?.[0] ?? 'course');
  const points = $derived(toChartPoints(result, dimension, $t));
  const series = $derived(
    CHART_MEASURES.map((key, index) => ({ key, label: $t(`insights.measures.${key}`), color: SERIES_COLORS[index] }))
  );
</script>

<GroupedBarChart {points} {series} percent />

<Table.Root class="mt-4">
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t(`insights.columns.${dimension}`)}</Table.Head>
      <Table.Head class="text-right">{$t('insights.measures.rows__count')}</Table.Head>
      <Table.Head class="text-right">
        <span class="whitespace-normal">{$t('insights.measures.progress_pct__avg')}</span>
      </Table.Head>
      <Table.Head class="text-right">
        <span class="whitespace-normal">{$t('insights.measures.avg_score_pct__avg')}</span>
      </Table.Head>
      <Table.Head class="text-right">
        <span class="whitespace-normal">{$t('insights.measures.required_pass__pooled')}</span>
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row[`${dimension}_id`] ?? `none-${index}`)}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[140px] whitespace-normal">{dimensionLabel(row, dimension, $t)}</div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['rows__count'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['progress_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['required_pass__pooled'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
