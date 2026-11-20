<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { donutTotal, toPathStatusSegments } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import DonutChart from '../charts/donut-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const segments = $derived(toPathStatusSegments(result, $t));
</script>

<DonutChart {segments} centerLabel={$t('analytics.donut.students', { count: donutTotal(segments) })} />
