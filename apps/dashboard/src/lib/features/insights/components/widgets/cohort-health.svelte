<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { donutTotal, toHealthSegments } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import DonutChart from '../charts/donut-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const segments = $derived(toHealthSegments(result, $t));
</script>

<DonutChart {segments} centerLabel={$t('insights.donut.students', { count: donutTotal(segments) })} />
