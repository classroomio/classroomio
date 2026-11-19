<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../../api';
  import { focusStructure, SERIES_COLORS, sectionLabel, toChartPoints } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const SERIES_KEYS = ['section_score_pct__avg', 'video_pct__avg', 'attendance__pooled'] as const;

  const structure = $derived(focusStructure(analyticsApi.dashboard, analyticsApi.selection));
  const points = $derived(
    toChartPoints(result, 'section', $t).map((point) => {
      const label = sectionLabel(point.key, structure, $t, { withTitle: false });

      return { ...point, label };
    })
  );
  const series = $derived(
    SERIES_KEYS.map((key, index) => ({ key, label: $t(`analytics.measures.${key}`), color: SERIES_COLORS[index] }))
  );
</script>

<GroupedBarChart {points} {series} percent />
