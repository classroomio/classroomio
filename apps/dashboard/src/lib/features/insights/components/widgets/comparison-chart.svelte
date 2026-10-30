<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { SERIES_COLORS, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const SERIES_BY_SOURCE: Record<string, readonly string[]> = {
    student_course: ['progress_pct__avg', 'avg_score_pct__avg', 'first_try_pass__pooled'],
    cohort_summary: ['avg_progress_pct__value', 'avg_score_pct__value', 'first_try_pass__pooled']
  };

  const dimension = $derived(widget.spec.dimensions?.[0] ?? 'course');
  const points = $derived(toChartPoints(result, dimension, $t));
  const series = $derived(
    (SERIES_BY_SOURCE[widget.spec.source] ?? []).map((key, index) => ({
      key,
      label: $t(`insights.measures.${key}`),
      color: SERIES_COLORS[index % SERIES_COLORS.length]
    }))
  );
</script>

<GroupedBarChart {points} {series} percent />
