<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi, insightsStudentSheetApi } from '../../api';
  import { numberCell, textCell, toChartPoints } from '../../utils/insights-utils';
  import type { InsightsResult, InsightsRow } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  interface Props {
    result: InsightsResult;
    courseRow?: InsightsRow | null;
    studentName: string;
  }

  let { result, studentName }: Props = $props();

  const cohortResult = $derived(
    insightsApi.selection.courseId === insightsStudentSheetApi.courseId
      ? insightsApi.widgetResult('scores_by_exercise')
      : null
  );
  const studentScores = $derived(
    new Map(result.rows.map((row) => [textCell(row, 'exercise_id') ?? '', numberCell(row, 'best_score_pct__value')]))
  );
  const points = $derived(
    toChartPoints(cohortResult ?? result, 'exercise', $t).map((point) => {
      const studentScore = studentScores.get(point.key) ?? null;

      return { ...point, student: studentScore };
    })
  );
</script>

<LineBandChart
  {points}
  keys={{ average: 'best_score_pct__avg', overlay: 'student' }}
  labels={{ average: $t('insights.legend.cohort_average'), overlay: studentName }}
/>
