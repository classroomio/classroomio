<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { studentUsage } from '$lib/utils/store/org';

  import { insightsApi } from '../../api';
  import { formatCount, growthYMax, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import LineChart from '../charts/line-chart.svelte';
  import StudentTargetEditor from '../student-target-editor.svelte';

  let { result }: WidgetRendererProps = $props();

  const VALUE_KEY = 'members_total__value';

  const studentTarget = $derived(insightsApi.dashboard?.scope.studentTarget ?? null);
  const points = $derived(toChartPoints(result, 'period', $t));
  const target = $derived(studentTarget ? { value: studentTarget, label: $t('insights.legend.target') } : null);
  const yMax = $derived(growthYMax(points, VALUE_KEY, studentTarget, $studentUsage?.limit ?? null));
</script>

<div class="mb-2 flex items-center justify-between">
  {#if $studentUsage?.limit}
    <span class="ui:text-muted-foreground text-xs font-medium tabular-nums">
      {$t('insights.chips.seats', {
        used: formatCount($studentUsage.used),
        limit: formatCount($studentUsage.limit)
      })}
    </span>
  {:else}
    <span></span>
  {/if}
  <StudentTargetEditor value={studentTarget} />
</div>
<LineChart {points} valueKey={VALUE_KEY} label={$t('insights.legend.enrolled_students')} {target} {yMax} />
