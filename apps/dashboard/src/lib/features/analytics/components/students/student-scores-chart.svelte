<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsStudentSheetApi } from '../../api';
  import { numberCell, textCell, toChartPoints } from '../../utils/analytics-utils';
  import type { AnalyticsResult } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  interface Props {
    result: AnalyticsResult;
    studentName: string;
  }

  let { result, studentName }: Props = $props();

  const cohortResult = $derived(
    analyticsApi.selection.courseId === analyticsStudentSheetApi.courseId
      ? analyticsApi.widgetResult('scores_by_exercise')
      : null
  );
  const averageLabel = $derived(
    analyticsApi.dashboard?.scope.type === 'path'
      ? $t('analytics.legend.path_average')
      : $t('analytics.legend.cohort_average')
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
  labels={{ average: averageLabel, overlay: studentName }}
/>
