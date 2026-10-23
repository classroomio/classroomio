<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnChart from '../charts/column-chart.svelte';
  import ExercisePicker from '../exercise-picker.svelte';

  let { result }: WidgetRendererProps = $props();

  const courseId = $derived(insightsApi.dashboard?.scope.courses[0]?.id ?? null);
  const exercises = $derived(
    (courseId ? insightsApi.dashboard?.structures[courseId]?.items : [])?.filter((item) => item.type === 'EXERCISE') ??
      []
  );
  const points = $derived(toChartPoints(result, 'score_bucket_10', $t));
</script>

<div class="mb-3 flex justify-end">
  <ExercisePicker
    {exercises}
    value={insightsApi.selection.exerciseId}
    onChange={(id) => insightsApi.selectExercise(id)}
  />
</div>
<ColumnChart {points} valueKey="rows__count" label={$t('insights.measures.rows__count')} />
