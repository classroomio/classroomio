<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { toChartPoints } from '../../utils/insights-utils';
  import type { InsightsChartPoint, WidgetRendererProps } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const MIN_GRADED_SHARE = 0.25;

  const studentCount = $derived(insightsApi.dashboard?.scope.studentCount ?? 0);
  const averageLabel = $derived(
    insightsApi.dashboard?.scope.type === 'course'
      ? $t('insights.legend.all_students')
      : $t('insights.legend.cohort_average')
  );
  const points = $derived(
    toChartPoints(result, 'exercise', $t).map((point): InsightsChartPoint => {
      const graded = typeof point['is_graded__count_if'] === 'number' ? point['is_graded__count_if'] : 0;
      const hasEnough = studentCount === 0 || graded / studentCount >= MIN_GRADED_SHARE;

      return hasEnough
        ? point
        : { ...point, best_score_pct__avg: null, best_score_pct__p25: null, best_score_pct__p75: null };
    })
  );
</script>

<LineBandChart
  {points}
  keys={{ average: 'best_score_pct__avg', low: 'best_score_pct__p25', high: 'best_score_pct__p75' }}
  labels={{ average: averageLabel, band: $t('insights.legend.middle_half') }}
/>
