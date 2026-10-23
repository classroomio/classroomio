<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { toChartPoints } from '../../utils/insights-utils';
  import type { InsightsChartPoint, WidgetRendererProps } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const MIN_GRADED_SHARE = 0.25;

  const learnerCount = $derived(insightsApi.dashboard?.scope.learnerCount ?? 0);
  const points = $derived(
    toChartPoints(result, 'exercise', $t).map((point): InsightsChartPoint => {
      const graded = typeof point['is_graded__count_if'] === 'number' ? point['is_graded__count_if'] : 0;
      const hasEnough = learnerCount === 0 || graded / learnerCount >= MIN_GRADED_SHARE;

      return hasEnough
        ? point
        : { ...point, best_score_pct__avg: null, best_score_pct__p25: null, best_score_pct__p75: null };
    })
  );
</script>

<LineBandChart
  {points}
  keys={{ average: 'best_score_pct__avg', low: 'best_score_pct__p25', high: 'best_score_pct__p75' }}
  labels={{ average: $t('insights.legend.average'), band: $t('insights.legend.middle_half') }}
/>
<p class="ui:text-muted-foreground mt-2 text-xs">{$t('insights.notes.scores_by_exercise')}</p>
