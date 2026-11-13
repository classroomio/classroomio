<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { studentUsage } from '$lib/utils/store/org';

  import { analyticsApi } from '../../api';
  import { formatCount, growthYMax, seatUsage, toChartPoints } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import LineChart from '../charts/line-chart.svelte';
  import StudentTargetEditor from '../student-target-editor.svelte';

  let { result }: WidgetRendererProps = $props();

  const VALUE_KEY = 'members_total__value';

  const studentTarget = $derived(analyticsApi.dashboard?.scope.studentTarget ?? null);
  const points = $derived(toChartPoints(result, 'period', $t));
  const target = $derived(studentTarget ? { value: studentTarget, label: $t('analytics.legend.target') } : null);
  const seats = $derived(seatUsage(analyticsApi.dashboard?.scope, $studentUsage));
  const yMax = $derived(growthYMax(points, VALUE_KEY, studentTarget, seats?.limit ?? null));
</script>

<div class="mb-2 flex items-center justify-between">
  {#if seats}
    <span class="ui:text-muted-foreground text-xs font-medium tabular-nums">
      {$t('analytics.chips.seats', {
        used: formatCount(seats.used),
        limit: formatCount(seats.limit)
      })}
      {#if seats.notJoined > 0}
        · {$t('analytics.chips.seats_not_joined', { count: formatCount(seats.notJoined) })}
      {/if}
    </span>
  {:else}
    <span></span>
  {/if}
  <StudentTargetEditor value={studentTarget} />
</div>
<LineChart {points} valueKey={VALUE_KEY} label={$t('analytics.legend.enrolled_students')} {target} {yMax} />
