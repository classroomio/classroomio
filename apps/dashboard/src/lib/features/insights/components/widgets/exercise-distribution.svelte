<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { histogramPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnChart from '../charts/column-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const points = $derived(histogramPoints(result, 'score_bucket_10', $t));
</script>

<ColumnChart {points} valueKey="rows__count" label={$t('insights.measures.rows__count')} />
