<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi, insightsLearnersApi } from '../../api';
  import { LEARNER_DETAIL_ELEMENT_ID, numberCell, textCell, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const cohortResult = $derived(insightsApi.widgetResult('scores_by_exercise'));
  const learnerScores = $derived(
    new Map(result.rows.map((row) => [textCell(row, 'exercise_id') ?? '', numberCell(row, 'best_score_pct__value')]))
  );
  const points = $derived(
    toChartPoints(cohortResult ?? result, 'exercise', $t).map((point) => {
      const learnerScore = learnerScores.get(point.key) ?? null;

      return { ...point, learner: learnerScore };
    })
  );
  const selectedRow = $derived(
    insightsLearnersApi.rows.find((row) => row['learner_id'] === insightsApi.selection.learnerId)
  );
  const learnerName = $derived(textCell(selectedRow, 'name__value') ?? $t('insights.legend.learner'));
</script>

<div id={LEARNER_DETAIL_ELEMENT_ID} class="scroll-mt-24">
  <LineBandChart
    {points}
    keys={{ average: 'best_score_pct__avg', overlay: 'learner' }}
    labels={{ average: $t('insights.legend.cohort_average'), overlay: learnerName }}
  />
</div>
