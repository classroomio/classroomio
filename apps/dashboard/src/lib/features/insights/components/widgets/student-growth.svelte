<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { studentUsage } from '$lib/utils/store/org';

  import { insightsApi } from '../../api';
  import { formatCount, growthYMax, seatUsage, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import LineChart from '../charts/line-chart.svelte';
  import StudentTargetEditor from '../student-target-editor.svelte';

  let { result }: WidgetRendererProps = $props();

  const VALUE_KEY = 'members_total__value';

  const studentTarget = $derived(insightsApi.dashboard?.scope.studentTarget ?? null);
  const points = $derived(toChartPoints(result, 'period', $t));
  const target = $derived(studentTarget ? { value: studentTarget, label: $t('insights.legend.target') } : null);
  const seats = $derived(seatUsage(insightsApi.dashboard?.scope, $studentUsage));
  const yMax = $derived(growthYMax(points, VALUE_KEY, studentTarget, seats?.limit ?? null));
</script>

<div class="mb-2 flex items-center justify-between">
  {#if seats}
    <span class="ui:text-muted-foreground text-xs font-medium tabular-nums">
      {$t('insights.chips.seats', {
        used: formatCount(seats.used),
        limit: formatCount(seats.limit)
      })}
      {#if seats.notJoined > 0}
        · {$t('insights.chips.seats_not_joined', { count: formatCount(seats.notJoined) })}
      {/if}
    </span>
  {:else}
    <span></span>
  {/if}
  <StudentTargetEditor value={studentTarget} />
</div>
<LineChart {points} valueKey={VALUE_KEY} label={$t('insights.legend.enrolled_students')} {target} {yMax} />
